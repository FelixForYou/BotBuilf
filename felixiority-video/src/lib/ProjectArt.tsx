import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { easeIO, mix, prog } from "./anim";
import type { Kind } from "./data";

/**
 * Ilustrasi antarmuka tiap project (bukan screenshot), versi animasi dari ProjectArt di situs.
 * Semua elemen muncul bertahap mulai dari frame `start`.
 */
const W = 860;
const H = 560;

const Meter: React.FC<{ v: number; p: number; dark?: boolean }> = ({ v, p, dark }) => (
  <span style={{ flex: 1, height: 10, background: dark ? "rgba(242,238,230,0.12)" : C.bone3, position: "relative", overflow: "hidden" }}>
    <i style={{ position: "absolute", inset: 0, width: `${v * p}%`, background: C.blue }} />
  </span>
);

const Top: React.FC<{ title: string; right: string; p: number }> = ({ title, right, p }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 26px", borderBottom: `1px solid ${C.line}`, fontFamily: F.mono, fontSize: 18, opacity: p }}>
    <b style={{ fontWeight: 500, color: C.ink }}>{title}</b>
    <span style={{ color: C.muted }}>{right}</span>
  </div>
);

export const ProjectArt: React.FC<{ kind: Kind; title: string; start?: number }> = ({ kind, title, start = 0 }) => {
  const f = useCurrentFrame() - start;
  const at = (s: number, d = 18) => prog(f, s, d);

  const frame: React.CSSProperties = { width: W, height: H, background: C.bone, border: `1px solid ${C.lineStrong}`, overflow: "hidden", position: "relative", color: C.ink };

  if (kind === "api") {
    const eps = [["GET", "/ai/chat"], ["GET", "/download/media"], ["POST", "/tools/convert"], ["GET", "/tools/qr"], ["GET", "/info/status"]];
    const json = `{\n  "status": true,\n  "creator": "FxB",\n  "result": {\n    "reply": "Halo!"\n  }\n}`;
    const shown = Math.floor(json.length * at(22, 40));
    const sel = Math.min(4, Math.floor(Math.max(0, f - 50) / 22));
    return (
      <div style={frame}>
        <Top title={title} right="base /api" p={at(0)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: H - 60 }}>
          <ul style={{ margin: 0, padding: 20, listStyle: "none", borderRight: `1px solid ${C.line}` }}>
            {eps.map(([m, p], i) => {
              const q = at(4 + i * 4);
              const on = i === sel;
              return (
                <li key={p} style={{ display: "flex", gap: 16, padding: "16px 14px", fontFamily: F.mono, fontSize: 20, opacity: q, transform: `translateX(${mix(q, -20, 0)}px)`, background: on ? C.ink : "transparent", color: on ? C.bone : C.ink }}>
                  <em style={{ fontStyle: "normal", color: on ? C.bone : C.blue, width: 60 }}>{m}</em>
                  {p}
                </li>
              );
            })}
          </ul>
          <pre style={{ margin: 0, padding: 28, fontFamily: F.mono, fontSize: 22, lineHeight: 1.6, background: C.dark, color: C.bone }}>
            {json.slice(0, shown)}
            <span style={{ background: C.blue, opacity: Math.floor(f / 8) % 2 }}>&nbsp;</span>
          </pre>
        </div>
      </div>
    );
  }

  if (kind === "chat") {
    const bubble = (me: boolean, s: number, children: React.ReactNode) => {
      const q = at(s, 16);
      return (
        <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "75%", padding: "14px 20px", background: me ? C.ink : C.bone2, color: me ? C.bone : C.ink, fontSize: 20, opacity: q, transform: `translateY(${mix(q, 16, 0)}px)`, display: "grid", gap: 10 }}>
          {children}
        </div>
      );
    };
    const line = (w: string, s: number) => <i style={{ display: "block", height: 10, width: w, background: C.ink2, opacity: 0.35, transformOrigin: "left", transform: `scaleX(${at(s, 20)})` }} />;
    return (
      <div style={{ ...frame, display: "grid", gridTemplateColumns: "180px 1fr" }}>
        <aside style={{ borderRight: `1px solid ${C.line}`, padding: 24, display: "grid", gap: 14, alignContent: "start" }}>
          {[0, 1, 2, 3].map((i) => <i key={i} style={{ height: 16, background: i === 0 ? C.blue : C.bone3, opacity: at(i * 3) }} />)}
        </aside>
        <section style={{ display: "flex", flexDirection: "column", gap: 16, padding: 28, position: "relative" }}>
          {bubble(true, 6, "Ringkas artikel ini jadi lima poin.")}
          {bubble(false, 22, <>{line("320px", 26)}{line("280px", 30)}{line("190px", 34)}</>)}
          {bubble(true, 50, "Versi lebih santai?")}
          {bubble(false, 64, <>{line("300px", 68)}{line("150px", 72)}</>)}
          <div style={{ position: "absolute", left: 28, right: 28, bottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.lineStrong}`, padding: "14px 18px", fontSize: 18, color: C.muted, opacity: at(10) }}>
            <span>Tulis pesan…</span>
            <b style={{ width: 28, height: 28, background: C.blue }} />
          </div>
        </section>
      </div>
    );
  }

  if (kind === "panel") {
    const pick = f > 60 ? 2 : -1;
    return (
      <div style={frame}>
        <Top title={title} right="Pilih paket" p={at(0)} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: 26 }}>
          {["A", "B", "C", "D"].map((p, i) => {
            const q = at(4 + i * 5, 22);
            const on = i === pick;
            return (
              <div key={p} style={{ height: 420, border: `1px solid ${on ? C.blue : C.lineStrong}`, background: on ? C.blue : "transparent", color: on ? C.bone : C.ink, padding: 20, display: "flex", flexDirection: "column", gap: 20, opacity: q, transform: `translateY(${mix(q, 40, 0)}px)` }}>
                <small style={{ fontFamily: F.mono, fontSize: 18 }}>Paket {p}</small>
                <b style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>{(i + 1) * 2}GB</b>
                <span style={{ display: "flex" }}><Meter v={25 + i * 22} p={at(16 + i * 4, 30)} dark={on} /></span>
                <span style={{ display: "flex" }}><Meter v={35 + i * 16} p={at(20 + i * 4, 30)} dark={on} /></span>
                <em style={{ marginTop: "auto", fontStyle: "normal", fontFamily: F.mono, fontSize: 18, padding: "12px 0", textAlign: "center", border: `1px solid ${on ? C.bone : C.lineStrong}` }}>{on ? "Dipilih" : "Pilih"}</em>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (kind === "tools") {
    const rows = ["srv-alpha", "srv-bot", "srv-api", "srv-web", "srv-test"];
    const vals = [[62, 40], [34, 71], [80, 55], [91, 88], [22, 30]];
    return (
      <div style={frame}>
        <Top title={title} right="node-01 · servers" p={at(0)} />
        <div style={{ padding: "12px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "24px 200px 1fr 1fr", gap: 24, fontFamily: F.mono, fontSize: 16, color: C.muted, padding: "12px 0", opacity: at(2) }}>
            <span /> <span>SERVER</span><span>CPU</span><span>RAM</span>
          </div>
          {rows.map((s, i) => {
            const q = at(6 + i * 5);
            const warn = i === 3;
            return (
              <div key={s} style={{ display: "grid", gridTemplateColumns: "24px 200px 1fr 1fr", gap: 24, alignItems: "center", padding: "22px 0", borderTop: `1px solid ${C.line}`, fontFamily: F.mono, fontSize: 21, opacity: q }}>
                <i style={{ width: 14, height: 14, background: warn ? C.warn : C.blue, opacity: warn ? 0.4 + 0.6 * Math.abs(Math.sin(f / 8)) : 1 }} />
                <span>{s}</span>
                <span style={{ display: "flex" }}><Meter v={vals[i][0]} p={at(14 + i * 5, 30)} /></span>
                <span style={{ display: "flex" }}><Meter v={vals[i][1]} p={at(18 + i * 5, 30)} /></span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (kind === "warehouse") {
    const on = [2, 7, 13, 19];
    const empty = [4, 10, 16, 22];
    const rot = mix(at(0, 120, ), 38, 48);
    return (
      <div style={{ ...frame, background: C.dark2, border: "1px solid rgba(242,238,230,0.25)", display: "grid", placeItems: "center", perspective: 1400 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 70px)", gap: 14, transform: `rotateX(58deg) rotateZ(${rot}deg)`, transformStyle: "preserve-3d" }}>
          {Array.from({ length: 25 }, (_, i) => {
            const q = at(((i * 7) % 25) * 1.2, 20);
            const isOn = on.includes(i);
            const isEmpty = empty.includes(i);
            const lift = isOn ? mix(at(40 + on.indexOf(i) * 6, 24), 0, 40) : 0;
            return (
              <i
                key={i}
                style={{
                  width: 70,
                  height: 70,
                  background: isOn ? C.blue : isEmpty ? "transparent" : "rgba(242,238,230,0.14)",
                  border: isEmpty ? `1.5px dashed ${C.boneDim}` : "none",
                  boxSizing: "border-box",
                  opacity: q,
                  transform: `translateZ(${lift}px)`,
                  boxShadow: isOn ? `0 0 0 1px ${C.bone} inset, 0 ${lift}px ${lift}px rgba(31,61,255,0.35)` : "none",
                }}
              />
            );
          })}
        </div>
        <span style={{ position: "absolute", left: 26, bottom: 22, fontFamily: F.mono, fontSize: 20, color: C.bone, opacity: at(30) }}>
          user · {Math.round(mix(at(30, 40), 0, 13))}
        </span>
      </div>
    );
  }

  if (kind === "bot") {
    const keys = ["Pesan panel", "Layanan saya", "Perpanjang", "Bantuan"];
    const press = at(56, 8);
    return (
      <div style={{ ...frame, padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: `1px solid ${C.line}`, opacity: at(0) }}>
          <i style={{ width: 44, height: 44, background: C.blue }} />
          <b style={{ fontSize: 24, fontWeight: 600 }}>{title}</b>
          <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 16, color: C.muted }}>bot</span>
        </div>
        <p style={{ margin: 0, alignSelf: "flex-start", background: C.bone2, padding: "16px 22px", fontSize: 22, opacity: at(8), transform: `translateY(${mix(at(8), 14, 0)}px)` }}>Halo. Mau pesan panel atau cek layanan?</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 560 }}>
          {keys.map((k, i) => {
            const q = at(20 + i * 4);
            const on = i === 0;
            return (
              <span key={k} style={{ textAlign: "center", padding: "16px 0", fontSize: 20, fontFamily: F.mono, border: `1px solid ${on ? C.blue : C.lineStrong}`, background: on ? C.blue : "transparent", color: on ? C.bone : C.ink, opacity: q, transform: `scale(${on ? 1 - 0.05 * Math.sin(press * Math.PI) : 1})` }}>
                {k}
              </span>
            );
          })}
        </div>
        <p style={{ margin: 0, alignSelf: "flex-end", background: C.ink, color: C.bone, padding: "16px 22px", fontSize: 22, opacity: at(64), transform: `translateY(${mix(at(64), 14, 0)}px)` }}>Pesan panel</p>
      </div>
    );
  }

  if (kind === "glass") {
    const sel = f > 50 ? 1 : 0;
    return (
      <div style={{ ...frame, background: `radial-gradient(circle at 25% 30%, ${C.blue} 0, transparent 45%), radial-gradient(circle at 80% 80%, #8b9bff 0, transparent 40%), ${C.dark2}`, border: "1px solid rgba(242,238,230,0.25)", display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, padding: 26 }}>
        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          {[0, 1, 2, 3].map((i) => {
            const q = at(4 + i * 4);
            const on = i === sel;
            return (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: 16, background: on ? "rgba(242,238,230,0.28)" : "rgba(242,238,230,0.1)", border: "1px solid rgba(242,238,230,0.3)", backdropFilter: "blur(8px)", opacity: q, transform: `translateX(${mix(q, -20, 0)}px)` }}>
                <i style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(242,238,230,0.5)" }} />
                <span style={{ display: "grid", gap: 8, flex: 1 }}>
                  <b style={{ height: 10, width: "70%", background: C.bone }} />
                  <em style={{ height: 8, width: "45%", background: C.boneDim }} />
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ background: "rgba(242,238,230,0.12)", border: "1px solid rgba(242,238,230,0.3)", padding: 24, display: "flex", flexDirection: "column", gap: 16, opacity: at(10, 24) }}>
          {[["58%", false, 20], ["40%", false, 30], ["50%", true, 44]].map(([w, me, s], i) => {
            const q = at(s as number);
            return <p key={i} style={{ margin: 0, height: 46, width: w as string, alignSelf: me ? "flex-end" : "flex-start", background: me ? "rgba(31,61,255,0.85)" : "rgba(242,238,230,0.3)", borderRadius: 18, opacity: q, transform: `scale(${mix(q, 0.9, 1)})` }} />;
          })}
        </div>
      </div>
    );
  }

  // motion
  const head = mix(prog(f, 6, 90, easeIO), 4, 94);
  const tracks = [[8, 30, 62], [18, 44], [12, 52, 80], [36, 70]];
  const bob = Math.sin((head / 100) * Math.PI * 2);
  return (
    <div style={{ ...frame, background: C.dark2, border: "1px solid rgba(242,238,230,0.25)", color: C.bone }}>
      <div style={{ height: 300, position: "relative", borderBottom: `1px solid ${C.lineDark}`, overflow: "hidden" }}>
        <span style={{ position: "absolute", left: `${12 + head * 0.7}%`, top: 120 + bob * 60, width: 70, height: 70, background: C.blue, transform: `rotate(${head * 3.6}deg)` }} />
        <span style={{ position: "absolute", right: `${10 + head * 0.4}%`, top: 90 - bob * 40, width: 50, height: 50, border: `2px solid ${C.bone}`, borderRadius: 25 }} />
      </div>
      <div style={{ position: "relative", padding: "22px 26px", display: "grid", gap: 18 }}>
        {tracks.map((keys, i) => (
          <div key={i} style={{ height: 34, background: "rgba(242,238,230,0.06)", position: "relative", opacity: at(i * 4) }}>
            {keys.map((k) => (
              <i key={k} style={{ position: "absolute", left: `${k}%`, top: 9, width: 16, height: 16, background: head >= k ? C.blue : C.bone, transform: `rotate(45deg) scale(${head >= k && head < k + 4 ? 1.4 : 1})` }} />
            ))}
          </div>
        ))}
        <b style={{ position: "absolute", top: 12, bottom: 12, left: `calc(26px + ${head}% * 0.94)`, width: 2, background: C.blue }} />
      </div>
    </div>
  );
};

export const ART_SIZE = { w: W, h: H };
