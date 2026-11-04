import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { drift } from "../lib/anim";
import { arc, breathe, clamp01, GLIDE, lerp, out, rig, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, Obj, Stage, WarmLight, GlowWave, LightStreak } from "../components/Primitives";
import { MBlur, SwapText } from "../components/Motion";
import { ContainerIllo, ServerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo, PteroLogo } from "../components/Logos";
import { ChatWindow, ConsoleView, Graph, Line, Msg, PowerButtons, StatusPill, series } from "../components/UI";

const L = makeLocal("s10");
const T = {
  jadi: L.c("Jadi"), ptero: L.c("Pterodactyl"), berawal: L.c("berawal"), game: L.c("server game"), dengan: L.c("Dengan lingkungan"), tg: L.c("Telegram"), wa: L.c("WhatsApp"),
  pm: L.c("Panel mengelola"), st: L.c("server menyediakan"), tenaga: L.c("tenaga"), bl: L.c("bot menjalankan"), logika: L.c("logikanya"), kini: L.c("Kini"),
  membalas: L.c("membalas"), tahu: L.c("kamu tahu"), balik: L.c("baliknya"), kenali: L.c("Kenali"), botmu: L.c("botmu"), speechEnd: L.end, end: L.dur,
};
const SCATTER = T.kenali + 6;

const logs: Line[] = Array.from({ length: 40 }).map((_, i) => ({
  t: i * 40, text: ["[info] pesan masuk", "[ok]   balasan terkirim", "[info] notifikasi dikirim", "[info] menunggu pesan"][i % 4], kind: (["in", "ok", "info", "dim"] as const)[i % 4],
}));
const tgMsgs: Msg[] = [{ t: 0, from: "user", text: "/jadwal" }, { t: 20, from: "bot", text: "Agenda hari ini siap." }, { t: T.kini + 20, from: "user", text: "Terima kasih!" }, { t: T.kini + 90, from: "bot", text: "Sama-sama." }];
const waMsgs: Msg[] = [{ t: 0, from: "user", text: "Jam layanan?" }, { t: 30, from: "bot", text: "08.00–16.00 (contoh)" }];
const cpu = series(21, 10, 6, [[40, 12, 4], [140, 16, 5]]);

type Piece = { k: string; x: number; y: number; z: number; ry: number; w: number; h: number; t: number };
const pieces: Piece[] = [
  { k: "panel", x: 0, y: -30, z: 0, ry: 0, w: 660, h: 380, t: 14 },
  { k: "server", x: -610, y: -210, z: -220, ry: 18, w: 330, h: 270, t: T.ptero - 12 },
  { k: "container", x: -570, y: 190, z: -120, ry: 16, w: 320, h: 250, t: T.berawal - 4 },
  { k: "console", x: 610, y: -220, z: -180, ry: -18, w: 440, h: 250, t: T.game - 12 },
  { k: "graph", x: 630, y: 170, z: -100, ry: -16, w: 430, h: 220, t: T.game + 6 },
  { k: "tg", x: -250, y: 340, z: 140, ry: 8, w: 340, h: 250, t: T.tg - 16 },
  { k: "wa", x: 260, y: 350, z: 160, ry: -8, w: 340, h: 250, t: T.wa - 16 },
];
const P = Object.fromEntries(pieces.map((p) => [p.k, p])) as Record<string, Piece>;

const cam = (f: number) =>
  rig(f, { x: 0, y: 0, z: -300 }, [
    { at: 0, to: { z: -120, ry: -8, rx: 6 }, feel: GLIDE },
    { at: T.tg - 20, to: { x: -60, y: 120, z: -80, ry: -4 }, feel: GLIDE },
    { at: T.pm - 10, to: { x: 0, y: -30, z: -340, ry: 2 }, feel: WHIP },
    { at: T.st - 10, to: { x: P.server.x * 0.7, y: P.server.y * 0.7, z: -300, ry: 10 }, feel: WHIP },
    { at: T.bl - 10, to: { x: P.container.x * 0.6, y: 220, z: -280, ry: 6 }, feel: WHIP },
    { at: T.kini - 14, to: { x: 0, y: 40, z: 120, ry: -6, rx: 7 }, feel: GLIDE },
    { at: SCATTER, to: { z: 520, ry: 0, rx: 4, y: 0, x: 0 }, feel: { stiffness: 70, damping: 20 } },
  ]);

/* the last message visits the system: chat -> server -> container -> chat */
const msgPath = (f: number) => {
  const pts = [[P.tg.x, P.tg.y - 60], [P.server.x, P.server.y], [P.container.x, P.container.y], [P.panel.x - 200, P.panel.y + 120], [P.tg.x + 60, P.tg.y - 40]];
  const t = clamp01((f - T.kini) / 150) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(t));
  const u = t - i;
  const e = u * u * (3 - 2 * u);
  const [x, y] = arc(e, [pts[i][0], pts[i][1], 0], [(pts[i][0] + pts[i + 1][0]) / 2, Math.min(pts[i][1], pts[i + 1][1]) - 140, 200], [pts[i + 1][0], pts[i + 1][1], 0]);
  return { x, y };
};

export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 1, 11), f);
  const titleIn = clamp01(spr(f, T.speechEnd + 6, GLIDE));
  const fadeOut = clamp01((f - (T.end - 46)) / 44);
  const hi = (k: string) => {
    const win = (a: number, b: number) => clamp01(spr(f, a - 10, WHIP)) * (1 - clamp01(spr(f, b - 6, WHIP)));
    return k === "panel" ? win(T.pm, T.st) : k === "server" ? win(T.st, T.bl) : k === "container" || k === "tg" ? win(T.bl, T.kini) : 0;
  };
  const { v: m, d: md } = vel(msgPath, f);
  const msgO = f > T.kini && f < T.kini + 152 ? 1 : 0;

  const render = (pc: Piece) => {
    switch (pc.k) {
      case "panel":
        return (
          <Card w={pc.w} h={pc.h} tone="dark" radius={22} glowA={0.7 + hi("panel") * 0.6}>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}><PteroLogo height={28} /><div style={{ flex: 1 }} /><StatusPill state="running" f={f} size={14} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 20, fontWeight: 600 }}>
                <BrandLogo brand="telegram" size={26} /> asisten-bot <div style={{ flex: 1 }} /><PowerButtons scale={0.72} />
              </div>
              <ConsoleView f={f + 400} lines={logs} w={616} h={220} size={15} />
            </div>
          </Card>
        );
      case "server":
        return (<Card w={pc.w} h={pc.h} tone="dark" radius={22} glowA={0.35 + hi("server") * 0.7}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#fff" }}>
            <ServerIllo d={1} f={f} size={150} load={0.5 + hi("server")} /><div style={{ fontSize: 21, fontWeight: 600 }}>Server</div>
          </div></Card>);
      case "container":
        return (<Card w={pc.w} h={pc.h} tone="dark" radius={22} glowA={0.35 + hi("container") * 0.7}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#fff" }}>
            <ContainerIllo d={1} size={140} open={0.25 + 0.4 * hi("container")} /><div style={{ fontSize: 21, fontWeight: 600 }}>Container</div>
          </div></Card>);
      case "console":
        return (<Card w={pc.w} h={pc.h} tone="ink" radius={22} glowA={0.35}>
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", fontSize: 17, fontWeight: 600, marginBottom: 10 }}><Icon name="Terminal" size={20} color={C.coral} /> Console</div>
            <ConsoleView f={f + 200} lines={logs} w={408} h={176} size={15} />
          </div></Card>);
      case "graph":
        return <div style={{ boxShadow: glow(0.35), borderRadius: 12 }}><Graph f={f} w={pc.w} h={pc.h} fn={cpu} color={C.coral} label="CPU" icon="Cpu" unit={(v) => `${v.toFixed(1)}%`} /></div>;
      case "tg":
        return <div style={{ boxShadow: glow(0.3 + hi("tg") * 0.6), borderRadius: 26 }}><ChatWindow f={f} platform="telegram" title="Asisten Bot" msgs={tgMsgs} w={pc.w} h={pc.h} dark /></div>;
      case "wa":
        return <div style={{ boxShadow: glow(0.3), borderRadius: 26 }}><ChatWindow f={f} platform="whatsapp" title="Info Layanan" msgs={waMsgs} w={pc.w} h={pc.h} dark /></div>;
    }
    return null;
  };

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
        <LightStreak f={f} o={0.5 * (1 - titleIn * 0.5)} angle={-26} seed={12} />
        <WarmLight f={f} o={0.55} y={560} r={1100} seed={13} />
        <GlowWave f={f} y={560} amp={lerp(10, 46, clamp01((f - T.kenali) / 200))} o={titleIn * 0.8} reveal={titleIn} speed={0.03} />
        <Stage cam={c} blur={[cd.x, cd.y]}>
          {pieces.map((pc, i) => {
            const fn = (ff: number) => {
              const q = clamp01(spr(ff, pc.t - 10, { stiffness: 110, damping: 17 }));
              // continuous reshuffle: ellipse drift + depth swapping, the whole cluster slides diagonally
              const ph = ff * 0.012 + i * 0.9;
              const rx = pc.x + Math.cos(ph) * 26 + ff * 0.05, ry = pc.y + Math.sin(ph) * 18 - ff * 0.03, rz = pc.z + Math.sin(ph * 0.8 + i) * 90;
              const [x, y, z] = arc(q, [pc.x - 900, pc.y + 900, pc.z - 500], [pc.x - 500, pc.y + 200, pc.z + 200], [rx, ry, rz]);
              // scatter past the camera before the title
              const sc = out(ff, SCATTER + (i % 3) * 3, 26);
              const dir = Math.atan2(pc.y + 1, pc.x + 1);
              return { x: x + Math.cos(dir) * sc * 1500, y: y + Math.sin(dir) * sc * 1000, z: z + sc * (i % 2 ? 1300 : -1400) };
            };
            const { v, d } = vel(fn, f);
            const q = clamp01(spr(f, pc.t - 10, { stiffness: 160, damping: 18 }));
            return (
              <Obj key={pc.k} x={v.x} y={v.y} z={v.z} ry={pc.ry * q + drift(f, i, 0.01) * 4} w={pc.w} h={pc.h} o={clamp01(q * 3) * (1 - out(f, SCATTER + 20, 14))} s={1 + hi(pc.k) * 0.06}>
                <MBlur dx={d.x - cd.x} dy={d.y - cd.y}>{render(pc)}</MBlur>
              </Obj>
            );
          })}
          <Obj x={m.x} y={m.y} z={260} w={70} h={52} o={msgO}>
            <MBlur dx={md.x - cd.x} dy={md.y}>
              <div style={{ width: 70, height: 52, borderRadius: 18, borderBottomLeftRadius: 5, background: C.telegram, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(38,165,228,0.8)" }}>
                <Icon name="MessageCircle" size={28} color="#fff" />
              </div>
            </MBlur>
          </Obj>
        </Stage>

        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 70 }}>
            <SwapText f={f} items={[
              { at: T.berawal - 6, text: "Berawal dari pengelolaan server game.", color: "#fff" },
              { at: T.tg - 10, text: "Kini juga untuk bot Telegram & WhatsApp.", color: "#fff" },
              { at: T.pm - 6, text: "Panel mengelola.", color: "#fff" },
              { at: T.st - 6, text: "Server menyediakan tenaga.", color: "#fff" },
              { at: T.bl - 6, text: "Bot menjalankan logika.", color: "#fff" },
              { at: T.kini - 6, text: "Setiap kali bot membalas…", color: "#fff" },
              { at: T.tahu - 6, text: "…kamu tahu apa yang bekerja.", color: "#fff" },
            ]} size={36} style={{ opacity: 1 - out(f, T.kenali - 10, 10) }} />
          </div>
        </AbsoluteFill>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, opacity: titleIn, filter: titleIn < 0.97 ? `blur(${(1 - titleIn) * 10}px)` : undefined,
            transform: `translateY(${-30 + (1 - titleIn) * 30}px) scale(${lerp(0.94, 1, titleIn) + clamp01((f - T.speechEnd) / 260) * 0.025})` }}>
            <PteroLogo height={84} reveal={clamp01((f - T.speechEnd - 6) / 40)} />
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 500, letterSpacing: `${lerp(0.8, 0.32, titleIn)}em`, textTransform: "uppercase" }}>Panel</div>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 690 }}>
            <SwapText f={f} items={[{ at: T.kenali - 4, text: "Kenali proses di balik botmu.", color: "#fff" }]} size={42} />
          </div>
          <div style={{ position: "absolute", bottom: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: clamp01((f - T.speechEnd - 40) / 20) }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 20, fontWeight: 500, letterSpacing: "0.04em" }}>Visual explainer by FELIXIORITY</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: MONO }}>Tidak berafiliasi dengan Pterodactyl, Telegram, maupun WhatsApp. Data di layar adalah simulasi.</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx10 = (): SfxCue[] => {
  const o = L.from;
  const cards = pieces.slice(1).map((p, i) => [s(o + p.t - 10, "whip_air", 0.22, 0.9 + i * 0.08), s(o + p.t + 8, "impact_card", 0.25, 0.9 + i * 0.07)]).flat();
  return [
    s(o + 4, "impact_soft", 0.3), ...cards, s(o + T.berawal - 6, "scramble", 0.2), s(o + T.tg - 10, "scramble", 0.2, 1.1),
    s(o + T.pm - 10, "whip_fast", 0.3), s(o + T.st - 10, "whip_fast", 0.3, 0.9), s(o + T.bl - 10, "whip_fast", 0.3, 1.1),
    s(o + T.kini, "msg_out", 0.32), s(o + T.kini + 38, "data_tick", 0.22), s(o + T.kini + 75, "data_tick", 0.22, 1.1), s(o + T.kini + 112, "data_tick", 0.22, 1.2), s(o + T.kini + 150, "msg_in", 0.32),
    s(o + SCATTER, "lens_pass", 0.4, 0.85), s(o + SCATTER + 4, "whip_low", 0.3, 0.8), s(o + T.speechEnd + 6, "swell_bright", 0.3, 0.75),
    s(18000 - 230, "resolve", 0.33),
  ];
};
