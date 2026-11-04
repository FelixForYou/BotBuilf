import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { testRuns } from "@/lib/db/schema";
import { SCENARIOS, latestRuns, productionChecklist, type Scenario } from "@/lib/uat/scenarios";
import { loadDanaConfig, notifyUrl } from "@/lib/dana/config";
import { getSetting } from "@/lib/settings";
import { DANA_MERCHANT_PORTAL_URL, DANA_UAT_SCRIPT_URL } from "@/lib/dana/constants";
import { fmtDate } from "@/lib/format";
import { Badge, Card, LinkButton, ListGroup, Notice, PageHeader, SectionTitle, TableWrap } from "@/components/ui";
import { ActionButton, ActionForm, CopyButton, SheetTrigger } from "@/components/client";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";
const ST: Record<string, [string, "mint" | "red" | "blue" | "gray" | "amber"]> = { PASSED: ["Passed", "mint"], FAILED: ["Failed", "red"], RUNNING: ["Running", "blue"], NOT_TESTED: ["Belum diuji", "gray"], MANUAL: ["Manual", "amber"] };

function StatusBadge({ s }: { s?: string }) {
  const [l, t] = ST[s ?? "NOT_TESTED"] ?? ST.NOT_TESTED;
  return <Badge tone={t}>{l}</Badge>;
}

type Run = Awaited<ReturnType<typeof latestRuns>> extends Map<string, infer R> ? R : never;
function ScenarioRow({ s, run, disabled }: { s: Scenario; run?: Run; disabled?: string }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-semibold">{s.title}<StatusBadge s={run?.status} />{!s.automated && <Badge tone="amber">Manual</Badge>}</div>
          <p className="mt-1 text-sm text-muted">{s.description}</p>
          {run && <p className="mt-1 text-xs text-subtle">{fmtDate(run.created_at)}{run.duration_ms !== null && ` · ${run.duration_ms} ms`}{run.response_code && ` · kode ${run.response_code}`} · <Link className="text-mint" href={`/admin/uat/run/${run.id}`}>detail</Link></p>}
          {run?.status === "FAILED" && <p className="mt-1 text-xs text-danger">{run.error}</p>}
          {run?.status === "PASSED" && run.note && <p className="mt-1 text-xs text-muted">{run.note}</p>}
          {s.steps && (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">{s.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          )}
        </div>
        {s.run && (disabled ? <span className="text-xs text-subtle">{disabled}</span> : <ActionButton action="/api/admin/uat/run" body={{ code: s.code }} icon={s.automated ? "play" : "refresh"}>{run ? "Ulangi" : s.automated ? "Jalankan" : "Periksa"}</ActionButton>)}
      </div>
    </div>
  );
}

export default async function Uat() {
  const [runs, checklist, sandboxCfg, prod, history] = await Promise.all([latestRuns(), productionChecklist(), loadDanaConfig("sandbox").catch(() => null), getSetting("production"), db.select().from(testRuns).orderBy(desc(testRuns.createdAt)).limit(40)]);
  const by = (c: string) => SCENARIOS.filter((s) => s.category === c);
  const ready = checklist.every((c) => c.ok);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="DANA Sandbox & UAT" subtitle="Pusat pengujian integrasi. Hasil dipisah menjadi tiga kategori dan tidak saling menggantikan." action={<LinkButton href="/api/admin/uat/export" external icon="download" variant="secondary" size="sm">Ekspor laporan</LinkButton>} />
      <div className="grid gap-3 sm:grid-cols-3">
        {[["1", "Pengujian lokal aplikasi", "Logika FxB Pay dengan test harness lokal. Tidak menyentuh DANA."], ["2", "Integrasi DANA Sandbox", "Panggilan nyata ke api.sandbox.dana.id dengan kredensial sandbox."], ["3", "UAT resmi Merchant Portal", "Dicatat manual — tidak ada API untuk membacanya."]].map(([n, t, d]) => (
          <Card key={n}><div className="flex items-center gap-2 font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-sm text-ink">{n}</span>{t}</div><p className="mt-2 text-sm text-muted">{d}</p></Card>
        ))}
      </div>

      <SectionTitle action={<ActionButton action="/api/admin/uat/run" body={{ category: "local" }} icon="play" variant="primary">Jalankan semua</ActionButton>}>1 · Pengujian lokal aplikasi</SectionTitle>
      <Notice tone="info">Berjalan di env Sandbox memakai akun internal &quot;UAT Bot&quot; dan notifikasi bertanda tangan kunci harness lokal (ditolak oleh endpoint Production). Lulus di sini TIDAK berarti UAT DANA lulus.</Notice>
      <ListGroup className="mt-3">{by("local").map((s) => <ScenarioRow key={s.code} s={s} run={runs.get(s.code)} />)}</ListGroup>

      <SectionTitle action={sandboxCfg ? <ActionButton action="/api/admin/uat/run" body={{ category: "sandbox" }} icon="play" variant="primary">Jalankan otomatis</ActionButton> : undefined}>2 · Integrasi dengan DANA Sandbox</SectionTitle>
      {!sandboxCfg && <Notice tone="warn" title="Integrasi belum dikonfigurasi">Isi kredensial Sandbox di <Link className="font-semibold text-mint" href="/admin/dana?env=sandbox">Pengaturan DANA</Link> untuk menjalankan skenario ini.</Notice>}
      <Card className="mt-3">
        <div className="text-sm font-semibold">Notify URL sandbox</div>
        <div className="mt-2 flex items-center gap-2 rounded-2xl bg-surface p-2 pl-4"><span className="mono min-w-0 flex-1 truncate text-sm">{notifyUrl("sandbox")}</span><CopyButton value={notifyUrl("sandbox")} /></div>
        <p className="mt-2 text-xs text-subtle">Pantau notifikasi masuk di <Link href="/admin/dana?env=sandbox" className="text-mint">Pengaturan DANA → Notifikasi masuk</Link>. Skrip UAT resmi DANA: <a className="text-mint" href={DANA_UAT_SCRIPT_URL} target="_blank" rel="noopener noreferrer">dana-id/uat-script</a>.</p>
      </Card>
      <ListGroup className="mt-3">{by("sandbox").map((s) => <ScenarioRow key={s.code} s={s} run={runs.get(s.code)} disabled={s.requiresSandboxConfig && !sandboxCfg ? "Butuh kredensial sandbox" : undefined} />)}</ListGroup>

      <SectionTitle action={<LinkButton href={DANA_MERCHANT_PORTAL_URL} external icon="external" variant="secondary" size="sm">Buka Merchant Portal</LinkButton>}>3 · Status UAT resmi (Merchant Portal DANA)</SectionTitle>
      <Notice tone="warn" title="Dicatat manual">FxB Pay tidak dapat membaca hasil UAT resmi. Buka Merchant Portal → Mandatory API Testing, lalu catat hasilnya di sini beserta bukti.</Notice>
      <ListGroup className="mt-3">
        {by("official").map((s) => {
          const r = runs.get(s.code);
          return (
            <div key={s.code} className="flex flex-wrap items-start gap-3 px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-semibold">{s.title}<StatusBadge s={r?.status} /></div>
                <p className="mt-1 text-sm text-muted">{s.description}</p>
                {r && <p className="mt-1 text-xs text-subtle">{fmtDate(r.created_at)} · {r.note}{r.evidence_url && <> · <a href={r.evidence_url} className="text-mint" target="_blank" rel="noopener noreferrer">bukti</a></>}</p>}
              </div>
              <SheetTrigger title="Catat hasil UAT resmi" label="Catat" icon="file" variant="secondary" size="sm">
                <>
                  <ActionForm action="/api/admin/uat/record" extra={{ code: s.code }} submit="Simpan catatan">
                    <Notice tone="info">{s.title}</Notice>
                    <select name="status" className="input"><option value="PASSED">Lulus di Merchant Portal</option><option value="FAILED">Gagal di Merchant Portal</option><option value="NOT_TESTED">Belum diuji</option></select>
                    <input name="note" className="input" placeholder="mis. Progress 5 of 5, dicek 12 Nov 2026" />
                    <input name="evidenceUrl" className="input" placeholder="URL bukti/tangkapan layar (opsional)" />
                  </ActionForm>
                </>
              </SheetTrigger>
            </div>
          );
        })}
      </ListGroup>

      <SectionTitle>Simulasi callback (khusus Sandbox)</SectionTitle>
      <Card>
        <p className="mb-4 text-sm text-muted">Mengirim Finish Notify bertanda tangan kunci <b>harness lokal</b> ke endpoint notifikasi sandbox. Endpoint Production menolak kunci ini, sehingga simulasi tidak dapat menambah saldo Production.</p>
        <ActionForm action="/api/admin/uat/simulate" submit="Kirim simulasi" submitSize="md" submitIcon="send">
          <div className="grid gap-3 sm:grid-cols-4">
            <input name="partnerReferenceNo" className="input mono sm:col-span-2" placeholder="Referensi FxB (FXB...)" />
            <select name="status" className="input"><option value="00">00 · Lunas</option><option value="05">05 · Ditutup</option></select>
            <select name="times" className="input"><option value="1">1×</option><option value="3">3× (duplikat)</option><option value="5">5× (duplikat)</option></select>
          </div>
          <input name="amountOverride" inputMode="numeric" className="input" placeholder="Override nominal (kosongkan = sesuai tagihan; isi untuk uji nominal tidak cocok)" />
        </ActionForm>
        <div className="mt-3"><ActionButton action="/api/admin/harness" icon="refresh" confirm="Ganti kunci test harness?">Rotasi kunci harness</ActionButton></div>
      </Card>

      <SectionTitle>Checklist kesiapan Production</SectionTitle>
      <Card>
        <ul className="row-sep">
          {checklist.map((c) => (
            <li key={c.key} className="flex items-start gap-3 py-3 text-sm">
              <Icon name={c.ok ? "checkCircle" : "xCircle"} className={c.ok ? "text-mint" : "text-danger"} />
              <div><div className="font-semibold">{c.label}</div>{!c.ok && "hint" in c && c.hint && <div className="text-xs text-muted">{c.hint}</div>}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-2 font-bold">Mode Production {prod.enabled ? <Badge tone="mint">Aktif</Badge> : <Badge>Nonaktif</Badge>}</div>
          {prod.enabled && <p className="mt-1 text-xs text-muted">Diaktifkan {prod.activatedAt && fmtDate(prod.activatedAt)} oleh {prod.activatedBy}</p>}
          <p className="mt-2 text-xs text-subtle">Tombol ini hanya membuka mode Production di FxB Pay. Ini tidak menggantikan persetujuan DANA.</p>
          <ActionForm action="/api/admin/production" extra={{ enable: !prod.enabled }} submit={prod.enabled ? "Nonaktifkan Production" : "Aktifkan Production"} submitVariant={prod.enabled ? "danger" : "primary"} submitSize="md" className="mt-3" confirm={prod.enabled ? "Nonaktifkan Production? Merchant tidak bisa bertransaksi live." : undefined}>
            {!prod.enabled && <input name="confirmText" className="input" placeholder="Ketik: AKTIFKAN PRODUCTION" disabled={!ready} />}
            <input name="password" type="password" className="input" placeholder="Password admin" />
            {!prod.enabled && !ready && <p className="text-xs text-danger">Checklist belum lengkap — aktivasi akan ditolak server.</p>}
          </ActionForm>
        </div>
      </Card>

      <SectionTitle>Riwayat pengujian</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Waktu</th><th>Kategori</th><th>Skenario</th><th>Hasil</th><th>Durasi</th><th></th></tr></thead><tbody>
        {history.length === 0 && <tr><td colSpan={6} className="text-muted">Belum ada pengujian</td></tr>}
        {history.map((r) => <tr key={r.id}><td className="whitespace-nowrap">{fmtDate(r.createdAt)}</td><td>{{ local: "Lokal", sandbox: "DANA Sandbox", official: "UAT resmi (manual)" }[r.category]}</td><td>{SCENARIOS.find((s) => s.code === r.scenario)?.title ?? r.scenario}</td><td><StatusBadge s={r.status} /></td><td className="tabular">{r.durationMs ?? "—"} ms</td><td><Link className="text-sm text-mint" href={`/admin/uat/run/${r.id}`}>Detail</Link></td></tr>)}
      </tbody></table></TableWrap>
    </div>
  );
}
