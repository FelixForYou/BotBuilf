import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerNotifications } from "@/lib/db/schema";
import { checkConfigRow, getConfigRow, notifyUrl } from "@/lib/dana/config";
import { config } from "@/lib/env";
import { DANA_BASE_URL, DANA_DOCS_URL, DANA_MERCHANT_PORTAL_URL } from "@/lib/dana/constants";
import { fmtDate } from "@/lib/format";
import { Badge, Card, KV, LinkButton, ListGroup, ListRow, Notice, PageHeader, SectionTitle, TableWrap } from "@/components/ui";
import { ActionButton, ActionForm, CopyButton } from "@/components/client";
import { EnvTabs, pickEnv } from "@/components/env-tabs";

const APPROVAL = { not_started: "Belum mulai", uat_in_progress: "UAT berjalan", approved: "Disetujui DANA", rejected: "Ditolak" } as const;

function UrlRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="py-3">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-2 flex items-center gap-2 rounded-2xl bg-surface p-2 pl-4"><span className="mono min-w-0 flex-1 truncate text-sm">{value}</span><CopyButton value={value} /></div>
      <p className="mt-1.5 text-xs text-subtle">{hint}</p>
    </div>
  );
}

export default async function DanaSettings({ searchParams }: { searchParams: Promise<{ env?: string }> }) {
  const env = pickEnv((await searchParams).env);
  const row = await getConfigRow(env);
  const checks = checkConfigRow(env, row);
  const notifs = await db.select().from(providerNotifications).where(eq(providerNotifications.env, env)).orderBy(desc(providerNotifications.receivedAt)).limit(15);
  const validation = (row?.lastValidation as { step: string; ok: boolean; detail: string }[] | null) ?? null;
  const complete = checks.filter((c) => c.field !== "appUrl").every((c) => c.ok);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Pengaturan DANA" subtitle="Kredensial disimpan terenkripsi (AES-256-GCM) di backend dan tidak pernah dikirim ke browser." />
      <EnvTabs env={env} base="/admin/dana" />
      {!complete ? <Notice tone="warn" title="Integrasi belum dikonfigurasi">Lengkapi field wajib di bawah. {env === "sandbox" ? "Selama belum lengkap, Sandbox memakai mode DEMO berlabel jelas." : "Production tidak dapat menerima pembayaran sampai lengkap."}</Notice> : <Notice tone="ok" title="Konfigurasi lengkap">Jalankan validasi untuk memastikan DANA menerima signature Anda.</Notice>}

      <SectionTitle>Produk integrasi</SectionTitle>
      <ListGroup>
        <ListRow icon="zap" title="Payment Gateway (SNAP) — Create Order, Query, Cancel, Refund, Finish Notify" right={<Badge tone="mint">Didukung</Badge>} />
        <ListRow icon="qr" title="QRIS via Payment Gateway (skenario API)" subtitle="Aktifkan hanya jika akses QRIS tersedia di akun merchant DANA Anda" right={row?.qrisEnabled ? <Badge tone="mint">Aktif</Badge> : <Badge>Nonaktif</Badge>} />
        <ListRow icon="bank" title="Disbursement (pencairan otomatis)" subtitle="Butuh produk & perjanjian terpisah dengan DANA — belum diintegrasikan; penarikan diproses manual" right={<Badge tone="amber">Belum tersedia</Badge>} />
        <ListRow icon="link" title="Widget Binding / Merchant Management" subtitle="Tidak dipakai oleh FxB Pay" right={<Badge>Tidak dipakai</Badge>} />
      </ListGroup>

      <SectionTitle>URL untuk Merchant Portal</SectionTitle>
      <Card>
        <div className="row-sep">
          <UrlRow label="Notify URL (Finish Notify)" value={notifyUrl(env)} hint="Daftarkan di Merchant Portal DANA. Juga dikirim di urlParams NOTIFICATION setiap order." />
          <UrlRow label="Redirect URL (PAY_RETURN)" value={`${config.appUrl}/pay/{id}/selesai`} hint="Dikirim per order; halaman ini hanya menampilkan status dari server, bukan bukti pembayaran." />
          <UrlRow label="Origin" value={config.appUrl} hint="Isi field Origin dengan domain ini." />
        </div>
        {!config.appUrl.startsWith("https://") && <div className="mt-3"><Notice tone="warn">APP_URL bukan HTTPS. DANA tidak dapat mengirim notifikasi ke localhost — gunakan domain publik atau tunnel HTTPS untuk sandbox.</Notice></div>}
        <div className="mt-4 flex flex-wrap gap-2"><LinkButton href={DANA_MERCHANT_PORTAL_URL} external icon="external" variant="secondary">Merchant Portal DANA</LinkButton><LinkButton href={DANA_DOCS_URL} external icon="file" variant="secondary">Dokumentasi API DANA</LinkButton></div>
      </Card>

      <SectionTitle>Kredensial {env === "production" ? "Production" : "Sandbox"}</SectionTitle>
      <Card>
        <ActionForm action={`/api/admin/dana/${env}`} submit="Simpan kredensial" success="Tersimpan">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="partnerId">Partner ID / Client ID (X-PARTNER-ID)</label><input id="partnerId" name="partnerId" className="input mono" defaultValue={row?.partnerId} autoComplete="off" /></div>
            <div><label className="label" htmlFor="merchantId">Merchant ID</label><input id="merchantId" name="merchantId" className="input mono" defaultValue={row?.merchantId} autoComplete="off" /></div>
            <div><label className="label" htmlFor="subMerchantId">Sub Merchant ID (opsional)</label><input id="subMerchantId" name="subMerchantId" className="input mono" defaultValue={row?.subMerchantId} /></div>
            <div><label className="label" htmlFor="externalStoreId">External Store ID (opsional)</label><input id="externalStoreId" name="externalStoreId" className="input mono" defaultValue={row?.externalStoreId} /></div>
            <div><label className="label" htmlFor="origin">Origin</label><input id="origin" name="origin" className="input mono" defaultValue={row?.origin || config.appUrl} /></div>
            <div><label className="label" htmlFor="mcc">MCC (4 digit)</label><input id="mcc" name="mcc" className="input mono" defaultValue={row?.mcc} placeholder="mis. 5732" /></div>
          </div>
          <div><label className="label" htmlFor="privateKey">Private key merchant (PEM) {row?.privateKeyEnc && <Badge tone="mint">Tersimpan terenkripsi</Badge>}</label><textarea id="privateKey" name="privateKey" rows={4} className="input mono text-xs" placeholder={row?.privateKeyEnc ? "Kosongkan untuk mempertahankan kunci tersimpan" : "-----BEGIN PRIVATE KEY-----"} autoComplete="off" spellCheck={false} /><p className="mt-1.5 text-xs text-subtle">Buat pasangan kunci dengan <span className="mono">npm run keygen -- rsa</span> di server, unggah public key ke Merchant Portal.</p></div>
          <div><label className="label" htmlFor="danaPublicKey">Public key DANA {row?.danaPublicKeyEnc && <Badge tone="mint">Tersimpan</Badge>}</label><textarea id="danaPublicKey" name="danaPublicKey" rows={3} className="input mono text-xs" placeholder={env === "sandbox" ? "Opsional — default memakai public key sandbox resmi dari SDK DANA" : "Wajib: dari Merchant Portal DANA"} spellCheck={false} /></div>
          <div><label className="label" htmlFor="clientSecret">Client secret (opsional, untuk produk yang memerlukannya) {row?.clientSecretEnc && <Badge tone="mint">Tersimpan</Badge>}</label><input id="clientSecret" name="clientSecret" type="password" className="input mono" autoComplete="off" /></div>
          <label className="flex items-center gap-3 rounded-2xl bg-surface p-4 text-sm font-semibold"><input type="checkbox" name="qrisEnabled" defaultChecked={row?.qrisEnabled} className="h-5 w-5 accent-[#58dcc5]" />Akses QRIS aktif di akun merchant DANA ini</label>
          <div><label className="label" htmlFor="pw">Password admin (konfirmasi)</label><input id="pw" name="password" type="password" className="input" autoComplete="current-password" /></div>
        </ActionForm>
      </Card>

      <SectionTitle action={<ActionButton action={`/api/admin/dana/${env}/validate`} icon="shieldCheck" variant="primary">Validasi sekarang</ActionButton>}>Validasi</SectionTitle>
      <Card>
        <div className="text-sm text-muted">Target: <span className="mono">{DANA_BASE_URL[env]}</span>{row?.lastValidatedAt && ` · terakhir ${fmtDate(row.lastValidatedAt)}`}</div>
        <ul className="row-sep mt-3">
          {(validation ?? checks.map((c) => ({ step: c.label, ok: c.ok, detail: c.ok ? "OK" : c.hint ?? "Belum diisi" }))).map((v) => (
            <li key={v.step} className="flex items-start justify-between gap-3 py-2.5 text-sm"><span>{v.step}</span><span className="flex items-center gap-2 text-right text-xs text-muted">{v.detail}<Badge tone={v.ok ? "mint" : "red"}>{v.ok ? "Lulus" : "Gagal"}</Badge></span></li>
          ))}
        </ul>
      </Card>

      <SectionTitle>Status persetujuan merchant (pencatatan manual)</SectionTitle>
      <Card>
        <KV items={[["Status tercatat", <Badge key="s" tone={row?.merchantApproval === "approved" ? "mint" : row?.merchantApproval === "rejected" ? "red" : "amber"}>{APPROVAL[row?.merchantApproval ?? "not_started"]}</Badge>], ["Catatan", row?.merchantApprovalNote || "—"]]} />
        <div className="mt-3"><Notice tone="info">Status ini dicatat admin berdasarkan keputusan resmi DANA (email/Merchant Portal). Mengubahnya di sini tidak menggantikan persetujuan DANA.</Notice></div>
        <ActionForm action={`/api/admin/dana/${env}/approval`} submit="Catat status" submitSize="md" className="mt-4">
          <select name="status" className="input" defaultValue={row?.merchantApproval ?? "not_started"}>{Object.entries(APPROVAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input name="note" className="input" placeholder="Sumber/bukti, mis. Email DANA 12 Nov 2026 tiket #123" />
        </ActionForm>
      </Card>

      <SectionTitle>Notifikasi masuk ({env})</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Diterima</th><th>Referensi</th><th>Signature</th><th>Hasil</th><th>Detail</th></tr></thead><tbody>
        {notifs.length === 0 && <tr><td colSpan={5} className="text-muted">Belum ada notifikasi untuk env ini.</td></tr>}
        {notifs.map((n) => <tr key={n.id}><td className="whitespace-nowrap">{fmtDate(n.receivedAt)}</td><td className="mono text-xs">{n.partnerReferenceNo ?? "—"}</td><td>{n.signatureValid ? <Badge tone={n.verifiedWith === "dana" ? "mint" : "blue"}>{n.verifiedWith === "dana" ? "DANA" : "Harness lokal"}</Badge> : <Badge tone="red">Tidak valid</Badge>}</td><td className="mono text-xs">{n.outcome}</td><td className="max-w-xs truncate text-xs text-muted">{n.detail}</td></tr>)}
      </tbody></table></TableWrap>
    </div>
  );
}
