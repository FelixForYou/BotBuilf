"use client";

import { useState } from "react";
import { Button, CopyButton } from "@/components/client";

const PRESETS = {
  "POST /api/v1/payments": JSON.stringify({ amount: 50000, description: "Uji playground", order_ref: "PG-001", expires_in_minutes: 30 }, null, 2),
  "GET /api/v1/payments": "",
  "GET /api/v1/payments/{id}": "",
  "GET /api/v1/balance": "",
  "GET /api/v1/transactions": "",
} as const;
type K = keyof typeof PRESETS;

export function Playground() {
  const [key, setKey] = useState("");
  const [ep, setEp] = useState<K>("POST /api/v1/payments");
  const [id, setId] = useState("");
  const [body, setBody] = useState<string>(PRESETS["POST /api/v1/payments"]);
  const [out, setOut] = useState<string>("");
  const [loading, setLoading] = useState(false);
  async function send() {
    if (!key.startsWith("fxb_test_")) return setOut("Hanya API key Sandbox (fxb_test_) yang diizinkan di playground.");
    const [method, path0] = ep.split(" ");
    const path = path0.replace("{id}", encodeURIComponent(id));
    setLoading(true);
    const t = performance.now();
    try {
      const res = await fetch(path, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(method === "POST" ? { "Idempotency-Key": crypto.randomUUID() } : {}) }, body: method === "POST" ? body : undefined, credentials: "omit" });
      const txt = await res.text();
      let pretty = txt;
      try { pretty = JSON.stringify(JSON.parse(txt), null, 2); } catch { /* bukan JSON */ }
      setOut(`HTTP ${res.status} · ${Math.round(performance.now() - t)} ms\n\n${pretty}`);
    } catch (e) {
      setOut(String(e));
    }
    setLoading(false);
  }
  return (
    <div className="card space-y-4 p-5">
      <div><label className="label" htmlFor="pk">API key sandbox</label><input id="pk" className="input mono" value={key} onChange={(e) => setKey(e.target.value.trim())} placeholder="fxb_test_..." autoComplete="off" /></div>
      <div><label className="label" htmlFor="pe">Endpoint</label>
        <select id="pe" className="input" value={ep} onChange={(e) => { const k = e.target.value as K; setEp(k); setBody(PRESETS[k]); }}>
          {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>
      {ep.includes("{id}") && <div><label className="label" htmlFor="pid">ID atau referensi</label><input id="pid" className="input mono" value={id} onChange={(e) => setId(e.target.value)} placeholder="pl_..." /></div>}
      {ep.startsWith("POST") && <div><label className="label" htmlFor="pb">Body JSON</label><textarea id="pb" className="input mono text-sm" rows={8} value={body} onChange={(e) => setBody(e.target.value)} /></div>}
      <Button size="lg" className="w-full" icon="play" loading={loading} onClick={send}>Kirim</Button>
      {out && <div><pre className="mono max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/40 p-4 text-xs">{out}</pre><div className="mt-2"><CopyButton value={out} label="Salin respons" /></div></div>}
    </div>
  );
}
