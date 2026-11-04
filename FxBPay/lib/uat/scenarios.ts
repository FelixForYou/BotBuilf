/**
 * Pusat pengujian DANA. Tiga kategori yang dipisah tegas:
 *  - local    : pengujian logika FxB Pay (ledger, idempotensi, verifikasi signature) memakai test harness lokal.
 *  - sandbox  : panggilan nyata ke DANA Sandbox (api.sandbox.dana.id) dengan kredensial sandbox.
 *  - official : status UAT resmi di Merchant Portal DANA — TIDAK ada API untuk membacanya,
 *               jadi dicatat manual oleh admin dan diberi label jelas.
 */
import "server-only";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { payments, providerNotifications, testRuns, users, withdrawals } from "../db/schema";
import { hashPassword } from "../password";
import { randomToken } from "../crypto";
import { getUserBalances, verifyLedgerIntegrity } from "../ledger";
import { createPayment, releaseHeldFunds, startCheckout, sweepExpired, syncWithProvider } from "../payments/service";
import { requestRefund } from "../refunds";
import { requestWithdrawal, reviewWithdrawal } from "../withdrawals";
import { SYSTEM } from "../audit";
import { redact } from "../redact";
import { DanaClient } from "../dana/client";
import { checkConfigRow, getConfigRow, loadDanaConfig } from "../dana/config";
import { DANA_BASE_URL, DANA_PATHS, isSnapSuccess, PG_SERVICE_CODE } from "../dana/constants";
import { buildFinishNotify, ensureHarnessKey, sendHarnessNotify } from "./harness";

export type Category = "local" | "sandbox" | "official";
type Outcome = { pass: boolean; detail: string; request?: unknown; response?: unknown; responseCode?: string | null };
export type Scenario = {
  code: string;
  category: Category;
  title: string;
  description: string;
  automated: boolean;
  steps?: string[];
  requiresSandboxConfig?: boolean;
  run?: (ctx: Ctx) => Promise<Outcome>;
};
type Ctx = { botId: string };

export const UAT_BOT_EMAIL = "uat-bot@fxbpay.internal";

async function ensureBot(): Promise<string> {
  const [b] = await db.select({ id: users.id }).from(users).where(eq(users.email, UAT_BOT_EMAIL));
  if (b) return b.id;
  const [n] = await db
    .insert(users)
    .values({ email: UAT_BOT_EMAIL, passwordHash: await hashPassword(randomToken(24)), name: "UAT Bot", storeName: "Akun Uji Internal (sandbox)", role: "user", emailVerifiedAt: new Date() })
    .onConflictDoNothing()
    .returning({ id: users.id });
  if (n) return n.id;
  const [again] = await db.select({ id: users.id }).from(users).where(eq(users.email, UAT_BOT_EMAIL));
  return again.id;
}

async function demoPayment(botId: string, amount = 100_000n, minutes = 30) {
  return createPayment(botId, "sandbox", { amount, description: "Uji otomatis", expiresInMinutes: minutes, providerOverride: "demo", via: "uat", feeBearer: "merchant" });
}
const getPay = async (id: string) => (await db.select().from(payments).where(eq(payments.id, id)))[0];

const LOCAL: Scenario[] = [
  {
    code: "local.pay_success",
    category: "local",
    title: "Pembayaran berhasil",
    description: "Notifikasi status 00 bertanda tangan valid → status LUNAS dan saldo bertambah sebesar nominal bersih.",
    automated: true,
    run: async ({ botId }) => {
      const before = await getUserBalances(db, botId, "sandbox");
      const p = await demoPayment(botId);
      const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }));
      const after = await getUserBalances(db, botId, "sandbox");
      const delta = after.available + after.held - before.available - before.held;
      const pay = await getPay(p.id);
      return { pass: r.response.outcome === "credited" && pay.status === "PAID" && delta === p.net, detail: `outcome=${r.response.outcome}, status=${pay.status}, saldo +${delta} (diharapkan +${p.net})`, request: r.request, response: r.response, responseCode: r.response.body.responseCode };
    },
  },
  {
    code: "local.pay_closed",
    category: "local",
    title: "Pembayaran gagal / ditutup",
    description: "Notifikasi status 05 sebelum lunas → status DIBATALKAN, saldo tidak berubah.",
    automated: true,
    run: async ({ botId }) => {
      const before = await getUserBalances(db, botId, "sandbox");
      const p = await demoPayment(botId);
      const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "05" }));
      const after = await getUserBalances(db, botId, "sandbox");
      const pay = await getPay(p.id);
      return { pass: pay.status === "CANCELLED" && after.available === before.available && after.held === before.held, detail: `status=${pay.status}, saldo tidak berubah=${after.held === before.held}`, request: r.request, response: r.response, responseCode: r.response.body.responseCode };
    },
  },
  {
    code: "local.expired",
    category: "local",
    title: "Pembayaran kedaluwarsa",
    description: "Link melewati masa berlaku → job penyapu menandai KEDALUWARSA tanpa mengubah saldo.",
    automated: true,
    run: async ({ botId }) => {
      const p = await demoPayment(botId);
      await db.update(payments).set({ expiresAt: new Date(Date.now() - 5 * 60_000) }).where(eq(payments.id, p.id));
      const s = await sweepExpired();
      const pay = await getPay(p.id);
      return { pass: pay.status === "EXPIRED", detail: `status=${pay.status}, disapu=${s.expired}` };
    },
  },
  {
    code: "local.invalid_signature",
    category: "local",
    title: "Signature salah ditolak",
    description: "Notifikasi yang ditandatangani kunci tak dikenal, atau body diubah setelah ditandatangani, harus ditolak (HTTP 401) dan tidak mengubah apa pun.",
    automated: true,
    run: async ({ botId }) => {
      const p = await demoPayment(botId);
      const rogue = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey;
      const a = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }), { signWith: rogue });
      const b = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }), { tamperBody: true });
      const pay = await getPay(p.id);
      const pass = a.response.httpStatus === 401 && b.response.httpStatus === 401 && pay.status !== "PAID";
      return { pass, detail: `kunci asing → ${a.response.httpStatus}, body diubah → ${b.response.httpStatus}, status=${pay.status}`, request: [a.request, b.request], response: [a.response, b.response], responseCode: a.response.body.responseCode };
    },
  },
  {
    code: "local.duplicate_callback",
    category: "local",
    title: "Callback duplikat",
    description: "Notifikasi lunas yang sama dikirim 3 kali → saldo hanya bertambah sekali.",
    automated: true,
    run: async ({ botId }) => {
      const before = await getUserBalances(db, botId, "sandbox");
      const p = await demoPayment(botId);
      const n = buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" });
      const outs = [];
      for (let i = 0; i < 3; i++) outs.push((await sendHarnessNotify(n)).response.outcome);
      const after = await getUserBalances(db, botId, "sandbox");
      const delta = after.available + after.held - before.available - before.held;
      return { pass: delta === p.net && outs.filter((o) => o === "credited").length === 1, detail: `hasil=${outs.join(", ")}, saldo +${delta}`, response: outs };
    },
  },
  {
    code: "local.amount_mismatch",
    category: "local",
    title: "Nominal tidak cocok",
    description: "Notifikasi lunas dengan nominal berbeda dari tagihan → tidak dikreditkan, ditandai untuk tinjauan admin.",
    automated: true,
    run: async ({ botId }) => {
      const before = await getUserBalances(db, botId, "sandbox");
      const p = await demoPayment(botId);
      const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount - 1000n, status: "00" }));
      const after = await getUserBalances(db, botId, "sandbox");
      const pay = await getPay(p.id);
      return { pass: r.response.outcome === "amount_mismatch" && pay.status !== "PAID" && pay.needsReview && after.held === before.held, detail: `outcome=${r.response.outcome}, perlu tinjauan=${pay.needsReview}`, request: r.request, response: r.response };
    },
  },
  {
    code: "local.timeout",
    category: "local",
    title: "Timeout ke DANA",
    description: "Klien DANA yang tidak mendapat respons berhenti tepat waktu dan melaporkan 'timeout' tanpa menganggap pembayaran berhasil.",
    automated: true,
    run: async () => {
      const kp = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
      const hanging: typeof fetch = (_u, init) => new Promise((_res, rej) => init?.signal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "TimeoutError" }))));
      const client = new DanaClient(
        { env: "sandbox", partnerId: "TEST", merchantId: "TEST", subMerchantId: "", externalStoreId: "", origin: "https://example.test", mcc: "5732", privateKey: kp.privateKey, danaPublicKey: null, clientSecret: null, qrisEnabled: false, disbursementEnabled: false, merchantApproval: "not_started" },
        { fetcher: hanging, timeoutMs: 400 },
      );
      const r = await client.queryPayment({ partnerReferenceNo: "TIMEOUT-TEST" });
      return { pass: r.outcome === "timeout" && r.durationMs < 3000 && !r.ok, detail: `outcome=${r.outcome}, durasi=${r.durationMs} ms`, request: r.request, response: { outcome: r.outcome, error: r.error } };
    },
  },
  {
    code: "local.late_callback",
    category: "local",
    title: "Callback terlambat",
    description: "Pembayaran sudah KEDALUWARSA lalu DANA mengirim status lunas → uang tetap dicatat, ditandai 'callback terlambat' untuk tinjauan.",
    automated: true,
    run: async ({ botId }) => {
      const p = await demoPayment(botId);
      await db.update(payments).set({ expiresAt: new Date(Date.now() - 5 * 60_000) }).where(eq(payments.id, p.id));
      await sweepExpired();
      const mid = await getPay(p.id);
      const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }));
      const pay = await getPay(p.id);
      return { pass: mid.status === "EXPIRED" && pay.status === "PAID" && pay.lateCallback, detail: `sebelum=${mid.status}, sesudah=${pay.status}, lateCallback=${pay.lateCallback}`, response: r.response };
    },
  },
  {
    code: "local.out_of_order",
    category: "local",
    title: "Callback tidak berurutan",
    description: "Status 05 yang datang setelah status lunas diabaikan; pembayaran tetap LUNAS.",
    automated: true,
    run: async ({ botId }) => {
      const p = await demoPayment(botId);
      await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }));
      const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "05" }));
      const pay = await getPay(p.id);
      return { pass: pay.status === "PAID" && r.response.outcome === "ignored_out_of_order", detail: `outcome=${r.response.outcome}, status=${pay.status}`, response: r.response };
    },
  },
  {
    code: "local.race_condition",
    category: "local",
    title: "Race condition",
    description: "12 notifikasi lunas paralel → tepat satu kredit. Lalu 6 penarikan paralel yang masing-masing > separuh saldo → paling banyak satu berhasil, saldo tidak pernah negatif.",
    automated: true,
    run: async ({ botId }) => {
      const before = await getUserBalances(db, botId, "sandbox");
      const p = await demoPayment(botId, 200_000n);
      const n = buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" });
      const outs = await Promise.all(Array.from({ length: 12 }, () => sendHarnessNotify(n).then((x) => x.response.outcome)));
      const mid = await getUserBalances(db, botId, "sandbox");
      const credited = outs.filter((o) => o === "credited").length;
      await db.update(payments).set({ heldUntil: new Date(Date.now() - 1000) }).where(and(eq(payments.userId, botId), sql`released_at IS NULL`));
      await releaseHeldFunds();
      const avail = (await getUserBalances(db, botId, "sandbox")).available;
      const each = avail / 2n + 1000n;
      const results = await Promise.allSettled(
        Array.from({ length: 6 }, (_v, i) => requestWithdrawal(SYSTEM, botId, "sandbox", { amount: each, destinationType: "bank", destinationBank: "BANK UJI", destinationAccount: "1234567890", destinationName: "UAT Bot", idempotencyKey: `race-${p.id}-${i}` })),
      );
      const ok = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ id: string }>[];
      const after = await getUserBalances(db, botId, "sandbox");
      for (const w of ok) await reviewWithdrawal(SYSTEM, w.value.id, { action: "reject", reason: "Pembersihan uji race condition" });
      const pass = credited === 1 && mid.held + mid.available - before.held - before.available === p.net && ok.length <= 1 && after.available >= 0n;
      return { pass, detail: `kredit=${credited}/12; penarikan berhasil=${ok.length}/6 (masing-masing ${each}, tersedia ${avail}); saldo akhir ${after.available}` };
    },
  },
  {
    code: "local.refund",
    category: "local",
    title: "Refund",
    description: "Refund sebagian atas pembayaran lunas → saldo merchant berkurang sesuai nominal refund, status REFUND SEBAGIAN.",
    automated: true,
    run: async ({ botId }) => {
      const p = await demoPayment(botId, 150_000n);
      await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }));
      await db.update(payments).set({ heldUntil: new Date(Date.now() - 1000) }).where(eq(payments.id, p.id));
      await releaseHeldFunds();
      const before = await getUserBalances(db, botId, "sandbox");
      const r = await requestRefund({ ...SYSTEM, id: null }, { paymentId: p.id, ownerUserId: botId, amount: 50_000n, reason: "Uji refund otomatis" });
      const after = await getUserBalances(db, botId, "sandbox");
      const pay = await getPay(p.id);
      return { pass: r.status === "SUCCEEDED" && pay.status === "PARTIALLY_REFUNDED" && before.available - after.available === 50_000n && after.reserved === before.reserved, detail: `refund=${r.status}, status=${pay.status}, saldo −${before.available - after.available}` };
    },
  },
  {
    code: "local.ledger_integrity",
    category: "local",
    title: "Integritas ledger",
    description: "Semua jurnal seimbang, cache saldo = jumlah entri, dan aset = kewajiban + pendapatan + ekuitas (sandbox).",
    automated: true,
    run: async () => {
      const r = await verifyLedgerIntegrity(db, "sandbox");
      return { pass: r.ok, detail: `drift=${r.balanceDrift.length}, jurnal tidak seimbang=${r.unbalancedJournals.length}, aset=${r.assets}, klaim=${r.claims}` };
    },
  },
];

async function sandboxClient() {
  const cfg = await loadDanaConfig("sandbox");
  if (!cfg) throw new Error("Integrasi belum dikonfigurasi (kredensial Sandbox belum lengkap)");
  return { cfg, client: new DanaClient(cfg) };
}
const lastSandboxPayment = async (botId: string, status?: string) =>
  (await db.select().from(payments).where(and(eq(payments.userId, botId), eq(payments.env, "sandbox"), eq(payments.provider, "dana"), status ? eq(payments.status, status as never) : sql`true`)).orderBy(desc(payments.createdAt)).limit(1))[0];

const SANDBOX: Scenario[] = [
  {
    code: "sandbox.config",
    category: "sandbox",
    title: "Validasi konfigurasi",
    description: "Field wajib Payment Gateway terisi dan private key dapat dibaca.",
    automated: true,
    run: async () => {
      const row = await getConfigRow("sandbox");
      const checks = checkConfigRow("sandbox", row);
      const missing = checks.filter((c) => !c.ok && c.field !== "appUrl");
      let keyOk = false;
      try {
        keyOk = !!(await loadDanaConfig("sandbox"));
      } catch {
        keyOk = false;
      }
      return { pass: missing.length === 0 && keyOk, detail: missing.length ? `Belum diisi: ${missing.map((m) => m.label).join(", ")}` : keyOk ? "Lengkap" : "Kredensial tidak dapat didekripsi", response: checks };
    },
  },
  {
    code: "sandbox.connectivity",
    category: "sandbox",
    title: "Konektivitas ke DANA Sandbox",
    description: `Koneksi HTTPS ke ${DANA_BASE_URL.sandbox} berhasil (TLS & DNS).`,
    automated: true,
    run: async () => {
      const t = Date.now();
      try {
        const r = await fetch(DANA_BASE_URL.sandbox + DANA_PATHS.queryPayment, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(10_000) });
        return { pass: true, detail: `Terhubung: HTTP ${r.status} dalam ${Date.now() - t} ms`, responseCode: String(r.status) };
      } catch (e) {
        return { pass: false, detail: `Tidak dapat terhubung: ${(e as Error).message}` };
      }
    },
  },
  {
    code: "sandbox.auth_signature",
    category: "sandbox",
    title: "Autentikasi & signature",
    description: "Query Payment untuk referensi acak harus ditolak sebagai 'tidak ditemukan' (bukan 401). Ini membuktikan Partner ID, private key, dan signature diterima DANA.",
    automated: true,
    requiresSandboxConfig: true,
    run: async () => {
      const { client } = await sandboxClient();
      const r = await client.queryPayment({ partnerReferenceNo: `FXBPROBE${Date.now()}` });
      const code = r.responseCode ?? "";
      const pass = r.outcome === "response" && !/^401/.test(code) && (r.httpStatus ?? 0) < 500;
      return { pass, detail: pass ? `Signature diterima (${code} ${(r.body as { responseMessage?: string })?.responseMessage ?? ""})` : `Ditolak: ${code || r.error}`, request: r.request, response: r.response, responseCode: code };
    },
  },
  {
    code: "sandbox.invalid_signature",
    category: "sandbox",
    title: "Signature salah ditolak DANA",
    description: "Permintaan yang ditandatangani kunci acak harus ditolak DANA dengan kode 401.",
    automated: true,
    requiresSandboxConfig: true,
    run: async () => {
      const { cfg } = await sandboxClient();
      const rogue = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey;
      const r = await new DanaClient(cfg, { privateKeyOverride: rogue }).queryPayment({ partnerReferenceNo: `FXBPROBE${Date.now()}` });
      const code = r.responseCode ?? String(r.httpStatus ?? "");
      return { pass: /^401/.test(code), detail: `Respons: ${code}`, request: r.request, response: r.response, responseCode: code };
    },
  },
  {
    code: "sandbox.create_order",
    category: "sandbox",
    title: "Create Order (redirect)",
    description: "Membuat pesanan nyata di DANA Sandbox dan menerima webRedirectUrl.",
    automated: true,
    requiresSandboxConfig: true,
    run: async ({ botId }) => {
      await sandboxClient();
      const p = await createPayment(botId, "sandbox", { amount: 10_000n, description: "UAT FxB Pay", expiresInMinutes: 25, providerOverride: "dana", via: "uat" });
      const r = await startCheckout(p.publicId);
      const pay = await getPay(p.id);
      return { pass: r.kind === "redirect" && /^https:\/\//.test(r.url), detail: r.kind === "redirect" ? `Order ${pay.partnerReferenceNo} dibuat. URL checkout tersimpan untuk skenario pembayaran manual.` : `Hasil: ${r.kind}`, response: { kind: r.kind, partnerReferenceNo: pay.partnerReferenceNo, referenceNo: pay.providerReferenceNo } };
    },
  },
  {
    code: "sandbox.query_created",
    category: "sandbox",
    title: "Query Payment pesanan baru",
    description: "Query Payment atas pesanan dari skenario sebelumnya mengembalikan status 01 (Initiated).",
    automated: true,
    requiresSandboxConfig: true,
    run: async ({ botId }) => {
      const { client } = await sandboxClient();
      const p = await lastSandboxPayment(botId, "PENDING");
      if (!p) return { pass: false, detail: "Jalankan 'Create Order' terlebih dahulu" };
      const r = await client.queryPayment({ partnerReferenceNo: p.partnerReferenceNo, referenceNo: p.providerReferenceNo });
      const st = (r.body as { latestTransactionStatus?: string })?.latestTransactionStatus;
      return { pass: isSnapSuccess(r.responseCode ?? "") && (st === "01" || st === "02"), detail: `responseCode=${r.responseCode}, latestTransactionStatus=${st}`, request: r.request, response: r.response, responseCode: r.responseCode };
    },
  },
  {
    code: "sandbox.invalid_request",
    category: "sandbox",
    title: "Create Order dengan field tidak valid",
    description: "Nominal dengan format salah harus ditolak DANA (kode 400).",
    automated: true,
    requiresSandboxConfig: true,
    run: async () => {
      const { cfg, client } = await sandboxClient();
      const r = await client.call(DANA_PATHS.createOrder, {
        partnerReferenceNo: `FXBBAD${Date.now()}`,
        merchantId: cfg.merchantId,
        amount: { value: "abc", currency: "IDR" },
        validUpTo: new Date(Date.now() + 10 * 60_000).toISOString(),
        urlParams: [],
        additionalInfo: { mcc: cfg.mcc, envInfo: { sourcePlatform: "IPG", terminalType: "SYSTEM" }, order: { orderTitle: "invalid", scenario: "REDIRECT" } },
      });
      return { pass: /^400/.test(r.responseCode ?? String(r.httpStatus)), detail: `Respons: ${r.responseCode ?? r.httpStatus}`, request: r.request, response: r.response, responseCode: r.responseCode };
    },
  },
  {
    code: "sandbox.cancel_order",
    category: "sandbox",
    title: "Cancel Order",
    description: "Membuat pesanan baru lalu membatalkannya; Query Payment sesudahnya harus berstatus 05.",
    automated: true,
    requiresSandboxConfig: true,
    run: async ({ botId }) => {
      const { client } = await sandboxClient();
      const p = await createPayment(botId, "sandbox", { amount: 10_000n, description: "UAT cancel", expiresInMinutes: 25, providerOverride: "dana", via: "uat" });
      await startCheckout(p.publicId);
      const c = await client.cancelOrder({ partnerReferenceNo: p.partnerReferenceNo, reason: "UAT cancel" });
      const q = await client.queryPayment({ partnerReferenceNo: p.partnerReferenceNo });
      const st = (q.body as { latestTransactionStatus?: string })?.latestTransactionStatus;
      if (st === "05") await syncWithProvider(p.id);
      return { pass: isSnapSuccess(c.responseCode ?? "") && st === "05", detail: `cancel=${c.responseCode}, status sesudah=${st}`, request: c.request, response: { cancel: c.response, query: q.response }, responseCode: c.responseCode };
    },
  },
  {
    code: "sandbox.manual_payment",
    category: "sandbox",
    title: "Pembayaran berhasil (manual)",
    description: "Bayar pesanan sandbox memakai akun uji DANA, lalu pastikan Finish Notify diterima & diverifikasi.",
    automated: false,
    requiresSandboxConfig: true,
    steps: [
      "Pastikan Notify URL sandbox (lihat di atas) bisa diakses publik via HTTPS dan sudah didaftarkan di Merchant Portal DANA.",
      "Jalankan skenario 'Create Order (redirect)'.",
      "Buka Transaksi → filter 'UAT Bot' atau buka detail pesanan terbaru, lalu buka URL checkout DANA.",
      "Masuk dengan akun uji DANA Sandbox dari Merchant Portal dan selesaikan pembayaran. FxB Pay tidak pernah meminta PIN/OTP DANA.",
      "Kembali ke halaman ini dan tekan 'Periksa' — lulus bila pesanan berstatus LUNAS dari notifikasi yang ditandatangani DANA.",
    ],
    run: async ({ botId }) => {
      const p = await lastSandboxPayment(botId, "PAID");
      if (!p) return { pass: false, detail: "Belum ada pesanan DANA sandbox yang lunas" };
      const [n] = await db.select().from(providerNotifications).where(and(eq(providerNotifications.paymentId, p.id), eq(providerNotifications.verifiedWith, "dana"), eq(providerNotifications.signatureValid, true))).limit(1);
      return { pass: !!n, detail: n ? `Lunas via Finish Notify DANA (${p.partnerReferenceNo})` : `Lunas, tetapi bukan dari notifikasi DANA (sumber lain). Periksa Notify URL.` };
    },
  },
  {
    code: "sandbox.notify_received",
    category: "sandbox",
    title: "Finish Notify diterima",
    description: "Minimal satu notifikasi dari DANA Sandbox diterima dengan signature valid dalam 7 hari terakhir.",
    automated: true,
    run: async () => {
      const [n] = await db.select().from(providerNotifications).where(and(eq(providerNotifications.env, "sandbox"), eq(providerNotifications.verifiedWith, "dana"), eq(providerNotifications.signatureValid, true), gte(providerNotifications.receivedAt, new Date(Date.now() - 7 * 86400_000)))).orderBy(desc(providerNotifications.receivedAt)).limit(1);
      return { pass: !!n, detail: n ? `Terakhir ${n.receivedAt.toISOString()} — ${n.outcome}` : "Belum ada notifikasi DANA yang terverifikasi" };
    },
  },
  {
    code: "sandbox.query_paid",
    category: "sandbox",
    title: "Query Payment pesanan lunas",
    description: "Query Payment atas pesanan yang sudah dibayar harus mengembalikan status 00.",
    automated: true,
    requiresSandboxConfig: true,
    run: async ({ botId }) => {
      const { client } = await sandboxClient();
      const [p] = await db.select().from(payments).where(and(eq(payments.userId, botId), eq(payments.env, "sandbox"), eq(payments.provider, "dana"), sql`captured_journal_id IS NOT NULL`)).orderBy(desc(payments.paidAt)).limit(1);
      if (!p) return { pass: false, detail: "Selesaikan skenario pembayaran manual terlebih dahulu" };
      const r = await client.queryPayment({ partnerReferenceNo: p.partnerReferenceNo, referenceNo: p.providerReferenceNo });
      const st = (r.body as { latestTransactionStatus?: string })?.latestTransactionStatus;
      return { pass: st === "00", detail: `latestTransactionStatus=${st}`, request: r.request, response: r.response, responseCode: r.responseCode };
    },
  },
  {
    code: "sandbox.refund",
    category: "sandbox",
    title: "Refund Order",
    description: "Refund sebagian (Rp1.000) atas pesanan sandbox yang lunas melalui Refund Order DANA.",
    automated: true,
    requiresSandboxConfig: true,
    run: async ({ botId }) => {
      await sandboxClient();
      const [p] = await db.select().from(payments).where(and(eq(payments.userId, botId), eq(payments.env, "sandbox"), eq(payments.provider, "dana"), sql`status IN ('PAID','PARTIALLY_REFUNDED')`)).orderBy(desc(payments.paidAt)).limit(1);
      if (!p) return { pass: false, detail: "Butuh pesanan DANA sandbox yang lunas" };
      await db.update(payments).set({ heldUntil: new Date(Date.now() - 1000) }).where(eq(payments.id, p.id));
      await releaseHeldFunds();
      const r = await requestRefund({ ...SYSTEM }, { paymentId: p.id, ownerUserId: botId, amount: 1_000n, reason: "UAT refund" });
      return { pass: r.status === "SUCCEEDED", detail: `status=${r.status} ${r.providerResponseCode ?? ""} ${r.failureReason ?? ""}`.trim(), responseCode: r.providerResponseCode };
    },
  },
];

export const OFFICIAL: Scenario[] = [
  { code: "official.pg_payment", category: "official", title: "Payment Gateway Payment (wajib)", description: "Skenario wajib di Merchant Portal → Mandatory API Testing (5 kasus).", automated: false },
  { code: "official.finish_notify", category: "official", title: "General Payment Finish Notify (wajib)", description: "Skenario wajib notifikasi pembayaran (3 kasus).", automated: false },
  { code: "official.debit_status", category: "official", title: "Payment Gateway Debit Status (opsional)", description: "Query Payment.", automated: false },
  { code: "official.refund", category: "official", title: "Payment Gateway Refund Order (opsional)", description: "Refund Order.", automated: false },
  { code: "official.consult_pay", category: "official", title: "Payment Gateway Consult Pay (opsional)", description: "Consult Pay — belum dipakai FxB Pay.", automated: false },
];

export const SCENARIOS: Scenario[] = [...LOCAL, ...SANDBOX, ...OFFICIAL];
export const findScenario = (code: string) => SCENARIOS.find((s) => s.code === code);

export async function runScenario(code: string, runBy: string | null, batchId: string | null = null) {
  const s = findScenario(code);
  if (!s || !s.run) throw new Error("Skenario tidak dapat dijalankan otomatis");
  const [row] = await db.insert(testRuns).values({ category: s.category, scenario: s.code, status: "RUNNING", runBy, batchId }).returning();
  const started = Date.now();
  try {
    if (s.category === "local") await ensureHarnessKey();
    const botId = await ensureBot();
    const o = await s.run({ botId });
    const [u] = await db
      .update(testRuns)
      .set({ status: o.pass ? "PASSED" : "FAILED", request: redact(o.request ?? null) as object, response: redact(JSON.parse(JSON.stringify(o.response ?? null, (_k, v) => (typeof v === "bigint" ? v.toString() : v)))) as object, responseCode: o.responseCode ?? null, durationMs: Date.now() - started, error: o.pass ? null : o.detail, note: o.detail, finishedAt: new Date() })
      .where(eq(testRuns.id, row.id))
      .returning();
    return u;
  } catch (e) {
    const [u] = await db.update(testRuns).set({ status: "FAILED", durationMs: Date.now() - started, error: (e as Error).message.slice(0, 1000), finishedAt: new Date() }).where(eq(testRuns.id, row.id)).returning();
    return u;
  }
}

export async function runCategory(category: "local" | "sandbox", runBy: string | null) {
  const batchId = randomUUID();
  const out = [];
  for (const s of SCENARIOS.filter((x) => x.category === category && x.automated && x.run)) out.push(await runScenario(s.code, runBy, batchId));
  return { batchId, results: out };
}

export async function recordOfficial(code: string, status: "PASSED" | "FAILED" | "NOT_TESTED", note: string, evidenceUrl: string, runBy: string) {
  const s = findScenario(code);
  if (!s || s.category !== "official") throw new Error("Skenario resmi tidak dikenal");
  const [r] = await db.insert(testRuns).values({ category: "official", scenario: code, status: status === "NOT_TESTED" ? "NOT_TESTED" : status, note: `[Dicatat manual dari Merchant Portal] ${note}`, evidenceUrl: evidenceUrl || null, runBy, finishedAt: new Date() }).returning();
  return r;
}

export async function latestRuns() {
  const rows = await db.execute<{ scenario: string; id: string; status: string; created_at: string; duration_ms: number | null; response_code: string | null; note: string | null; error: string | null; evidence_url: string | null }>(sql`
    SELECT DISTINCT ON (scenario) scenario, id, status, created_at, duration_ms, response_code, note, error, evidence_url FROM test_runs ORDER BY scenario, created_at DESC`);
  return new Map(rows.rows.map((r) => [r.scenario, r]));
}

/** Checklist kesiapan production — dihitung dari data nyata, bukan dari tombol. */
export async function productionChecklist() {
  const prodRow = await getConfigRow("production");
  const prodChecks = checkConfigRow("production", prodRow);
  const runs = await latestRuns();
  const passed = (c: string) => runs.get(c)?.status === "PASSED";
  const sandboxCodes = SANDBOX.map((s) => s.code);
  const admins = await db.select({ totp: users.totpEnabled }).from(users).where(eq(users.role, "admin"));
  const pendingUncertain = await db.select({ id: withdrawals.id }).from(withdrawals).where(eq(withdrawals.status, "UNCERTAIN")).limit(1);
  const items = [
    { key: "prod_config", label: "Kredensial Production lengkap", ok: prodChecks.every((c) => c.ok), hint: prodChecks.filter((c) => !c.ok).map((c) => c.label).join(", ") },
    { key: "https", label: "APP_URL memakai HTTPS", ok: (process.env.APP_URL ?? "").startsWith("https://") },
    { key: "enc_key", label: "APP_ENCRYPTION_KEY khusus (bukan kunci development)", ok: !!process.env.APP_ENCRYPTION_KEY && process.env.APP_ENCRYPTION_KEY !== "ZGV2LW9ubHktZW5jcnlwdGlvbi1rZXktMzJieXRlcyE=" },
    { key: "local_tests", label: "Semua pengujian lokal lulus", ok: LOCAL.every((s) => passed(s.code)) },
    { key: "sandbox_tests", label: "Semua pengujian DANA Sandbox lulus", ok: sandboxCodes.every(passed) },
    { key: "official_uat", label: "UAT resmi wajib tercatat LULUS (dicatat manual dari Merchant Portal)", ok: passed("official.pg_payment") && passed("official.finish_notify") },
    { key: "merchant_approval", label: "Status persetujuan merchant DANA: disetujui (dicatat admin)", ok: prodRow?.merchantApproval === "approved" },
    { key: "admin_2fa", label: "Semua admin memakai 2FA", ok: admins.length > 0 && admins.every((a) => a.totp) },
    { key: "smtp", label: "Pengiriman email (SMTP) dikonfigurasi", ok: !!process.env.SMTP_URL },
    { key: "worker", label: "Worker/cron berjalan (job diproses < 10 menit terakhir)", ok: await workerAlive() },
    { key: "no_uncertain", label: "Tidak ada penarikan berstatus tidak pasti", ok: pendingUncertain.length === 0 },
  ];
  return items;
}

async function workerAlive() {
  const r = await db.execute<{ c: string }>(sql`SELECT count(*)::text c FROM jobs WHERE status='done' AND updated_at > now() - interval '10 minutes'`);
  return Number(r.rows[0].c) > 0;
}

export { PG_SERVICE_CODE };
