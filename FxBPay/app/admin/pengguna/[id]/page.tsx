import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLogs, loginEvents, payments, users, withdrawals } from "@/lib/db/schema";
import { getUserBalances } from "@/lib/ledger";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { Badge, Card, KV, ListGroup, ListRow, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { ActionButton, ActionForm, SheetTrigger } from "@/components/client";
import { PaymentStatusBadge } from "@/components/status";
import { WITHDRAWAL_LABEL } from "@/lib/withdrawals";

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user: me } = await requireAdmin();
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) notFound();
  const [bp, bs, pays, wds, logins, acts] = await Promise.all([
    getUserBalances(db, u.id, "production"),
    getUserBalances(db, u.id, "sandbox"),
    db.select().from(payments).where(eq(payments.userId, u.id)).orderBy(desc(payments.createdAt)).limit(10),
    db.select().from(withdrawals).where(eq(withdrawals.userId, u.id)).orderBy(desc(withdrawals.createdAt)).limit(10),
    db.select().from(loginEvents).where(eq(loginEvents.userId, u.id)).orderBy(desc(loginEvents.createdAt)).limit(10),
    db.select().from(auditLogs).where(eq(auditLogs.actorId, u.id)).orderBy(desc(auditLogs.createdAt)).limit(15),
  ]);
  const self = u.id === me.id;
  return (
    <>
      <PageHeader title={u.storeName || u.name} back="/admin/pengguna" subtitle={<span className="flex flex-wrap items-center gap-2">{u.email}{u.status === "frozen" ? <Badge tone="red">Dibekukan</Badge> : <Badge tone="mint">Aktif</Badge>}<Badge>{u.role}</Badge>{u.totpEnabled && <Badge tone="blue">2FA</Badge>}</span>} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Saldo Production" value={formatRupiah(bp.available)} hint={`Tertahan ${formatRupiah(bp.held)} · dicadangkan ${formatRupiah(bp.reserved)}`} />
        <Stat label="Saldo Sandbox" value={formatRupiah(bs.available)} hint={`Tertahan ${formatRupiah(bs.held)} · dicadangkan ${formatRupiah(bs.reserved)}`} />
      </div>
      {!self && (
        <div className="mt-4 flex flex-wrap gap-2">
          {u.status === "active" ? <ActionButton action={`/api/admin/users/${u.id}`} body={{ action: "freeze" }} prompt={{ key: "reason", label: "Alasan pembekuan akun:", required: true }} variant="danger" icon="snowflake" size="md">Bekukan akun</ActionButton>
            : <ActionButton action={`/api/admin/users/${u.id}`} body={{ action: "unfreeze" }} icon="check" size="md" confirm="Aktifkan kembali akun ini?">Aktifkan kembali</ActionButton>}
          <ActionButton action={`/api/admin/users/${u.id}`} body={{ action: "revoke_sessions" }} icon="logout" size="md" confirm="Keluarkan semua sesi pengguna ini?">Keluarkan sesi</ActionButton>
          <ActionButton action={`/api/admin/users/${u.id}`} body={{ action: "role", role: u.role === "admin" ? "user" : "admin" }} icon="shield" size="md" confirm={u.role === "admin" ? "Cabut role admin?" : "Jadikan admin? Admin wajib mengaktifkan 2FA."}>{u.role === "admin" ? "Cabut admin" : "Jadikan admin"}</ActionButton>
          <SheetTrigger title="Jurnal koreksi" label="Penyesuaian saldo" icon="scale" variant="secondary">
            <>
              <ActionForm action="/api/admin/adjust" submit="Catat jurnal koreksi" extra={{ userId: u.id }} confirm="Jurnal koreksi bersifat permanen (hanya bisa dibalik dengan reversal). Lanjutkan?">
                <div className="grid grid-cols-2 gap-3">
                  <select name="env" className="input" defaultValue="production"><option value="production">Production</option><option value="sandbox">Sandbox</option></select>
                  <select name="direction" className="input"><option value="credit">Tambah (kredit)</option><option value="debit">Kurangi (debit)</option></select>
                </div>
                <div><label className="label" htmlFor="adj">Nominal</label><input id="adj" name="amount" inputMode="numeric" className="input tabular" /></div>
                <div><label className="label" htmlFor="adjr">Alasan (wajib)</label><textarea id="adjr" name="reason" className="input" placeholder="Jelaskan dasar koreksi, mis. nomor tiket" /></div>
                <div><label className="label" htmlFor="adjp">Password admin</label><input id="adjp" name="password" type="password" className="input" /></div>
              </ActionForm>
            </>
          </SheetTrigger>
        </div>
      )}
      <SectionTitle>Profil</SectionTitle>
      <Card><KV items={[["Nama", u.name], ["Toko", u.storeName], ["Telepon", u.phone || "—"], ["Email terverifikasi", fmtDate(u.emailVerifiedAt)], ["Terdaftar", fmtDate(u.createdAt)], ["Alasan pembekuan", u.frozenReason ?? "—"]]} /></Card>
      <SectionTitle>Transaksi terbaru</SectionTitle>
      <ListGroup>{pays.length === 0 ? <ListRow title="Belum ada" /> : pays.map((p) => <ListRow key={p.id} href={`/admin/transaksi/${p.id}`} icon="receipt" title={p.description} subtitle={`${fmtDate(p.createdAt)} · ${p.env} · ${p.partnerReferenceNo}`} chevron={false} right={<div className="flex flex-col items-end gap-1"><span className="tabular text-sm font-bold">{formatRupiah(p.amount)}</span><PaymentStatusBadge status={p.status} /></div>} />)}</ListGroup>
      <SectionTitle>Penarikan</SectionTitle>
      <ListGroup>{wds.length === 0 ? <ListRow title="Belum ada" /> : wds.map((w) => <ListRow key={w.id} href="/admin/penarikan" icon="bank" title={`${formatRupiah(w.amount)} · ${w.destinationBank}`} subtitle={`${fmtDate(w.createdAt)} · ${w.env}`} value={WITHDRAWAL_LABEL[w.status]} />)}</ListGroup>
      <SectionTitle>Aktivitas</SectionTitle>
      <ListGroup>
        {logins.map((l) => <ListRow key={`l${l.id}`} icon={l.success ? "checkCircle" : "xCircle"} danger={!l.success} title={`Login ${l.success ? "berhasil" : "gagal"}`} subtitle={`${fmtDate(l.createdAt)} · ${l.ip} · ${l.reason}`} />)}
        {acts.map((a) => <ListRow key={`a${a.id}`} icon="activity" title={a.action} subtitle={`${fmtDate(a.createdAt)} · ${a.targetType} ${a.targetId}`} />)}
      </ListGroup>
    </>
  );
}
