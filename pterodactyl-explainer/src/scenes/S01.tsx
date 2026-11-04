import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { drift } from "../lib/anim";
import { arc, breathe, clamp01, DRIFT, GLIDE, inOut, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, DashedGrid, Flow, GlowWave, Obj, Stage, Words, WarmLight, LightStreak } from "../components/Primitives";
import { MBlur, SwapText } from "../components/Motion";
import { ServerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo, PteroLogo } from "../components/Logos";
import { PowerButtons, StatusPill } from "../components/UI";

const L = makeLocal("s01");
const T = {
  pesan: L.c("Pesan"), masuk: L.c("masuk"), bot: L.c("Bot"), membalas: L.c("membalas"), hanya: L.c("Hanya"), layar: L.c("Di layar"),
  tapi: L.c("Tapi"), bekerja: L.c("bekerja"), balik: L.c("baliknya"), setiap: L.c("Setiap"), aplikasi: L.c("aplikasi"), berjalan: L.c("berjalan"),
  perangkat: L.c("perangkat"), server: L.c("server yang aktif"), untuk: L.c("Untuk"), mengawasi: L.c("mengawasi"), panel: L.c("panel"),
  salah: L.c("Salah"), ptero: L.c("Pterodactyl"), panelName: L.c("Panel", 1), end: L.dur,
};
const SX = 560; // server position in the white world
const DIVE = T.balik - 4; // server turns around: "di baliknya"
const BLACK = DIVE + 30; // black world fully on screen

const Bubble: React.FC<{ text: string; side: "user" | "bot"; w?: number }> = ({ text, side, w = 320 }) => (
  <div style={{ width: w, padding: "15px 20px", borderRadius: 22, borderBottomLeftRadius: side === "bot" ? 6 : 22, borderBottomRightRadius: side === "user" ? 6 : 22,
    background: side === "user" ? C.telegram : "#fff", color: side === "user" ? "#fff" : C.ink, fontFamily: FONT, fontSize: 22, fontWeight: 500,
    boxShadow: "0 18px 44px rgba(10,10,12,0.16)", display: "flex", gap: 12, alignItems: "center", border: side === "bot" ? "1px solid rgba(0,0,0,0.06)" : undefined }}>
    {side === "bot" && <BrandLogo brand="telegram" size={26} />}
    {text}
  </div>
);

const CHAT: { user: boolean; text: string }[] = [
  { user: true, text: "Halo, ada jadwal hari ini?" }, { user: false, text: "Ada. Rapat pukul 10.00" },
  { user: true, text: "/info" }, { user: false, text: "Asisten Bot siap membantu." },
  { user: true, text: "Ingatkan jam 9 ya" }, { user: false, text: "Siap, pengingat dibuat." },
  { user: true, text: "/jadwal besok" }, { user: false, text: "Besok: kirim laporan." },
  { user: true, text: "Terima kasih!" }, { user: false, text: "Sama-sama." },
];
/** Phone mock-up: header + clipped message list; each new message pops in and the list scrolls one step. */
const PhoneChat: React.FC<{ f: number; start: number }> = ({ f, start }) => {
  const W = 380, H = 660, ROW = 64, VIEW = 7; // rows visible in the screen
  const at = (k: number) => (k < 2 ? start - 20 : start + 26 + (k - 2) * 26);
  let scroll = 0;
  CHAT.forEach((_, k) => { if (k >= VIEW) scroll += clamp01(spr(f, at(k) - 2, SNAP)) * ROW; });
  return (
    <div style={{ width: W, height: H, borderRadius: 56, background: "#0f1012", padding: 10, boxSizing: "border-box", boxShadow: "0 30px 80px rgba(10,10,12,0.22)" }}>
      <div style={{ position: "relative", width: W - 20, height: H - 20, borderRadius: 46, background: "#eef3f7", clipPath: "inset(0 round 46px)", fontFamily: FONT }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 104, background: C.telegram, display: "flex", alignItems: "flex-end", gap: 12, padding: "0 20px 14px", boxSizing: "border-box", color: "#fff", zIndex: 2 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="Bot" size={22} color="#fff" /></div>
          <div><div style={{ fontSize: 18, fontWeight: 700 }}>Asisten Bot</div><div style={{ fontSize: 13, opacity: 0.85 }}>bot · contoh fiktif</div></div>
        </div>
        <div style={{ position: "absolute", left: 125, top: 12, width: 110, height: 28, borderRadius: 14, background: "#0f1012", zIndex: 3 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 104, bottom: 64, clipPath: "inset(0)" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 14, transform: `translateY(${-scroll}px)` }}>
            {CHAT.map((m, k) => {
              const q = clamp01(spr(f, at(k), POP));
              if (f < at(k)) return null;
              return (
                <div key={k} style={{ position: "absolute", top: k * ROW, [m.user ? "right" : "left"]: 14, maxWidth: 260, padding: "10px 14px", borderRadius: 16,
                  borderBottomRightRadius: m.user ? 5 : 16, borderBottomLeftRadius: m.user ? 16 : 5, background: m.user ? "#d9f2ff" : "#fff", color: C.ink, fontSize: 16, lineHeight: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)", whiteSpace: "nowrap", opacity: q, transform: `translateY(${(1 - q) * 18}px) scale(${lerp(0.85, 1, q)})`, transformOrigin: m.user ? "right bottom" : "left bottom" }}>
                  {m.text}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, height: 40, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", padding: "0 14px", color: "#9aa0a6", fontSize: 14, gap: 8 }}>
          Pesan<div style={{ flex: 1 }} /><Icon name="Send" size={18} color={C.telegram} />
        </div>
      </div>
    </div>
  );
};

/* ---- white world camera: whip after the message, orbit, then dive behind the server */
const camW = (f: number) =>
  rig(f, { x: 0, y: -40, z: -150 }, [
    { at: T.pesan + 6, to: { x: SX * 0.5, z: -210, ry: -4 }, feel: WHIP },
    { at: T.pesan + 34, to: { x: SX, z: -300, ry: 2, y: 0 }, feel: GLIDE },
    { at: T.bot - 2, to: { x: 120, z: -240, ry: 6 }, feel: WHIP },
    { at: T.membalas + 40, to: { x: SX, z: -380, ry: -3 }, feel: GLIDE },
    { at: T.hanya + 30, to: { z: -470, ry: 3 }, feel: DRIFT },
    { at: T.layar - 8, to: { x: 210, z: 160, ry: 7, rx: 4 }, feel: GLIDE },
    { at: T.layar + 70, to: { ry: -5, x: 250 }, feel: DRIFT },
    { at: T.tapi + 30, to: { x: SX, ry: 0, z: -420, rx: 0 }, feel: GLIDE },
    { at: DIVE + 4, to: { z: -1520 }, feel: { stiffness: 150, damping: 26, mass: 1 } },
  ]);

/* ---- black world camera: truck between machine/app, orbit around the panel */
const camB = (f: number) =>
  rig(f, { x: 0, y: 0, z: 700 }, [
    { at: BLACK - 10, to: { z: -80 }, feel: GLIDE },
    { at: T.perangkat - 12, to: { x: -150, ry: 7 }, feel: GLIDE },
    { at: T.server - 10, to: { x: 150, ry: -7 }, feel: WHIP },
    { at: T.untuk + 2, to: { x: 0, ry: -10, z: 80, rx: 6 }, feel: GLIDE },
    { at: T.panel - 10, to: { ry: 6, rx: 3, z: 20 }, feel: DRIFT },
    { at: T.ptero - 18, to: { z: 160, rx: 9, ry: 0 }, feel: GLIDE },
  ]);

export const S01: React.FC = () => {
  const f = useCurrentFrame();

  /* ---------------- white world ---------------- */
  const { v: cw, d: cwd } = vel((ff) => breathe(camW(ff), ff, 1.2), f);
  const pop = spr(f, T.pesan - 4, POP);
  const fly = (ff: number) => {
    const t = clamp01(spr(ff, T.pesan + 4, { stiffness: 70, damping: 15, mass: 1 }));
    const [x, y, z] = arc(t, [0, 60, 0], [SX * 0.4, -330, 360], [SX - 40, -10, 0]);
    return { x, y, z };
  };
  const { v: b, d: bd } = vel(fly, f);
  const hit = T.pesan + 50;
  const absorbed = out(f, hit - 4, 10);
  const serverIn = spr(f, T.pesan + 8, PANEL);
  const hitPulse = clamp01((f - hit) / 30);
  const reply = (ff: number) => {
    const t = clamp01(spr(ff, T.bot - 8, { stiffness: 80, damping: 15 }));
    const [x, y, z] = arc(t, [SX - 40, 10, 0], [SX * 0.5, 300, 260], [-150, 60, 0]);
    return { x, y, z };
  };
  const { v: r, d: rd } = vel(reply, f);
  const turn = spr(f, DIVE - 8, { stiffness: 120, damping: 18 }); // 0 → 1 = 180°
  const whiteGone = f >= BLACK;

  /* ---------------- black world ---------------- */
  const { v: cb, d: cbd } = vel((ff) => breathe(camB(ff), ff, 1, 2), f);
  const wave = clamp01((f - (BLACK - 6)) / 46);
  const appIn = spr(f, BLACK - 2, POP);
  const lapT = (ff: number) => {
    const q = spr(ff, T.perangkat - 14, PANEL) * (1 - out(ff, T.untuk - 4, 16));
    const [x, y, z] = arc(Math.min(1.05, q), [-1300, 260, -900], [-900, -260, -200], [-430, -20, 0]);
    return { x, y: y - out(ff, T.untuk - 4, 16) * 200, z: z - out(ff, T.untuk - 4, 16) * 900 };
  };
  const srvT = (ff: number) => {
    const q = spr(ff, T.server - 14, PANEL) * (1 - out(ff, T.untuk, 16));
    const [x, y, z] = arc(Math.min(1.05, q), [1300, -280, -900], [900, 280, -200], [430, -20, 0]);
    return { x, y: y + out(ff, T.untuk, 16) * 200, z: z - out(ff, T.untuk, 16) * 900 };
  };
  const { v: lap, d: lapd } = vel(lapT, f);
  const { v: srv, d: srvd } = vel(srvT, f);
  const lapO = clamp01(spr(f, T.perangkat - 14, SNAP) * 1.5) * (1 - out(f, T.untuk + 6, 10));
  const srvO = clamp01(spr(f, T.server - 14, SNAP) * 1.5) * (1 - out(f, T.untuk + 10, 10));
  const grow = spr(f, T.untuk + 4, PANEL); // app square -> management panel
  const pw = lerp(200, 940, grow), ph = lerp(200, 520, grow);
  const titleIn = spr(f, T.ptero - 10, GLIDE);
  const panelBack = spr(f, T.ptero - 16, GLIDE);
  // hand-off: the panel folds to an edge, the edge becomes S02's timeline line
  const fold = spr(f, T.end - 34, { stiffness: 200, damping: 26 });
  const band = clamp01(spr(f, T.end - 20, WHIP) * 1.04);
  const logoOut = out(f, T.end - 34, 14);

  const consoleLines = ["$ node index.js", "[bot] memuat konfigurasi", "[bot] terhubung ke layanan", "[bot] menunggu pesan", "[bot] pesan diterima, membalas"];

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {!whiteGone && (
        <AbsoluteFill>
          <DashedGrid f={f} ys={[540]} xs={[960]} color="rgba(10,10,12,0.1)" o={clamp01(f / 20) * (1 - out(f, T.pesan + 4, 12))} reveal={clamp01(spr(f, 0, GLIDE))} march={1.2} />
          {f < T.pesan + 4 && (
            <div style={{ position: "absolute", left: 960 - 46, top: 600, display: "flex", gap: 10, opacity: clamp01(f / 10) * (1 - out(f, T.pesan - 6, 8)) }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: C.telegram, opacity: 0.3 + 0.7 * Math.max(0, Math.sin(f * 0.2 - i * 0.9)), transform: `translateY(${-Math.max(0, Math.sin(f * 0.2 - i * 0.9)) * 8}px)` }} />)}
            </div>
          )}
          {/* foreground parallax specks (move faster than the world) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ position: "absolute", left: ((i * 433 - cw.x * 1.8) % 2200 + 2200) % 2200 - 140, top: 160 + i * 170, width: 14 + i * 3, height: 14 + i * 3, borderRadius: "50%",
              background: "rgba(10,10,12,0.08)", filter: "blur(3px)", opacity: clamp01((f - T.hanya) / 20) }} />
          ))}
          <Stage cam={cw} blur={[cwd.x * 0.9, cwd.y]}>
            <Flow f={f} d={`M -150 20 Q ${SX * 0.3} -300 ${SX - 40} -10`} color="rgba(10,10,12,0.28)" reveal={clamp01((f - T.pesan) / 30)} width={2} glowOn={false}
              pulses={f > T.layar ? 4 : 0} pulseSpeed={0.014} pulseColor={C.telegram} o={1 - out(f, DIVE - 10, 8)} />
            <Flow f={f} d={`M ${SX - 40} 10 Q ${SX * 0.5} 300 -150 60`} color="rgba(10,10,12,0.28)" reveal={clamp01((f - T.bot + 8) / 26)} width={2} glowOn={false}
              pulses={f > T.layar + 20 ? 4 : 0} pulseSpeed={0.014} pulseColor={C.ok} o={1 - out(f, DIVE - 10, 8)} />
            {/* "sekejap": a stopwatch sweep around the server */}
            <Obj x={SX} y={0} z={20} w={360} h={360} o={inOut(f, T.hanya - 8, T.layar - 10, SNAP, 10)}>
              <svg width={360} height={360} style={{ overflow: "visible" }}>
                <circle cx={180} cy={180} r={170} stroke="rgba(10,10,12,0.12)" strokeWidth={2} fill="none" />
                <circle cx={180} cy={180} r={170} stroke={C.orange} strokeWidth={4} fill="none" strokeLinecap="round" pathLength={1}
                  strokeDasharray={1} strokeDashoffset={1 - clamp01(spr(f, T.hanya - 4, { stiffness: 60, damping: 14 }))} transform="rotate(-90 180 180)" />
              </svg>
              <div style={{ position: "absolute", left: 178, top: 18, width: 4, height: 162, borderRadius: 2, background: C.ember, transformOrigin: "50% 100%",
                transform: `rotate(${clamp01(spr(f, T.hanya - 4, { stiffness: 60, damping: 14 })) * 360 + Math.max(0, f - T.hanya - 40) * 2.4}deg)` }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: -54, textAlign: "center", fontFamily: MONO, fontSize: 24, color: C.ember, fontWeight: 500 }}>
                {(clamp01(spr(f, T.hanya - 4, { stiffness: 60, damping: 14 })) * 0.32).toFixed(2).replace(".", ",")} dtk
              </div>
            </Obj>
            {/* "di layar": a phone with a real (simulated) chat that keeps receiving messages */}
            <Obj x={-150} y={20} z={12} w={380} h={660} ry={10} o={inOut(f, T.layar - 6, DIVE - 20, PANEL, 12)} s={lerp(0.8, 1, clamp01(spr(f, T.layar - 6, PANEL)))}>
              <PhoneChat f={f} start={T.layar - 6} />
            </Obj>
            {/* server card with a dark back side ("di baliknya") */}
            <Obj x={SX} y={0} w={300} h={260} ry={turn * 180} s={lerp(0.6, 1, serverIn)} o={clamp01(serverIn * 2)} style={{ transformStyle: "preserve-3d" }}>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
                <Card w={300} h={260} tone="light" radius={26} shadowA={1.3}>
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * Math.exp(-hitPulse * 4) * (f > hit ? 1 : 0)})` }}>
                    <ServerIllo d={clamp01((f - T.pesan - 4) / 30)} f={f} color={C.ink} size={200} load={f > hit && f < hit + 40 ? 1.2 : 0.4} />
                  </div>
                  {f > hit && <div style={{ position: "absolute", left: 150 - 160 * hitPulse, top: 130 - 160 * hitPulse, width: 320 * hitPulse, height: 320 * hitPulse, borderRadius: "50%",
                    border: `2px solid ${C.telegram}`, opacity: 1 - hitPulse }} />}
                </Card>
              </div>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 26,
                background: "radial-gradient(circle at 50% 50%, #ff8a5c 0px, #ff4d12 6px, #2a1209 40px, #050505 120px)", boxShadow: glow(0.6) }} />
            </Obj>
            {/* message bubble: pops where the words were, flies a curved path past the lens */}
            <Obj x={b.x} y={b.y - 34} z={b.z} w={320} h={60} s={lerp(0.2, 1, pop) * (1 - absorbed * 0.7)} o={clamp01(pop * 3) * (1 - absorbed)}>
              <MBlur dx={bd.x - cwd.x} dy={bd.y}><Bubble text="Halo, ada jadwal hari ini?" side="user" /></MBlur>
            </Obj>
            <Obj x={r.x} y={r.y - 40} z={r.z} w={330} h={60} s={lerp(0.3, 1, clamp01(spr(f, T.bot - 8, POP)))} o={clamp01((f - T.bot + 8) / 6) * (1 - clamp01((f - T.layar + 6) / 10))}>
              <MBlur dx={rd.x - cwd.x} dy={rd.y}><Bubble text="Ada. Rapat pukul 10.00" side="bot" w={330} /></MBlur>
            </Obj>
          </Stage>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: `translateY(${-130 - clamp01(spr(f, T.pesan + 4, GLIDE)) * 60}px) scale(${1 - out(f, T.hanya - 12, 10) * 0.6})`, opacity: 1 - out(f, T.hanya - 12, 10) }}>
              <SwapText f={f} items={[{ at: T.pesan - 4, text: "Pesan masuk." }, { at: T.bot - 8, text: "Bot membalas." }]} size={42} />
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ alignItems: "center" }}>
            <div style={{ position: "absolute", top: 150, opacity: 1 - out(f, T.tapi - 14, 12) }}>
              <SwapText f={f} items={[{ at: T.hanya, text: "Sekejap." }, { at: T.layar + 30, text: "Terlihat sederhana." }]} size={32} weight={500} color={C.gray} />
            </div>
            <div style={{ position: "absolute", top: 820 }}>
              <Words f={f} text="Apa yang bekerja di baliknya?" at={T.tapi} times={[T.tapi + 44, T.tapi + 52, T.bekerja, T.balik - 14, T.balik]} size={42} accent={[4]} out={DIVE + 8} outLen={10} />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ---------------- black world (revealed by diving through the server's back) ---------------- */}
      {f >= BLACK - 1 && (
        <AbsoluteFill style={{ background: C.black }}>
          <LightStreak f={f} o={0.25 + 0.25 * grow} angle={-26} seed={3} />
          <WarmLight f={f} o={0.3 + grow * 0.4} y={620} r={1000} />
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${-cb.x * 0.35}px)` }}>
            <GlowWave f={f} y={600 + panelBack * 20} amp={lerp(80, 40, grow)} reveal={wave} o={1 - titleIn * 0.3} speed={0.035} />
          </div>
          <Stage cam={cb} blur={[cbd.x, cbd.y]}>
            {/* links app <-> machines with travelling pulses */}
            <Flow f={f} d={`M -100 -30 L ${lap.x + 120} ${lap.y}`} reveal={clamp01((f - T.perangkat) / 18) * lapO} color={C.coral} pulses={2} width={2.5} />
            <Flow f={f} d={`M 100 -30 L ${srv.x - 120} ${srv.y}`} reveal={clamp01((f - T.server) / 18) * srvO} color={C.coral} pulses={2} width={2.5} />
            <Obj x={lap.x} y={lap.y} z={lap.z} ry={22} w={240} h={220} o={lapO}>
              <MBlur dx={lapd.x - cbd.x} dy={lapd.y}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <Icon name="Laptop" size={150} color="#fff" stroke={1.3} draw={clamp01((f - T.perangkat + 6) / 26)} />
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 22, fontWeight: 500 }}>Perangkat</div>
                </div>
              </MBlur>
            </Obj>
            <Obj x={srv.x} y={srv.y} z={srv.z} ry={-22} w={240} h={260} o={srvO}>
              <MBlur dx={srvd.x - cbd.x} dy={srvd.y}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <ServerIllo d={clamp01((f - T.server + 6) / 26)} f={f} size={170} color="#fff" />
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 22, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                    Server <StatusPill state="running" f={f} size={14} label="aktif" />
                  </div>
                </div>
              </MBlur>
            </Obj>
            {/* the app object morphs into the management panel */}
            <Obj x={0} y={lerp(-30, 10, grow) + panelBack * 110} z={-panelBack * 280} rx={panelBack * 14 + fold * 90} w={pw} h={ph}
              s={lerp(0.05, 1, Math.min(1, appIn)) * (1 + fold * 0.0)} o={1 - out(f, T.end - 8, 8)}>
              <div style={{ width: pw, height: ph, borderRadius: lerp(40, 24, grow), border: `2px solid ${grow > 0.5 ? "rgba(255,255,255,0.08)" : C.orange}`,
                background: grow > 0.02 ? `linear-gradient(160deg, ${C.panel2}, ${C.panel})` : "rgba(255,106,43,0.12)", boxShadow: glow(0.8 - titleIn * 0.2), position: "relative", overflow: "hidden",
                transform: `scaleX(${1 + fold * 1.1})` }}>
                {/* bot icon follows through to the header avatar */}
                <div style={{ position: "absolute", left: lerp(pw / 2 - 48, 26, grow), top: lerp(ph / 2 - 48, 24, grow), transform: `scale(${lerp(1, 0.38, grow)})`, transformOrigin: "0 0" }}>
                  <Icon name="Bot" size={96} color="#fff" stroke={1.5} draw={clamp01((f - BLACK) / 24)} />
                </div>
                {f < T.untuk + 4 && (
                  <svg width={200} height={200} style={{ position: "absolute", inset: 0, transform: `rotate(${f * 3}deg)` }}>
                    <circle cx={100} cy={100} r={92} stroke={C.coral} strokeWidth={2} fill="none" strokeDasharray="40 540" strokeLinecap="round" opacity={clamp01((f - T.aplikasi) / 10)} />
                  </svg>
                )}
                {grow > 0.3 && (
                  <div style={{ position: "absolute", left: 28, right: 28, top: 22, bottom: 22, display: "flex", flexDirection: "column", gap: 20, opacity: clamp01((grow - 0.3) * 2) * (1 - titleIn * 0.5) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 52, height: 40 }}>
                      <div style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>asisten-bot</div>
                      <StatusPill state={f < T.untuk + 50 ? "starting" : "running"} f={f} size={15} />
                      <div style={{ flex: 1 }} />
                      <div style={{ opacity: clamp01(spr(f, T.untuk + 24, SNAP)), transform: `translateY(${(1 - clamp01(spr(f, T.untuk + 24, SNAP))) * -14}px)` }}><PowerButtons scale={0.85} active={f > T.untuk + 40 && f < T.untuk + 56 ? "start" : null} press={clamp01((f - T.untuk - 40) / 16)} /></div>
                    </div>
                    <div style={{ display: "flex", gap: 18 }}>
                      <div style={{ flex: 2, height: 360, borderRadius: 12, background: "#0f1114", padding: 18, fontFamily: MONO, fontSize: 16, color: "#9aa3ad", lineHeight: "30px" }}>
                        {consoleLines.map((l, i) => {
                          const at = T.untuk + 30 + i * 9;
                          const q = clamp01(spr(f, at, SNAP));
                          const chars = Math.floor(clamp01((f - at) / 12) * l.length);
                          return <div key={i} style={{ opacity: q, transform: `translateX(${(1 - q) * 18}px)`, color: i === 4 ? C.ok : undefined, whiteSpace: "pre" }}>{l.slice(0, chars)}</div>;
                        })}
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                        {(["Cpu", "MemoryStick", "HardDrive"] as const).map((n, i) => {
                          const q = clamp01(spr(f, T.untuk + 26 + i * 5, PANEL));
                          return (
                            <div key={n} style={{ height: 108, borderRadius: 12, background: "#23272e", display: "flex", alignItems: "center", gap: 14, padding: "0 18px", transform: `translateY(${(1 - q) * 30}px)`, opacity: q }}>
                              <Icon name={n} size={28} color={C.coral} draw={q} />
                              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                                <div style={{ width: `${q * (22 + 15 * i + 8 * Math.sin(f * 0.05 + i)) }%`, height: 8, borderRadius: 4, background: C.coral }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Obj>
          </Stage>
          <DashedGrid f={f} xs={[470, 1450]} ys={[270, 810]} o={inOut(f, T.panel - 26, T.ptero - 20, SNAP, 10) * 0.55} reveal={clamp01((f - T.panel + 26) / 22)} march={0.8} />

          <AbsoluteFill style={{ alignItems: "center" }}>
            <div style={{ position: "absolute", top: 860 }}>
              <Words f={f} text="Aplikasi yang terus berjalan" at={T.aplikasi} times={[T.aplikasi - 4, T.aplikasi + 6, T.berjalan - 16, T.berjalan]} size={34} color="#fff" accent={[3]} out={T.untuk - 6} outLen={10} />
            </div>
            <div style={{ position: "absolute", top: 140 }}>
              <SwapText f={f} items={[{ at: T.mengawasi - 6, text: "mengawasi aplikasi" }, { at: T.panel - 8, text: "dengan sebuah panel", color: C.coral }]} size={30} weight={500} color="rgba(255,255,255,0.8)"
                style={{ opacity: 1 - out(f, T.salah - 10, 12) }} />
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ opacity: clamp01(titleIn * 1.4) * (1 - logoOut), transform: `translateY(${(1 - titleIn) * 40 - logoOut * 160}px) scale(${lerp(0.9, 1, titleIn)})`,
              filter: titleIn < 0.97 || logoOut > 0 ? `blur(${(1 - titleIn) * 10 + logoOut * 12}px)` : undefined, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <PteroLogo height={88} reveal={clamp01((f - T.ptero + 4) / 34)} />
              <div style={{ color: "#fff", fontSize: 30, fontWeight: 500, letterSpacing: `${lerp(0.9, 0.32, clamp01(spr(f, T.panelName - 4, GLIDE)))}em`, textTransform: "uppercase", opacity: clamp01((f - T.panelName + 4) / 12) }}>Panel</div>
            </div>
          </AbsoluteFill>
          {/* white floods from the folded edge */}
          {band > 0 && (
            <AbsoluteFill>
              <div style={{ position: "absolute", left: 0, right: 0, top: 540 - band * 540, height: band * 1080, background: C.white }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 539, height: 2, background: C.orange, boxShadow: "0 0 12px rgba(255,106,43,0.6)" }} />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const sfx01 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + T.pesan - 4, "text_in", 0.3), s(o + T.bot - 8, "scramble", 0.35),
    s(o + T.hanya - 10, "msg_out", 0.5), s(o + T.hanya + 2, "whip_fast", 0.4), s(o + T.hanya + 6, "settle_light", 0.25, 1.2),
    s(o + T.hanya + 44, "impact_soft", 0.45), s(o + T.layar - 14, "msg_in", 0.45), s(o + T.layar - 8, "whip_air", 0.35),
    s(o + T.layar + 50, "scramble", 0.22, 0.9), s(o + T.tapi + 30, "rise_short", 0.3), s(o + DIVE - 8, "flip", 0.45),
    s(o + DIVE + 4, "lens_pass", 0.5), s(o + BLACK - 4, "line_draw", 0.35, 0.8), s(o + BLACK, "impact_glass", 0.35),
    s(o + T.perangkat - 14, "whip_low", 0.35), s(o + T.perangkat + 6, "impact_card", 0.35), s(o + T.server - 14, "whip_low", 0.35, 1.15), s(o + T.server + 6, "impact_card", 0.35, 1.1),
    s(o + T.untuk - 4, "whip_air", 0.3, 0.9), s(o + T.untuk + 4, "morph_up", 0.4), s(o + T.untuk + 20, "impact_soft", 0.35, 1.2), s(o + T.untuk + 30, "stack_ticks", 0.3),
    s(o + T.untuk + 40, "click_low", 0.35), s(o + T.mengawasi - 6, "scramble", 0.2), s(o + T.panel - 8, "scramble", 0.2, 1.1), s(o + T.panel - 26, "line_draw", 0.25, 1.2),
    s(o + T.ptero - 12, "swell_bright", 0.35), s(o + T.end - 34, "flip", 0.35, 0.85), s(o + T.end - 20, "whip_low", 0.4, 0.8),
  ];
};

void drift;
