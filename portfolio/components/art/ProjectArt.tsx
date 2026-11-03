import type { PreviewKind } from "@/lib/types";

/**
 * Ilustrasi antarmuka berbasis HTML/CSS (bukan screenshot asli).
 * Ukuran memakai container query (cqw), jadi tetap proporsional di card kecil maupun showcase besar.
 */
export function ProjectArt({ kind, title }: { kind: PreviewKind; title: string }) {
  return (
    <div className={`art art--${kind}`} aria-hidden="true">
      {ART[kind]?.(title) ?? ART.api(title)}
    </div>
  );
}

const bars = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => 28 + ((seed * 37 + i * 53) % 64));

const ART: Record<PreviewKind, (title: string) => React.ReactNode> = {
  api: (title) => (
    <>
      <div className="art-top"><b>{title}</b><span>base /api</span></div>
      <div className="art-api">
        <ul>
          {[["GET", "/ai/chat"], ["GET", "/download/media"], ["POST", "/tools/convert"], ["GET", "/tools/qr"], ["GET", "/info/status"]].map(([m, p], i) => (
            <li key={p} className={i === 0 ? "is-on" : ""}><em>{m}</em>{p}</li>
          ))}
        </ul>
        <pre>{`{\n  "status": true,\n  "creator": "FxB",\n  "result": {\n    "reply": "…"\n  }\n}`}</pre>
      </div>
    </>
  ),
  chat: () => (
    <div className="art-chat">
      <aside><i /><i /><i /><i /></aside>
      <section>
        <p className="me">Ringkas artikel ini jadi lima poin.</p>
        <p className="ai"><i /><i /><i style={{ width: "62%" }} /></p>
        <p className="me">Versi lebih santai?</p>
        <p className="ai"><i /><i style={{ width: "48%" }} /></p>
        <div className="art-chat__input"><span>Tulis pesan…</span><b /></div>
      </section>
    </div>
  ),
  panel: (title) => (
    <>
      <div className="art-top"><b>{title}</b><span>Pilih paket</span></div>
      <div className="art-plans">
        {["A", "B", "C", "D"].map((p, i) => (
          <div key={p} className={i === 2 ? "is-on" : ""}>
            <small>Paket {p}</small>
            <span className="art-meter" style={{ ["--v" as string]: `${25 + i * 22}%` }} />
            <span className="art-meter" style={{ ["--v" as string]: `${35 + i * 16}%` }} />
            <em>{i === 2 ? "Dipilih" : "Pilih"}</em>
          </div>
        ))}
      </div>
    </>
  ),
  tools: (title) => (
    <>
      <div className="art-top"><b>{title}</b><span>node-01 · servers</span></div>
      <div className="art-table">
        {["srv-alpha", "srv-bot", "srv-api", "srv-web", "srv-test"].map((s, i) => (
          <div key={s} className="art-row">
            <i className={i === 3 ? "is-warn" : ""} />
            <span>{s}</span>
            <span className="art-meter" style={{ ["--v" as string]: `${bars(1, i + 2)[0]}%` }} />
            <span className="art-meter" style={{ ["--v" as string]: `${bars(1, i + 5)[0]}%` }} />
          </div>
        ))}
      </div>
    </>
  ),
  warehouse: () => (
    <div className="art-iso">
      <div className="art-iso__floor">
        {Array.from({ length: 25 }, (_, i) => (
          <i key={i} className={[2, 7, 13, 19].includes(i) ? "is-on" : [4, 10, 16, 22].includes(i) ? "is-empty" : ""} />
        ))}
      </div>
      <span className="art-iso__tag">user · 13</span>
    </div>
  ),
  bot: (title) => (
    <div className="art-bot">
      <div className="art-bot__head"><i /><b>{title}</b></div>
      <p className="bot">Halo. Mau pesan panel atau cek layanan?</p>
      <div className="art-bot__keys">
        <span className="is-on">Pesan panel</span><span>Layanan saya</span><span>Perpanjang</span><span>Bantuan</span>
      </div>
      <p className="me">Pesan panel</p>
    </div>
  ),
  glass: () => (
    <div className="art-glass">
      <div className="art-glass__list">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={i === 1 ? "is-on" : ""}><i /><span><b /><em /></span></div>
        ))}
      </div>
      <div className="art-glass__pane"><p /><p /><p className="me" /></div>
    </div>
  ),
  motion: () => (
    <div className="art-motion">
      <div className="art-motion__stage"><span /><span /></div>
      <div className="art-motion__tracks">
        {[[8, 30, 62], [18, 44], [12, 52, 80], [36, 70]].map((keys, i) => (
          <div key={i} className="art-motion__track">
            {keys.map((k) => <i key={k} style={{ left: `${k}%` }} />)}
          </div>
        ))}
        <b className="art-motion__head" />
      </div>
    </div>
  ),
};
