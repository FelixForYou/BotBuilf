import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { loginEvents, sessions } from "@/lib/db/schema";
import { fmtDate, relTime } from "@/lib/format";
import { Badge, Card, ListGroup, ListRow, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { ActionButton, ActionForm } from "@/components/client";
import { TwoFactorSetup } from "./two-factor";

export default async function Security({ searchParams }: { searchParams: Promise<{ wajib2fa?: string }> }) {
  const { user, session } = await requireUser();
  const forced = (await searchParams).wajib2fa === "1" || (user.role === "admin" && !user.totpEnabled);
  const [sess, logins] = await Promise.all([
    db.select().from(sessions).where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).orderBy(desc(sessions.lastSeenAt)),
    db.select().from(loginEvents).where(eq(loginEvents.userId, user.id)).orderBy(desc(loginEvents.createdAt)).limit(20),
  ]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Keamanan" back="/app/pengaturan" />
      {forced && !user.totpEnabled && <div className="mb-4"><Notice tone="warn" title="2FA wajib untuk admin">Aktifkan autentikasi dua faktor untuk membuka panel admin.</Notice></div>}
      <SectionTitle>Autentikasi dua faktor</SectionTitle>
      <Card>
        {user.totpEnabled ? (
          <div className="space-y-4">
            <Notice tone="ok">2FA aktif. Kode autentikator diminta setiap kali masuk.</Notice>
            {user.role !== "admin" && (
              <ActionForm action="/api/account/2fa/disable" submit="Nonaktifkan 2FA" submitVariant="danger" submitSize="md">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="password" type="password" className="input" placeholder="Password" />
                  <input name="code" inputMode="numeric" maxLength={6} className="input" placeholder="Kode 6 digit" />
                </div>
              </ActionForm>
            )}
          </div>
        ) : <TwoFactorSetup />}
      </Card>
      <SectionTitle>Ubah password</SectionTitle>
      <Card>
        <ActionForm action="/api/account/password" submit="Ubah password" resetOnSuccess>
          <div><label className="label" htmlFor="current">Password saat ini</label><input id="current" name="current" type="password" autoComplete="current-password" className="input" /></div>
          <div><label className="label" htmlFor="next">Password baru</label><input id="next" name="next" type="password" autoComplete="new-password" className="input" /></div>
        </ActionForm>
      </Card>
      <SectionTitle action={sess.length > 1 ? <ActionButton action="/api/account/sessions" body={{ all: true }} variant="danger" confirm="Keluarkan semua sesi lain?">Keluarkan semua</ActionButton> : undefined}>
        <span id="sesi">Sesi aktif</span>
      </SectionTitle>
      <ListGroup>
        {sess.map((s) => (
          <ListRow key={s.id} icon="phone" title={<span className="flex items-center gap-2">{s.userAgent.slice(0, 48) || "Perangkat tidak dikenal"}{s.id === session.id && <Badge tone="mint">Sesi ini</Badge>}</span>} subtitle={`${s.ip || "IP tidak diketahui"} · aktif ${relTime(s.lastSeenAt)}`}
            right={s.id !== session.id ? <ActionButton action="/api/account/sessions" body={{ id: s.id }} variant="ghost" icon="logout">Keluarkan</ActionButton> : undefined} />
        ))}
      </ListGroup>
      <SectionTitle>Riwayat login</SectionTitle>
      <ListGroup>
        {logins.map((l) => (
          <ListRow key={l.id} icon={l.success ? "checkCircle" : "xCircle"} danger={!l.success} title={l.success ? "Berhasil" : "Gagal"} subtitle={`${fmtDate(l.createdAt)} · ${l.ip || "-"} · ${l.reason.replace(/_/g, " ")}`} />
        ))}
      </ListGroup>
    </div>
  );
}
