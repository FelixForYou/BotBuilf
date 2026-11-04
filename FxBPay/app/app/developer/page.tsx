import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { effectiveEnv } from "@/lib/views";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { API_SCOPES, SCOPE_LABEL } from "@/lib/apikeys";
import { fmtDate, relTime } from "@/lib/format";
import { Badge, EmptyState, EnvBadge, ListGroup, ListRow, PageHeader, SectionTitle } from "@/components/ui";
import { ActionButton, CreateKey, RotateKey } from "./secret-forms";

export const metadata = { title: "Developer" };

export default async function Developer() {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  const keys = await db.select().from(apiKeys).where(and(eq(apiKeys.userId, user.id), eq(apiKeys.env, env))).orderBy(desc(apiKeys.createdAt));
  return (
    <>
      <PageHeader title="Developer" subtitle={<span className="flex items-center gap-2">API key & webhook untuk <EnvBadge env={env} /></span>} action={<CreateKey env={env} scopes={API_SCOPES.map((s) => ({ value: s, label: SCOPE_LABEL[s] }))} />} />
      <ListGroup>
        <ListRow href="/docs" icon="file" title="Dokumentasi API" subtitle="Contoh Node.js, PHP, dan cURL" />
        <ListRow href="/app/developer/webhook" icon="webhook" title="Webhook" subtitle="Endpoint, riwayat pengiriman, kirim ulang" />
        <ListRow href="/app/developer/playground" icon="play" title="API Playground" subtitle="Khusus sandbox" />
      </ListGroup>
      <SectionTitle>API key</SectionTitle>
      {keys.length === 0 ? <EmptyState icon="key" title="Belum ada API key">Buat key untuk mengakses API FxB Pay dari server Anda.</EmptyState> : (
        <ListGroup>
          {keys.map((k) => {
            const expired = k.expiresAt && k.expiresAt < new Date();
            const status = k.revokedAt ? <Badge tone="red">Dicabut</Badge> : expired ? <Badge tone="amber">Kedaluwarsa</Badge> : <Badge tone="mint">Aktif</Badge>;
            return (
              <ListRow key={k.id} icon="key" title={<span className="flex items-center gap-2">{k.name} {status}</span>}
                subtitle={<><span className="mono">{k.prefix}…</span> · {k.scopes.join(", ")} · dibuat {fmtDate(k.createdAt, false)} · {k.expiresAt ? `berlaku s.d. ${fmtDate(k.expiresAt, false)}` : "tanpa kedaluwarsa"} · {k.lastUsedAt ? `dipakai ${relTime(k.lastUsedAt)}` : "belum dipakai"}</>}
                right={!k.revokedAt ? <div className="flex gap-2"><RotateKey id={k.id} /><ActionButton action={`/api/developer/keys/${k.id}/revoke`} variant="danger" confirm="Cabut API key ini?">Cabut</ActionButton></div> : undefined} />
            );
          })}
        </ListGroup>
      )}
      <p className="mt-4 text-sm text-muted">Key Sandbox berawalan <span className="mono">fxb_test_</span>, Production <span className="mono">fxb_live_</span>. Ganti mode di header untuk mengelola key environment lain. <Link className="text-mint" href="/docs">Pelajari selengkapnya</Link></p>
    </>
  );
}
