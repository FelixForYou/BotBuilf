"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, ChevronDown, ChevronUp, Copy, Download, FileUp, Lightbulb, Play, Power, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EndpointPublic } from "@/lib/catalog-types";
import { useApp } from "./providers";
import { Badge, Button, CodeBlock, Field, Input, ProgressBar, Select, StatGrid, Steps, Textarea, copyText, cx, toast, type StepState } from "./ui";

type Phase = "idle" | "running" | "success" | "error";

interface RunResult {
  status: number;
  ms: number;
  readMs: number;
  contentType: string;
  json?: unknown;
  blobUrl?: string;
  size: number;
  headers: Record<string, string>;
}

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const HINTS: Record<string, { title: string; text: string; tip: string }> = {
  API_KEY_REQUIRED: { title: "API key dibutuhkan", text: "Request dari luar situs wajib memakai API key.", tip: "Buat key gratis di Dashboard › API Key." },
  INVALID_API_KEY: { title: "API key tidak dikenali", text: "Key salah ketik, sudah dibuat ulang, atau milik akun lain.", tip: "Salin ulang key dari dashboard lalu coba lagi." },
  KEY_REVOKED: { title: "API key dicabut", text: "Key ini sudah tidak aktif.", tip: "Buat key baru di dashboard." },
  PREMIUM_REQUIRED: { title: "Khusus premium", text: "Endpoint ini hanya untuk API key premium.", tip: "Upgrade key di halaman Pricing." },
  RATE_LIMITED: { title: "Limit tercapai", text: "Kuota request untuk key ini sudah habis sementara.", tip: "Tunggu sebentar, lalu tap Coba lagi." },
  INVALID_PARAMS: { title: "Parameter belum benar", text: "Ada parameter yang kosong atau formatnya salah.", tip: "Periksa kolom yang ditandai lalu kirim ulang." },
  PROVIDER_UNAVAILABLE: { title: "Layanan belum tersedia", text: "Penyedia untuk endpoint ini belum dikonfigurasi atau kuotanya habis.", tip: "Coba endpoint lain atau hubungi admin." },
  MAINTENANCE: { title: "Sedang perbaikan", text: "Endpoint ini dinonaktifkan sementara oleh admin.", tip: "Coba lagi nanti." },
  PROVIDER_ERROR: { title: "Penyedia bermasalah", text: "Server penyedia mengembalikan error. Permintaanmu kemungkinan sudah benar.", tip: "Tunggu sekitar satu menit, lalu tap Coba lagi." },
  PROVIDER_TIMEOUT: { title: "Proses terlalu lama", text: "Penyedia tidak merespons tepat waktu.", tip: "Tunggu sekitar satu menit, lalu tap Coba lagi." },
  NOT_FOUND: { title: "Data tidak ditemukan", text: "Konten tidak ada, privat, atau sudah dihapus.", tip: "Periksa kembali link/kata kunci." },
};

export function Runner({ ep, autoFocus }: { ep: EndpointPublic; autoFocus?: boolean }) {
  const { me } = useApp();
  const initial = useMemo(() => Object.fromEntries(ep.params.filter((p) => p.type !== "file").map((p) => [p.name, p.example ?? p.default ?? ""])), [ep]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [apiKey, setApiKey] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [res, setRes] = useState<RunResult | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const started = useRef(0);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    setValues(initial);
    setFiles({});
    setRes(null);
    setPhase("idle");
  }, [initial]);

  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => setElapsed(Date.now() - started.current), 100);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => () => {
    if (res?.blobUrl) URL.revokeObjectURL(res.blobUrl);
  }, [res]);

  const hasFile = ep.params.some((p) => p.type === "file");
  const useForm = hasFile && Object.values(files).some(Boolean);

  async function run() {
    setFieldErrors({});
    const missing = ep.params.filter((p) => p.required && (p.type === "file" ? !files[p.name] : !values[p.name]?.trim()));
    if (missing.length) {
      setFieldErrors(Object.fromEntries(missing.map((m) => [m.name, "Wajib diisi"])));
      toast("Lengkapi parameter wajib dulu.", "warn");
      return;
    }
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    started.current = Date.now();
    setElapsed(0);
    setRes(null);
    setPhase("running");
    const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""));
    const headers: Record<string, string> = {};
    if (apiKey.trim()) headers["X-API-Key"] = apiKey.trim();
    let url = ep.path;
    let body: BodyInit | undefined;
    if (ep.method === "GET" && !useForm) url += "?" + new URLSearchParams(clean).toString();
    else if (useForm) {
      const f = new FormData();
      Object.entries(clean).forEach(([k, v]) => f.append(k, v));
      Object.entries(files).forEach(([k, v]) => v && f.append(k, v));
      body = f;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(clean);
    }
    try {
      const r = await fetch(url, { method: ep.method === "GET" && !useForm ? "GET" : "POST", headers, body, signal: ctrl.current.signal });
      const tHeaders = Date.now() - started.current;
      const ct = r.headers.get("content-type") ?? "";
      const h: Record<string, string> = {};
      r.headers.forEach((v, k) => {
        if (k.startsWith("x-") || k === "content-type" || k === "retry-after") h[k] = v;
      });
      let out: RunResult;
      if (ct.includes("application/json")) {
        const text = await r.text();
        let j: unknown = text;
        try {
          j = JSON.parse(text);
        } catch {
          /* tampilkan teks mentah */
        }
        out = { status: r.status, ms: tHeaders, readMs: Date.now() - started.current - tHeaders, contentType: ct, json: j, size: text.length, headers: h };
        const details = (j as { error?: { details?: { param: string; message: string }[] } })?.error?.details;
        if (Array.isArray(details)) setFieldErrors(Object.fromEntries(details.map((d) => [d.param, d.message])));
      } else {
        const blob = await r.blob();
        out = { status: r.status, ms: tHeaders, readMs: Date.now() - started.current - tHeaders, contentType: ct, blobUrl: URL.createObjectURL(blob), size: blob.size, headers: h };
      }
      setRes(out);
      setElapsed(Date.now() - started.current);
      setPhase(r.ok ? "success" : "error");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setPhase("idle");
        return;
      }
      setRes({ status: 0, ms: Date.now() - started.current, readMs: 0, contentType: "", json: { status: false, error: { code: "NETWORK", message: "Koneksi terputus. Periksa internet lalu coba lagi." } }, size: 0, headers: {} });
      setPhase("error");
    }
  }

  const err = (res?.json as { error?: { code: string; message: string } })?.error;
  const errStep = !err ? 2 : ["API_KEY_REQUIRED", "INVALID_API_KEY", "KEY_REVOKED", "PREMIUM_REQUIRED", "RATE_LIMITED", "ACCOUNT_SUSPENDED", "INVALID_PARAMS", "METHOD_NOT_ALLOWED", "MAINTENANCE"].includes(err.code) ? 1 : 2;
  const stepStates: StepState[] =
    phase === "running" ? ["done", "active", "todo", "todo"]
    : phase === "success" ? ["done", "done", "done", "done"]
    : phase === "error" ? (errStep === 1 ? ["done", "error", "todo", "todo"] : ["done", "done", "error", "todo"])
    : ["todo", "todo", "todo", "todo"];
  const progress = phase === "running" ? Math.min(85, 25 + (elapsed / 15000) * 60) : phase === "success" ? 100 : phase === "error" ? 100 : 0;
  const hint = err ? HINTS[err.code] ?? { title: "Request tidak selesai", text: err.message, tip: "Tunggu sekitar satu menit, lalu tap Coba lagi." } : null;
  const detailsText = err ? `Endpoint: ${ep.path}\nStatus: ${res?.status}\nCode: ${err.code}\nMessage: ${err.message}` : "";

  return (
    <div className="space-y-5">
      {/* Form parameter */}
      <div className="space-y-4">
        {ep.params.map((p) => (
          <Field
            key={p.name}
            label={
              <span className="flex items-center gap-2">
                <span className="font-mono text-fg">{p.name}</span>
                {p.required ? <Badge tone="warn">wajib</Badge> : <span className="text-subtle">opsional</span>}
              </span>
            }
            hint={p.description}
            error={fieldErrors[p.name]}
          >
            {p.type === "enum" ? (
              <Select value={values[p.name] ?? ""} onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}>
                {!p.required && <option value="">— default{p.default ? ` (${p.default})` : ""} —</option>}
                {p.options?.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            ) : p.type === "boolean" ? (
              <Select value={values[p.name] ?? ""} onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}>
                <option value="">— default{p.default ? ` (${p.default})` : ""} —</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </Select>
            ) : p.type === "file" ? (
              <FilePick file={files[p.name] ?? null} onChange={(f) => setFiles({ ...files, [p.name]: f })} />
            ) : (p.max ?? 0) > 600 || p.type === "json" ? (
              <Textarea value={values[p.name] ?? ""} placeholder={p.example} onChange={(e) => setValues({ ...values, [p.name]: e.target.value })} className="font-mono text-[14px]" />
            ) : (
              <Input
                autoFocus={autoFocus && p === ep.params[0]}
                value={values[p.name] ?? ""}
                placeholder={p.example || p.default}
                inputMode={p.type === "number" ? "numeric" : undefined}
                onChange={(e) => setValues({ ...values, [p.name]: e.target.value })}
                onClear={() => setValues({ ...values, [p.name]: "" })}
              />
            )}
          </Field>
        ))}
        <Field label="API key (opsional)" hint={me ? "Kosongkan untuk memakai key terbaik di akunmu (mode Explorer)." : "Kosongkan untuk mode uji coba terbatas, atau tempel key milikmu."}>
          <Input value={apiKey} placeholder="fxb_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" onChange={(e) => setApiKey(e.target.value)} onClear={() => setApiKey("")} className="font-mono text-[14px]" autoComplete="off" />
        </Field>
      </div>

      {phase === "running" ? (
        <Button size="lg" variant="secondary" className="w-full" icon={X} onClick={() => ctrl.current?.abort()}>
          Batalkan
        </Button>
      ) : (
        <Button size="lg" className="w-full" icon={Play} onClick={run} disabled={ep.status !== "online"}>
          {phase === "error" ? "Coba lagi" : ep.status === "online" ? "Kirim request" : ep.status === "maintenance" ? "Sedang perbaikan" : "Belum dikonfigurasi"}
        </Button>
      )}

      {/* Status (gaya layar build) */}
      <AnimatePresence initial={false}>
        {phase !== "idle" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {phase === "error" && hint && (
              <div className="rounded-[26px] bg-card p-5 text-center">
                <div className="mx-auto grid size-[72px] place-items-center rounded-full bg-danger-soft">
                  <Power className="size-8 text-danger" strokeWidth={2.2} />
                </div>
                <h3 className="mt-4 text-[22px] font-bold">{hint.title}</h3>
                <p className="mt-1.5 text-[15px] text-muted">{hint.text}</p>
                <StatGrid className="mt-5" items={[{ value: res?.status || "—", label: "HTTP" }, { value: mmss(elapsed), label: "Waktu" }]} />
                <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-card-2 px-4 py-3.5 text-left text-[14.5px]">
                  <Lightbulb className="size-5 shrink-0 text-mint" />
                  {hint.tip}
                </div>
                <button onClick={() => setShowDetails(!showDetails)} className="mx-auto mt-5 flex items-center gap-1.5 text-[15px] text-muted hover:text-fg">
                  {showDetails ? "Sembunyikan detail" : "Lihat detail"} {showDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {showDetails && (
                  <div className="mt-3 rounded-[18px] border border-danger/30 bg-danger-soft/40 p-4 text-left text-[14px] text-danger-ink">
                    <div>Step: {errStep === 1 ? "Validasi" : "Proses"}</div>
                    <div>Code: {err?.code}</div>
                    <div className="mt-2 break-words">{err?.message}</div>
                    <button onClick={async () => (await copyText(detailsText)) && toast("Detail disalin.")} className="mt-3 flex items-center gap-2 font-medium text-mint">
                      <Copy className="size-4" /> Salin detail
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-[26px] bg-card p-5">
              <div className="flex items-center justify-between text-[14.5px] text-muted">
                <span>{phase === "running" ? "Memanggil endpoint" : phase === "success" ? "Respons diterima" : "Request gagal"}</span>
                <span className="shrink-0 whitespace-nowrap">Step {phase === "success" ? 4 : phase === "running" ? 2 : errStep + 1} of 4 · {mmss(elapsed)}</span>
              </div>
              <ProgressBar value={progress} className="mt-3" />
              <StatGrid className="mt-5 !bg-transparent" items={[{ value: ep.method, label: "Method" }, { value: res?.status || "…", label: "Status" }, { value: res ? `${res.ms} ms` : mmss(elapsed), label: "Latency" }]} />
              <h4 className="mb-4 mt-6 text-[19px] font-semibold">Langkah request</h4>
              <Steps
                steps={[
                  { label: "Kirim", state: stepStates[0], time: "00:00" },
                  { label: "Validasi key & parameter", sub: stepStates[1] === "active" ? "Memeriksa…" : undefined, state: stepStates[1] },
                  { label: "Proses", sub: stepStates[2] === "active" ? "Menunggu penyedia" : undefined, state: stepStates[2], time: res && stepStates[2] === "done" ? `${(res.ms / 1000).toFixed(2)}s` : undefined },
                  { label: "Selesai", state: stepStates[3], time: res && phase === "success" ? `${((res.ms + res.readMs) / 1000).toFixed(2)}s` : undefined },
                ]}
              />
            </div>

            {res && phase === "success" && (
              <div className="rounded-[26px] bg-card p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-7 text-mint" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[17px] font-semibold">Berhasil</div>
                    <div className="truncate text-[13px] text-muted">
                      {res.contentType.split(";")[0]} · {(res.size / 1024).toFixed(1)} KB
                      {res.headers["x-ratelimit-remaining"] ? ` · sisa ${res.headers["x-ratelimit-remaining"]} request` : ""}
                    </div>
                  </div>
                  {res.headers["x-tier"] && <Badge tone={res.headers["x-tier"] === "premium" ? "mint" : "neutral"}>{res.headers["x-tier"]}</Badge>}
                </div>
              </div>
            )}
            {res && (res.json !== undefined ? (
              <CodeBlock lang={`response ${res.status}`} code={JSON.stringify(res.json, null, 2)} />
            ) : res.blobUrl ? (
              <div className="overflow-hidden rounded-[22px] border border-line bg-card">
                {res.contentType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={res.blobUrl} alt="Hasil" className="mx-auto max-h-[520px] w-auto object-contain" />
                ) : (
                  <div className="p-5 text-muted">File biner ({res.contentType})</div>
                )}
                <div className="flex justify-end border-t border-line p-3">
                  <Button size="sm" variant="secondary" icon={Download} onClick={() => { const a = document.createElement("a"); a.href = res.blobUrl!; a.download = ep.id.replace(/\//g, "-"); a.click(); }}>
                    Unduh
                  </Button>
                </div>
              </div>
            ) : null)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilePick({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <input ref={ref} type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      <button type="button" onClick={() => ref.current?.click()} className={cx("flex h-14 flex-1 items-center justify-between rounded-[18px] bg-card-2 px-4 text-left text-[16px] transition hover:bg-card-3", file ? "text-fg" : "text-fg")}>
        <span className="truncate">{file ? file.name : "Pilih file"}</span>
        {file ? <FileUp className="size-5 text-mint" /> : <Upload className="size-5" />}
      </button>
      {file && (
        <button type="button" aria-label="Hapus file" onClick={() => onChange(null)} className="grid size-14 place-items-center rounded-[18px] bg-card-2 hover:bg-card-3">
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}
