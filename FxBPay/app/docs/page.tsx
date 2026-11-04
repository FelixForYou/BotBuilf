import Link from "next/link";
import { config } from "@/lib/env";
import { Logo } from "@/components/icons";
import { Card, SectionTitle } from "@/components/ui";
import { CopyButton } from "@/components/client";
import { WEBHOOK_EVENTS } from "@/lib/webhooks-out";

export const metadata = { title: "Dokumentasi API" };
export const dynamic = "force-dynamic";

function Code({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-black/40">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs font-semibold text-muted">{title}<CopyButton value={code} iconOnly /></div>
      <pre className="mono overflow-x-auto p-4 text-xs leading-relaxed">{code}</pre>
    </div>
  );
}

export default function Docs() {
  const base = config.appUrl;
  const curl = `curl -X POST ${base}/api/v1/payments \\
  -H "Authorization: Bearer fxb_test_xxx" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: order-1001" \\
  -d '{"amount":50000,"description":"Kaos L","order_ref":"INV-1001","expires_in_minutes":30}'`;
  const node = `const res = await fetch("${base}/api/v1/payments", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.FXB_API_KEY}\`,
    "Content-Type": "application/json",
    "Idempotency-Key": "order-1001",
  },
  body: JSON.stringify({ amount: 50000, description: "Kaos L", order_ref: "INV-1001" }),
});
const payment = await res.json();
// Arahkan pembeli ke payment.checkout_url

// Verifikasi webhook (Express, body mentah)
import crypto from "node:crypto";
function verify(rawBody, header, secret) {
  const { t, v1 } = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(\`\${t}.\${rawBody}\`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}`;
  const php = `<?php
$ch = curl_init("${base}/api/v1/payments");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . getenv("FXB_API_KEY"),
    "Content-Type: application/json",
    "Idempotency-Key: order-1001",
  ],
  CURLOPT_POSTFIELDS => json_encode(["amount" => 50000, "description" => "Kaos L", "order_ref" => "INV-1001"]),
]);
$payment = json_decode(curl_exec($ch), true);

// Verifikasi webhook
$raw = file_get_contents("php://input");
parse_str(str_replace(",", "&", $_SERVER["HTTP_FXB_SIGNATURE"]), $sig);
$expected = hash_hmac("sha256", $sig["t"] . "." . $raw, getenv("FXB_WEBHOOK_SECRET"));
if (!hash_equals($expected, $sig["v1"]) || abs(time() - (int)$sig["t"]) > 300) { http_response_code(400); exit; }`;
  const endpoints: [string, string, string][] = [
    ["POST", "/api/v1/payments", "Buat pembayaran (scope payments:write, wajib Idempotency-Key)"],
    ["GET", "/api/v1/payments?status=&from=&to=&q=&limit=&offset=", "Daftar pembayaran (payments:read)"],
    ["GET", "/api/v1/payments/{id|referensi}", "Status pembayaran (payments:read)"],
    ["GET", "/api/v1/balance", "Saldo tersedia, tertahan, dicadangkan (balance:read)"],
    ["GET", "/api/v1/transactions?limit=", "Mutasi ledger (transactions:read)"],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="flex items-center gap-2.5"><Logo size={30} /><span className="font-extrabold">FxB Pay</span><span className="text-muted">/ Dokumentasi API</span></Link>
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight">API FxB Pay v1</h1>
      <p className="mt-3 text-muted">Base URL <span className="mono text-fg">{base}</span>. Autentikasi memakai header <span className="mono">Authorization: Bearer &lt;API key&gt;</span>. Key <span className="mono">fxb_test_</span> bekerja di Sandbox, <span className="mono">fxb_live_</span> di Production — data keduanya terpisah penuh. Batas default 120 permintaan/menit per key.</p>
      <SectionTitle>Endpoint</SectionTitle>
      <Card pad={false}>
        <table className="table"><tbody>{endpoints.map(([m, p, d]) => <tr key={p}><td className="mono font-bold text-mint">{m}</td><td className="mono text-xs">{p}</td><td className="text-muted">{d}</td></tr>)}</tbody></table>
      </Card>
      <SectionTitle>Contoh</SectionTitle>
      <div className="space-y-4">
        <Code title="cURL" code={curl} />
        <Code title="Node.js" code={node} />
        <Code title="PHP" code={php} />
      </div>
      <SectionTitle>Status pembayaran</SectionTitle>
      <Card><p className="text-sm text-muted"><span className="mono text-fg">CREATED → PENDING → PAID</span>, serta <span className="mono">EXPIRED</span>, <span className="mono">FAILED</span>, <span className="mono">CANCELLED</span>, <span className="mono">REFUND_PENDING</span>, <span className="mono">PARTIALLY_REFUNDED</span>, <span className="mono">REFUNDED</span>. Status PAID hanya ditetapkan setelah server FxB Pay menerima notifikasi DANA yang signature-nya valid atau hasil Query Payment resmi. Jangan menganggap redirect pembeli sebagai bukti pembayaran — tunggu webhook <span className="mono">payment.paid</span> atau cek status lewat API.</p></Card>
      <SectionTitle>Webhook</SectionTitle>
      <Card><p className="text-sm text-muted">Event: {WEBHOOK_EVENTS.map((e) => <span key={e} className="mono mr-2 text-fg">{e}</span>)}. Header <span className="mono">FxB-Signature: t=&lt;unix&gt;,v1=&lt;hex HMAC-SHA256(secret, t + &quot;.&quot; + body)&gt;</span>, juga <span className="mono">FxB-Event-Id</span> untuk deduplikasi. Balas HTTP 2xx dalam 10 detik; jika gagal dikirim ulang dengan backoff eksponensial hingga 8 kali.</p></Card>
      <SectionTitle>Error</SectionTitle>
      <Card><p className="text-sm text-muted">Format <span className="mono">{`{"error":{"code":"...","message":"..."}}`}</span>. Kode umum: 401 unauthenticated, 403 insufficient_scope, 409 idempotency_in_progress, 422 validation_error / idempotency_mismatch, 429 rate_limited, 503 not_configured.</p></Card>
    </div>
  );
}
