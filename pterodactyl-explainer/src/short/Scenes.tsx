import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow, softShadow } from "../lib/theme";
import { arc, breathe, clamp01, DRIFT, GLIDE, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { s, SfxCue } from "../lib/sfx";
import { Card, Flow, GlowWave, Label, LightStreak, Obj, Stage, WarmLight, DashedGrid } from "../components/Primitives";
import { MBlur, Sweep, SwapText } from "../components/Motion";
import { ContainerIllo, ServerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo, PteroLogo, PteroMark } from "../components/Logos";
import { Browser, CodeCard, ConsoleView, FileManager, Graph, Line, PowerButtons, PowerState, StatusPill, series } from "../components/UI";
import { PhoneChat } from "../scenes/S01";
import { localP } from "./time";

/* Vertical 1080x1920. Stage origin = screen centre (540, 960).
 * TikTok safe area: keep key content between screen y 230 and 1380, x < 950. */
const HEAD_Y = 230; // headline baseline area (screen px)

const Headline: React.FC<{ f: number; items: { at: number; text: string; color?: string }[]; dark?: boolean; size?: number; hide?: number }> = ({ f, items, dark, size = 64, hide }) => (
  <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
    {dark && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 470, background: "linear-gradient(180deg, rgba(3,3,3,0.92) 0%, rgba(3,3,3,0.7) 55%, rgba(3,3,3,0) 100%)" }} />}
    <div style={{ position: "absolute", top: HEAD_Y, width: 960, display: "flex", justifyContent: "center", opacity: hide === undefined ? 1 : 1 - out(f, hide, 10) }}>
      <SwapText f={f} items={items} size={size} color={dark ? "#fff" : C.ink} style={{ whiteSpace: "normal", textAlign: "center", lineHeight: 1.1 }} />
    </div>
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ P1 hook */
const L1 = localP("p1");
const T1 = { pesan: L1.c("Pesan"), bot: L1.c("Bot"), tapi: L1.c("Tapi"), balik: L1.c("baliknya"), banyak: L1.c("Banyak"), ptero: L1.c("Pterodactyl"), end: L1.dur };
const DIVE1 = T1.balik - 6;
export const SP1: React.FC = () => {
  const f = useCurrentFrame();
  const camW = (ff: number) => breathe(rig(ff, { z: -100 }, [{ at: T1.tapi + 10, to: { z: -260, y: 60 }, feel: GLIDE }, { at: DIVE1 + 6, to: { z: -1500 }, feel: { stiffness: 150, damping: 26 } }]), ff, 0.8);
  const { v: cw, d: cwd } = vel(camW, f);
  const turn = spr(f, DIVE1 - 6, { stiffness: 120, damping: 18 });
  const black = f >= DIVE1 + 30;
  const phoneIn = spr(f, 0, PANEL);
  const title = spr(f, T1.ptero - 8, GLIDE);
  const camB = (ff: number) => breathe(rig(ff, { z: 600 }, [{ at: DIVE1 + 20, to: { z: 0 }, feel: GLIDE }]), ff, 0.8, 3);
  const { v: cb } = vel(camB, f);
  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {!black && (
        <AbsoluteFill>
          <DashedGrid f={f} xs={[540]} ys={[960]} color="rgba(10,10,12,0.08)" march={1.2} />
          <Stage cam={cw} blur={[cwd.x, cwd.y]}>
            <Obj x={0} y={lerp(700, -40, phoneIn)} w={380} h={660} s={1.3} ry={turn * 180 + lerp(-25, -6, phoneIn)} style={{ transformStyle: "preserve-3d" }}>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}><PhoneChat f={f + 40} start={T1.pesan - 10} /></div>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 56,
                background: "radial-gradient(circle at 50% 50%, #ff8a5c 0px, #ff4d12 8px, #2a1209 60px, #050505 200px)", boxShadow: glow(0.6) }} />
            </Obj>
          </Stage>
          <Headline f={f} items={[{ at: T1.pesan - 4, text: "Pesan masuk." }, { at: T1.bot - 6, text: "Bot membalas." }, { at: T1.tapi - 4, text: "Apa yang bekerja di baliknya?" }]} hide={DIVE1} />
        </AbsoluteFill>
      )}
      {f >= DIVE1 + 29 && (
        <AbsoluteFill style={{ background: C.black }}>
          <LightStreak f={f} o={0.4} angle={-30} seed={3} />
          <WarmLight f={f} x={540} y={960} r={900} o={0.6} />
          <GlowWave f={f} y={1180} amp={60} reveal={clamp01((f - DIVE1 - 30) / 30)} speed={0.04} wl={420} />
          <Stage cam={cb}>
            <Obj x={0} y={-80} w={560} h={360} rx={lerp(30, 8, clamp01(spr(f, DIVE1 + 30, PANEL)))} s={lerp(0.2, 1, clamp01(spr(f, DIVE1 + 30, PANEL)))} z={-title * 200}>
              <Card w={560} h={360} tone="dark" glowA={0.9 - title * 0.3} radius={24}>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, opacity: 1 - title * 0.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><BrandLogo brand="telegram" size={30} /><div style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>asisten-bot</div><div style={{ flex: 1 }} /><StatusPill state="running" f={f} size={14} /></div>
                  <ConsoleView f={f} lines={[{ t: DIVE1 + 40, text: "[bot] memuat konfigurasi", kind: "dim" }, { t: DIVE1 + 52, text: "[bot] terhubung ke layanan", kind: "ok" }, { t: DIVE1 + 64, text: "[bot] pesan diterima, membalas", kind: "in" }]} w={512} h={250} size={18} />
                </div>
              </Card>
            </Obj>
          </Stage>
          <Headline f={f} dark items={[{ at: T1.banyak - 4, text: "Satu alat yang sama:" }]} size={52} hide={T1.ptero - 10} />
          <AbsoluteFill style={{ alignItems: "center" }}>
            <div style={{ position: "absolute", top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, opacity: clamp01(title * 1.4), transform: `translateY(${(1 - title) * 40}px)`, filter: title < 0.97 ? `blur(${(1 - title) * 10}px)` : undefined }}>
              <PteroLogo height={96} reveal={clamp01((f - T1.ptero + 4) / 30)} />
              <div style={{ color: "#fff", fontSize: 40, fontWeight: 500, letterSpacing: `${lerp(0.8, 0.32, title)}em` }}>PANEL</div>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
export const sfxP1 = (): SfxCue[] => {
  const o = L1.from;
  return [s(o + 2, "panel_lift", 0.35), s(o + T1.pesan - 4, "msg_in", 0.4), s(o + T1.bot - 6, "scramble", 0.3), s(o + T1.bot, "msg_out", 0.35),
    s(o + T1.tapi - 4, "scramble", 0.25, 0.9), s(o + DIVE1 - 6, "flip", 0.45), s(o + DIVE1 + 6, "lens_pass", 0.5), s(o + DIVE1 + 30, "impact_soft", 0.4), s(o + DIVE1 + 40, "stack_ticks", 0.25),
    s(o + T1.ptero - 8, "swell_bright", 0.4)];
};

/* ------------------------------------------------------------------ P2 origin */
const L2 = localP("p2");
const T2 = { ptero: L2.c("Pterodactyl"), gratis: L2.c("gratis"), open: L2.c("open source"), sejak: L2.c("sejak"), dua: L2.c("dua ribu"), awal: L2.c("Awalnya"), game: L2.c("server game", 0), browser: L2.c("browser"), end: L2.dur };
const Roll: React.FC<{ f: number; at: number; value: string; size: number }> = ({ f, at, value, size }) => (
  <div style={{ display: "flex", fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: "-0.05em", color: "#fff", height: size * 1.05, overflow: "hidden" }}>
    {value.split("").map((d, i) => {
      const q = clamp01(spr(f, at + i * 4, { stiffness: 120, damping: 17 }));
      const pos = lerp(Number(d) + 10, Number(d) + 20, q);
      return (
        <div key={i} style={{ height: size * 1.05, overflow: "hidden" }}>
          <div style={{ transform: `translateY(${-pos * size * 1.05}px)`, filter: q < 0.97 ? `blur(${(1 - q) * 6}px)` : undefined }}>
            {Array.from({ length: 31 }).map((_, k) => <div key={k} style={{ height: size * 1.05, lineHeight: `${size * 1.05}px` }}>{k % 10}</div>)}
          </div>
        </div>
      );
    })}
  </div>
);
export const SP2: React.FC = () => {
  const f = useCurrentFrame();
  const cam = (ff: number) => breathe(rig(ff, { y: -200, z: 0 }, [{ at: T2.sejak - 10, to: { y: 0, z: -80 }, feel: WHIP }, { at: T2.awal - 10, to: { y: 300, z: -60 }, feel: WHIP }, { at: T2.end - 22, to: { y: 330, z: -1300 }, feel: { stiffness: 160, damping: 24 } }]), ff, 1, 2);
  const { v: c, d: cd } = vel(cam, f);
  const rows: [string, string, number, string][] = [["Power", "Nyalakan", T2.awal + 20, C.ok], ["Square", "Matikan", T2.awal + 36, C.err], ["Activity", "Pantau", T2.awal + 52, C.orange]];
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.4} angle={-30} seed={3} />
      <WarmLight f={f} x={540} y={960} r={900} o={0.6} />
      <Stage cam={c} blur={[cd.x, cd.y]}>
        <Obj x={0} y={-240} w={900} h={120} o={1 - out(f, T2.sejak + 30, 12)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <PteroMark size={70} draw={clamp01((f + 10) / 24)} />
            <div style={{ color: "#fff", fontSize: 64, fontWeight: 700 }}>Pterodactyl</div>
          </div>
        </Obj>
        {([["Gratis", T2.gratis, -170], ["Open source", T2.open, 150]] as const).map(([t, at, x]) => {
          const q = clamp01(spr(f, at - 8, { stiffness: 170, damping: 15 }));
          const [px, py, pz] = arc(q, [x, 200, 300], [x * 1.4, -40, 200], [x, -110, 0]);
          return (
            <Obj key={t} x={px} y={py} z={pz} w={360} h={80} o={clamp01(q * 3) * (1 - out(f, T2.sejak + 30, 12))}>
              <div style={{ display: "flex", justifyContent: "center" }}><Label size={36} bg="#fff" color={C.ink}>{t}</Label></div>
            </Obj>
          );
        })}
        <Obj x={0} y={140} w={900} h={320} o={clamp01(spr(f, T2.sejak - 12, SNAP) * 2) * (1 - out(f, T2.awal + 8, 12))} z={-out(f, T2.awal + 8, 12) * 500}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 34, fontWeight: 600, letterSpacing: "0.14em" }}>OPEN SOURCE SEJAK</div>
            <Roll f={f} at={T2.dua - 26} value="2015" size={230} />
          </div>
        </Obj>
        <Obj x={0} y={lerp(900, 300, clamp01(spr(f, T2.awal - 10, PANEL)))} w={820} h={560} rx={lerp(40, 0, clamp01(spr(f, T2.awal - 10, PANEL)))} o={f >= T2.awal - 10 ? 1 : 0}>
          <div style={{ boxShadow: glow(0.6), borderRadius: 16 }}>
            <Browser w={820} h={560} url="panel.contoh.id">
              <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ fontSize: 22, color: C.gray, fontWeight: 600, letterSpacing: "0.12em" }}>PROSES SERVER</div>
                {rows.map(([ic, t, at, col]) => {
                  const on = clamp01(spr(f, at, POP));
                  return (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 18, height: 104, borderRadius: 16, padding: "0 24px", background: on > 0.02 ? "#fff" : C.paper, border: `2px solid ${on > 0.02 ? col : "rgba(0,0,0,0.05)"}`,
                      opacity: clamp01(spr(f, T2.awal + 4, SNAP)), transform: `scale(${1 + on * 0.02})` }}>
                      <Icon name={ic as "Power"} size={44} color={on > 0.02 ? col : C.gray} draw={Math.max(0.35, on)} />
                      <div style={{ fontSize: 34, fontWeight: 600, color: C.ink }}>{t}</div>
                    </div>
                  );
                })}
              </div>
            </Browser>
          </div>
        </Obj>
      </Stage>
      <Headline f={f} dark items={[{ at: T2.awal - 6, text: "Berawal dari pengelolaan server game.", color: "#fff" }]} size={56} />
      <AbsoluteFill style={{ background: "#111113", opacity: clamp01((f - (L2.dur - 7)) / 6) }} />
    </AbsoluteFill>
  );
};
export const sfxP2 = (): SfxCue[] => {
  const o = L2.from;
  return [s(o, "morph_down", 0.3), s(o + T2.gratis - 8, "msg_out", 0.25, 1.3), s(o + T2.gratis + 6, "impact_glass", 0.3), s(o + T2.open - 8, "msg_out", 0.25, 1.4), s(o + T2.open + 6, "impact_glass", 0.3, 1.1),
    s(o + T2.sejak - 10, "whip_fast", 0.35), s(o + T2.dua - 26, "scramble", 0.3, 0.8), s(o + T2.dua + 6, "impact_soft", 0.35), s(o + T2.awal - 10, "whip_low", 0.35),
    s(o + T2.awal + 20, "click_low", 0.4), s(o + T2.awal + 36, "click_low", 0.4, 0.9), s(o + T2.awal + 52, "data_tick", 0.3), s(o + L2.dur - 22, "lens_pass", 0.4)];
};

/* ------------------------------------------------------------------ P3 why bots */
const L3 = localP("p3");
const T3 = { lalu: L3.c("Lalu"), karena: L3.c("Karena"), program: L3.c("program"), runtime: L3.c("runtime"), node: L3.c("Node"), python: L3.c("Python"), konfig: L3.c("konfigurasi"), tg: L3.c("Telegram"), wa: L3.c("WhatsApp"), kode: L3.c("Kode botnya"), sesuai: L3.c("disesuaikan"), end: L3.dur };
export const SP3: React.FC = () => {
  const f = useCurrentFrame();
  const cam = (ff: number) => breathe(rig(ff, { z: 0, y: -60 }, [{ at: T3.runtime - 10, to: { z: 80, rx: 8 }, feel: GLIDE }, { at: T3.tg - 30, to: { y: 160, z: 120, rx: 4 }, feel: GLIDE }, { at: T3.kode - 10, to: { y: 60, z: 60 }, feel: GLIDE }, { at: T3.end - 22, to: { z: -1500 }, feel: { stiffness: 170, damping: 26 } }]), ff, 1, 4);
  const { v: c, d: cd } = vel(cam, f);
  const proc = spr(f, 4, { stiffness: 150, damping: 15 });
  const cont = spr(f, T3.runtime - 16, { stiffness: 90, damping: 18 });
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.35 * clamp01(f / 20)} angle={-30} seed={7} />
      <WarmLight f={f} x={540} y={900} r={900} o={0.45} />
      <Stage cam={c} blur={[cd.x, cd.y]}>
        <Obj x={0} y={-160} w={240} h={240} s={lerp(0.1, 1, proc)}>
          <div style={{ width: 240, height: 240, borderRadius: 46, background: "linear-gradient(160deg, rgba(255,138,92,0.34), rgba(255,77,18,0.14))", border: `3px solid ${C.orange}`, boxShadow: glow(0.9),
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="Bot" size={100} color="#fff" stroke={1.5} draw={clamp01((f - 6) / 22)} />
            <SwapText f={f} items={[{ at: T3.lalu, text: "Bot" }, { at: T3.program - 6, text: "Program" }]} size={32} color="#fff" />
          </div>
        </Obj>
        <Obj x={0} y={-140} z={lerp(1100, 0, cont)} w={600} h={600} o={clamp01(cont * 3)}>
          <ContainerIllo d={clamp01(cont * 1.2)} size={600} color="rgba(255,255,255,0.85)" open={lerp(0.9, 0.3, clamp01(spr(f, T3.runtime + 10, PANEL)))} />
        </Obj>
        <Obj x={0} y={-560} w={800} h={100} s={clamp01(spr(f, T3.runtime - 6, SNAP))}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, color: "rgba(255,255,255,0.7)", fontSize: 34, fontWeight: 500 }}>
            Runtime
            <div style={{ padding: "10px 24px", borderRadius: 14, border: `2px solid ${C.orange}`, minWidth: 210, display: "flex", justifyContent: "center", background: "rgba(255,106,43,0.1)" }}>
              <SwapText f={f} items={[{ at: T3.node - 8, text: "Node.js" }, { at: T3.python - 6, text: "Python" }]} size={40} weight={500} color="#fff" style={{ fontFamily: MONO }} />
            </div>
          </div>
        </Obj>
        <Flow f={f} d="M -60 150 C -60 260 -260 260 -260 360" reveal={clamp01((f - T3.tg + 20) / 20)} color={C.telegram} pulses={3} width={4} />
        <Flow f={f} d="M 60 150 C 60 260 260 260 260 360" reveal={clamp01((f - T3.wa + 16) / 20)} color={C.whatsapp} pulses={3} width={4} />
        {([["telegram", T3.tg, -260], ["whatsapp", T3.wa, 260]] as const).map(([b, at, x]) => (
          <Obj key={b} x={x} y={450} w={240} h={180} s={spr(f, at - 8, POP)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <BrandLogo brand={b} size={120} />
              <div style={{ color: "#fff", fontSize: 32, fontWeight: 600 }}>{b === "telegram" ? "Telegram" : "WhatsApp"}</div>
            </div>
          </Obj>
        ))}
        <Obj x={0} y={640} w={900} h={80} s={spr(f, T3.kode - 8, POP)}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Label bg="rgba(245,181,68,0.18)" color={C.warn} size={32}><Icon name="Wrench" size={30} color={C.warn} /> kode bot tetap perlu disesuaikan</Label>
          </div>
        </Obj>
      </Stage>
      <Headline f={f} dark items={[{ at: T3.lalu - 4, text: "Kenapa bisa untuk bot?", color: "#fff" }, { at: T3.karena - 4, text: "Bot juga sebuah program.", color: "#fff" }, { at: T3.konfig - 6, text: "Dengan konfigurasi yang sesuai", color: "#fff" }]} size={58} hide={T3.end - 26} />
      <AbsoluteFill style={{ background: "#111113", opacity: Math.max(1 - clamp01(f / 8), clamp01((f - (L3.dur - 7)) / 6)) }} />
    </AbsoluteFill>
  );
};
export const sfxP3 = (): SfxCue[] => {
  const o = L3.from;
  return [s(o + 4, "morph_up", 0.35), s(o + T3.program - 6, "scramble", 0.25), s(o + T3.runtime - 16, "lens_pass", 0.35, 1.2), s(o + T3.runtime + 10, "latch", 0.35),
    s(o + T3.node - 8, "scramble", 0.22), s(o + T3.python - 6, "scramble", 0.22, 1.1), s(o + T3.tg - 20, "data_flow", 0.3), s(o + T3.tg - 8, "impact_glass", 0.3), s(o + T3.wa - 8, "impact_glass", 0.3, 1.12),
    s(o + T3.kode - 8, "status_warn", 0.25), s(o + L3.dur - 22, "lens_pass", 0.45)];
};

/* ------------------------------------------------------------------ P4 architecture (vertical stack) */
const L4 = localP("p4");
const T4 = { begini: L4.c("begini"), vps: L4.c("V P S"), cpu: L4.c("C P U"), ram: L4.c("ram"), simpan: L4.c("penyimpanan"), panel: L4.c("Panel"), browser: L4.c("browser"), wings: L4.c("Wings"), container: L4.c("container", 1), bot: L4.c("bot berjalan"), pesan: L4.c("Pesan pengguna"), tidak: L4.c("tidak lewat"), langsung: L4.c("langsung"), wa: L4.c("WhatsApp"), end: L4.dur };
export const SP4: React.FC = () => {
  const f = useCurrentFrame();
  const cam = (ff: number) => breathe(rig(ff, { y: 520, z: -700, rx: -20 }, [{ at: 0, to: { y: 380, z: 60, rx: -10 }, feel: GLIDE }, { at: T4.panel - 12, to: { y: -300, z: 100, rx: -4 }, feel: WHIP }, { at: T4.wings - 10, to: { y: 60, z: 160 }, feel: WHIP }, { at: T4.container - 4, to: { y: 40, z: -260 }, feel: GLIDE }, { at: T4.pesan - 14, to: { y: -40, z: 300, ry: -8 }, feel: GLIDE }, { at: T4.end - 22, to: { y: -330, z: 220, ry: 0 }, feel: WHIP }]), ff, 0.8, 5);
  const { v: c, d: cd } = vel(cam, f);
  const mods = [T4.cpu, T4.ram, T4.simpan];
  const panelQ = spr(f, T4.panel - 14, { stiffness: 110, damping: 17 });
  const hand = out(f, L4.dur - 24, 24);
  const route = clamp01((f - T4.langsung + 20) / 30);
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.4} angle={-30} seed={9} />
      <WarmLight f={f} x={540} y={1200} r={900} o={0.45} />
      <Stage cam={c} blur={[cd.x, cd.y * 0.6]}>
        <Obj x={0} y={480} w={900} h={460} rx={62}>
          <div style={{ width: 900, height: 460, borderRadius: 32, background: "linear-gradient(160deg,#1b1c20,#0d0d0f)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: glow(0.7), position: "relative", transformStyle: "preserve-3d" }}>
            <div style={{ position: "absolute", left: 34, bottom: 30, display: "flex", alignItems: "center", gap: 14, color: "#fff" }}>
              <ServerIllo d={clamp01(f / 26)} f={f} size={80} />
              <div style={{ fontSize: 36, fontWeight: 700 }}>VPS</div>
            </div>
            {(["Cpu", "MemoryStick", "HardDrive"] as const).map((ic, i) => {
              const q = spr(f, mods[i] - 10, { stiffness: 200, damping: 16 });
              return (
                <div key={ic} style={{ position: "absolute", left: 80 + i * 260, top: 60, transformOrigin: "50% 100%", transform: `rotateX(${-62 * q}deg)`, opacity: clamp01(q * 3), transformStyle: "preserve-3d" }}>
                  <div style={{ width: 220, height: 190, borderRadius: 18, background: "linear-gradient(160deg,#25272c,#16171a)", border: "1px solid rgba(255,138,92,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <Icon name={ic} size={70} color={C.coral} draw={clamp01(q)} stroke={1.6} />
                    <div style={{ color: "#fff", fontSize: 28, fontWeight: 600 }}>{["CPU", "RAM", "Penyimpanan"][i]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Obj>
        <Obj x={lerp(1300, 0, clamp01(spr(f, T4.wings - 14, PANEL)))} y={60} z={40} w={860} h={360} rx={62}>
          <div style={{ width: 860, height: 360, borderRadius: 28, background: "linear-gradient(160deg, rgba(40,42,48,0.95), rgba(20,21,24,0.95))", border: "1px solid rgba(255,106,43,0.6)", position: "relative", transformStyle: "preserve-3d" }}>
            <div style={{ position: "absolute", left: 30, bottom: 22, color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name="Layers" size={44} color={C.orange} /><div style={{ fontSize: 34, fontWeight: 700 }}>Wings</div>
            </div>
            {[0, 1, 2].map((i) => {
              const q = spr(f, T4.wings + 10 + i * 10, { stiffness: 260, damping: 15 });
              return (
                <div key={i} style={{ position: "absolute", left: 250 + i * 200, top: 30, transformOrigin: "50% 100%", transform: `rotateX(${-62 * Math.min(1.1, q)}deg)`, opacity: clamp01(q * 3), transformStyle: "preserve-3d" }}>
                  <ContainerIllo d={clamp01(q)} size={170} color={i === 1 ? "#fff" : "rgba(255,255,255,0.55)"} accent={i === 1 ? C.orange : C.gray} open={i === 1 ? clamp01(spr(f, T4.container, PANEL)) * 0.9 * (1 - out(f, T4.pesan - 10, 14)) : 0} />
                </div>
              );
            })}
          </div>
        </Obj>
        <Obj x={0} y={-120} z={260} w={600} h={260} s={lerp(0.1, 0.62, clamp01(spr(f, T4.bot - 20, PANEL)))} o={clamp01((f - T4.bot + 20) / 8) * (1 - out(f, T4.pesan - 14, 10))}>
          <CodeCard f={f} at={T4.bot - 14} w={600} title="asisten-bot/index.js" size={22} lines={[{ text: "bot.on('message', async (msg) => {", tone: "kw" }, { text: "  await msg.reply(await jawab(msg));", tone: "plain" }, { text: "});", tone: "kw" }]} />
        </Obj>
        <Obj x={0} y={-430} z={lerp(900, 0, clamp01(panelQ)) + hand * 1300} w={760} h={330} o={clamp01(panelQ * 4)} ry={lerp(-25, -4, clamp01(panelQ)) * (1 - hand)}>
          <div style={{ boxShadow: glow(0.6), borderRadius: 16, opacity: 1 - spr(f, T4.tidak - 6, SNAP) * 0.4 * (1 - hand) }}>
            <Browser w={760} h={330} tone="dark" url="panel.contoh.id">
              <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
                <PteroLogo height={40} reveal={clamp01((f - T4.panel + 4) / 20)} />
                <div style={{ display: "flex", gap: 12 }}>{["asisten-bot", "bot-wa"].map((n, i) => (
                  <div key={n} style={{ flex: 1, height: 120, borderRadius: 12, background: "#23272e", padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ color: "#fff", fontSize: 22, fontFamily: MONO }}>{n}</div><StatusPill state="running" f={f + i * 20} size={16} />
                  </div>))}
                </div>
              </div>
            </Browser>
          </div>
        </Obj>
        <Flow f={f} d="M -120 -260 C -150 -140 -120 -60 -80 20" reveal={clamp01((f - T4.wings + 6) / 16) * (1 - hand)} color={C.orange} width={4} pulses={3} />
        <Obj x={380} y={-170} w={200} h={150} s={spr(f, T4.pesan - 12, PANEL) * (1 - hand)}>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}><BrandLogo brand="telegram" size={80} /><BrandLogo brand="whatsapp" size={80} /></div>
        </Obj>
        <Obj x={250} y={-300} w={80} h={80} s={spr(f, T4.tidak - 6, POP) * (1 - out(f, T4.langsung + 20, 10))}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: "rgba(240,82,79,0.2)", border: `3px solid ${C.err}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="X" size={44} color={C.err} stroke={2.6} draw={clamp01((f - T4.tidak) / 12)} />
          </div>
        </Obj>
        <Flow f={f} d="M 340 -90 C 320 0 200 40 40 60" reveal={route * (1 - hand)} color={C.telegram} pulses={4} width={5} dashed={false} />
        <Flow f={f} d="M 420 -90 C 420 20 260 80 60 90" reveal={clamp01((f - T4.wa + 10) / 30) * (1 - hand)} color={C.whatsapp} pulses={4} width={5} dashed={false} />
      </Stage>
      <Headline f={f} dark items={[{ at: T4.vps - 6, text: "Server menyediakan tenaga.", color: "#fff" }, { at: T4.panel - 6, text: "Panel mengelola.", color: "#fff" }, { at: T4.bot - 6, text: "Bot menjalankan logika.", color: "#fff" }, { at: T4.pesan - 6, text: "Pesan tidak lewat panel.", color: "#fff" }]} size={58} hide={L4.dur - 24} />
      <AbsoluteFill style={{ background: "#111113", opacity: 1 - clamp01(f / 10) }} />
      <AbsoluteFill style={{ background: "#1b1e23", opacity: clamp01((f - (L4.dur - 7)) / 6) }} />
    </AbsoluteFill>
  );
};
export const sfxP4 = (): SfxCue[] => {
  const o = L4.from;
  return [s(o, "swell_deep", 0.35, 1.1), s(o + T4.cpu - 10, "impact_card", 0.3), s(o + T4.ram - 10, "impact_card", 0.3, 1.1), s(o + T4.simpan - 10, "impact_card", 0.3, 0.95),
    s(o + T4.panel - 14, "lens_pass", 0.35, 1.25), s(o + T4.wings - 14, "whip_low", 0.35), s(o + T4.wings + 10, "impact_glass", 0.25), s(o + T4.wings + 20, "impact_glass", 0.25, 1.1), s(o + T4.wings + 30, "impact_glass", 0.25, 1.2),
    s(o + T4.container, "latch", 0.35), s(o + T4.bot - 16, "type_short", 0.25), s(o + T4.pesan - 12, "msg_out", 0.35), s(o + T4.tidak - 6, "error_blip", 0.28), s(o + T4.langsung - 20, "data_flow", 0.35), s(o + L4.dur - 24, "rise_short", 0.35)];
};

/* ------------------------------------------------------------------ P5 features + limits (stacked cards, camera tracks down) */
const L5 = localP("p5");
const T5 = { console: L5.c("console"), error: L5.c("error"), cpu: L5.c("C P U"), file: L5.c("file"), start: L5.c("start"), stop: L5.c("stop"), restart: L5.c("restart"), tapi: L5.c("Tapi ingat"), running: L5.c("Running"), terhubung: L5.c("terhubung"), error2: L5.c("error", 1), kode: L5.c("kodenya"), end: L5.dur };
const logs5: Line[] = [
  { t: 6, text: "[info] Asisten Bot dimulai", kind: "info" }, { t: 20, text: "[ok]   terhubung ke Bot API", kind: "ok" }, { t: T5.console, text: "[info] pesan masuk: /jadwal", kind: "in" },
  { t: T5.error - 6, text: "[error] TypeError: undefined", kind: "err" }, { t: T5.start + 4, text: "[panel] sinyal start", kind: "dim" }, { t: T5.stop + 4, text: "[panel] sinyal stop", kind: "dim" }, { t: T5.restart + 4, text: "[panel] sinyal restart", kind: "dim" },
];
const cpuFn = series(3, 10, 8, [[40, 18, 4]]);
const ramFn = series(7, 38, 4, [[90, 8, 10]]);
export const SP5: React.FC = () => {
  const f = useCurrentFrame();
  const cam = (ff: number) => breathe(rig(ff, { y: -420, z: -500 }, [{ at: 0, to: { y: -420, z: 0 }, feel: GLIDE }, { at: T5.cpu - 10, to: { y: -60 }, feel: WHIP }, { at: T5.file - 10, to: { y: 300 }, feel: WHIP }, { at: T5.start - 12, to: { y: 640 }, feel: WHIP }, { at: T5.tapi - 10, to: { y: 0, z: 260 }, feel: GLIDE }]), ff, 0.8, 6);
  const { v: c, d: cd } = vel(cam, f);
  const state: PowerState = f < T5.start ? "running" : f < T5.stop ? "starting" : f < T5.restart ? "stopping" : f < T5.restart + 60 ? "starting" : "running";
  const active = f < T5.start - 4 ? null : f < T5.stop - 4 ? "start" : f < T5.restart - 4 ? "stop" : f < T5.restart + 30 ? "restart" : null;
  const warn = spr(f, T5.tapi - 10, PANEL);
  const stack = 1 - clamp01(warn * 1.3);
  const W = 900;
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.45} angle={-24} seed={5} />
      <WarmLight f={f} x={540} y={960} r={1000} o={0.5} />
      <Stage cam={c} blur={[cd.x, cd.y]}>
        {[0, 1, 2, 3].map((i) => {
          const q = clamp01(spr(f, i * 6, PANEL));
          const y = -420 + i * 360;
          return (
            <Obj key={i} x={lerp(i % 2 ? 900 : -900, 0, q)} y={y} w={W} h={320} o={clamp01(q * 3) * stack} z={-(1 - stack) * 600} ry={lerp(i % 2 ? -30 : 30, 0, q)}>
              <div style={{ boxShadow: glow(0.4), borderRadius: 16, height: 320, background: "#1b1e23", padding: 20, boxSizing: "border-box" }}>
                {i === 0 && <ConsoleView f={f} lines={logs5} w={W - 40} h={280} size={24} highlight={3} hiA={clamp01((f - T5.error) / 8)} />}
                {i === 1 && <div style={{ display: "flex", gap: 16 }}><Graph f={f} w={(W - 56) / 2} h={280} fn={cpuFn} color={C.coral} label="CPU" icon="Cpu" unit={(v) => `${v.toFixed(0)}%`} /><Graph f={f} w={(W - 56) / 2} h={280} fn={ramFn} color={C.telegram} label="RAM" icon="MemoryStick" unit={(v) => `${Math.round(v * 5.12)} MiB`} offset={30} /></div>}
                {i === 2 && <FileManager f={f} at={T5.file - 8} w={W - 40} h={280} rows={[{ name: "index.js", size: "4,2 KB", hi: true }, { name: "config.js", size: "1,1 KB" }, { name: "node_modules", size: "—", dir: true }, { name: ".env (disensor)", size: "0,1 KB" }]} />}
                {i === 3 && (
                  <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
                    <StatusPill state={state} f={f} size={30} />
                    <PowerButtons scale={1.7} active={active as "start" | "stop" | "restart" | null} press={0} />
                  </div>
                )}
              </div>
            </Obj>
          );
        })}
        {/* limits */}
        <Obj x={0} y={-180} w={W} h={260} s={lerp(0.85, 1, clamp01(warn))} o={clamp01(warn * 2)}>
          <Card w={W} h={260} tone="dark" radius={26} glowA={0.5}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <StatusPill state="running" f={f} size={28} />
                <Icon name="ArrowRight" size={40} color="#fff" />
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 34, fontWeight: 600, color: f > T5.terhubung ? C.err : "#fff" }}><Icon name="WifiOff" size={40} color={C.err} /> belum tentu terhubung</div>
              </div>
            </div>
          </Card>
        </Obj>
        <Obj x={0} y={200} w={W} h={300} s={lerp(0.85, 1, clamp01(spr(f, T5.error2 - 10, PANEL)))} o={clamp01(spr(f, T5.error2 - 10, SNAP) * 2)}>
          <CodeCard f={f} at={T5.error2 - 6} w={W} size={26} title="commands/jadwal.js" hiLine={1} hiA={1} hiColor={f > T5.kode ? C.ok : C.err}
            lines={[{ text: "function formatAgenda(a) {", tone: "kw" }, { text: f > T5.kode ? "  if (!a) return 'Belum ada agenda.';" : "  return a.tanggal + a.isi;", tone: f > T5.kode ? "fix" : "err" }, { text: "}", tone: "kw" }]} />
        </Obj>
      </Stage>
      <Headline f={f} dark items={[{ at: T5.console - 8, text: "Console & error", color: "#fff" }, { at: T5.cpu - 8, text: "CPU & RAM", color: "#fff" }, { at: T5.file - 8, text: "File manager", color: "#fff" }, { at: T5.start - 8, text: "Start · Stop · Restart", color: "#fff" }, { at: T5.tapi - 6, text: "Tapi ingat:", color: C.coral }, { at: T5.error2 - 6, text: "Error diperbaiki di kode.", color: "#fff" }]} size={60} />
      <AbsoluteFill style={{ background: "#1b1e23", opacity: 1 - clamp01(f / 9) }} />
      <Sweep f={f} at={L5.dur - 16} half="in" dir="up" />
    </AbsoluteFill>
  );
};
export const sfxP5 = (): SfxCue[] => {
  const o = L5.from;
  return [s(o, "stack_ticks", 0.3), s(o + 6, "panel_slide", 0.3), s(o + T5.error - 6, "error_blip", 0.4), s(o + T5.cpu - 10, "whip_fast", 0.32), s(o + T5.cpu, "data_flow", 0.22),
    s(o + T5.file - 10, "whip_fast", 0.32, 1.1), s(o + T5.start - 12, "whip_fast", 0.32, 0.9), s(o + T5.start - 4, "click_low", 0.45), s(o + T5.stop - 4, "click_low", 0.45, 0.88), s(o + T5.restart - 4, "click_low", 0.45, 1.08),
    s(o + T5.tapi - 10, "morph_down", 0.35), s(o + T5.terhubung, "error_blip", 0.3), s(o + T5.error2 - 10, "panel_lift", 0.3), s(o + T5.kode, "status_on", 0.25), s(o + L5.dur - 16, "lens_pass", 0.45)];
};

/* ------------------------------------------------------------------ P6 closing */
const L6 = localP("p6");
const T6 = { soft: L6.c("Software"), hosting: L6.c("hosting"), jadi: L6.c("Jadi"), kenali: L6.c("kenali"), botmu: L6.c("botmu"), end: L6.dur, speechEnd: L6.end };
export const SP6: React.FC = () => {
  const f = useCurrentFrame();
  const cardsOut = out(f, T6.jadi - 4, 22);
  const title = clamp01(spr(f, T6.jadi + 6, GLIDE));
  const fade = clamp01((f - (T6.end - 36)) / 34);
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: 1 - fade }}>
        <LightStreak f={f} o={0.45} angle={-26} seed={12} />
        <WarmLight f={f} x={540} y={960} r={1000} o={0.55} />
        <GlowWave f={f} y={1180} amp={lerp(10, 50, title)} o={title * 0.85} reveal={title} speed={0.03} wl={420} />
        <Stage cam={breathe(rig(f, { z: 0 }, [{ at: T6.jadi, to: { z: 300 }, feel: DRIFT }]), f, 0.8, 7)}>
          {([["Software panel", "gratis & open source", "mark", -300, T6.soft, C.ok], ["Hosting", "bisa berbiaya", "Coins", 120, T6.hosting, C.warn]] as const).map(([a, b, ic, y, at, col], i) => {
            const q = clamp01(spr(f, at - 10, { stiffness: 150, damping: 16 }));
            return (
              <Obj key={a} x={lerp(i ? 900 : -900, 0, q) + cardsOut * (i ? 1400 : -1400)} y={y} z={cardsOut * 800} w={820} h={300} o={clamp01(q * 3)}>
                <Card w={820} h={300} tone="dark" radius={28} glowA={0.45}>
                  <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 30, padding: "0 50px", color: "#fff" }}>
                    {ic === "mark" ? <PteroMark size={110} draw={q} /> : <Icon name="Coins" size={100} color={col} draw={q} />}
                    <div><div style={{ fontSize: 46, fontWeight: 700 }}>{a}</div><div style={{ fontSize: 34, color: col, fontWeight: 600 }}>{b}</div></div>
                  </div>
                </Card>
              </Obj>
            );
          })}
        </Stage>
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity: title, filter: title < 0.97 ? `blur(${(1 - title) * 10}px)` : undefined, transform: `scale(${lerp(0.94, 1, title)})` }}>
            <PteroLogo height={100} reveal={clamp01((f - T6.jadi) / 30)} />
            <div style={{ color: "#fff", fontSize: 40, fontWeight: 500, letterSpacing: "0.32em" }}>PANEL</div>
          </div>
          <div style={{ position: "absolute", top: 860, width: 900, display: "flex", justifyContent: "center" }}>
            <SwapText f={f} items={[{ at: T6.kenali - 4, text: "Kenali proses di balik botmu.", color: "#fff" }]} size={56} />
          </div>
          <div style={{ position: "absolute", top: 1180, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: clamp01((f - T6.speechEnd - 10) / 20) }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 30, fontWeight: 500 }}>Visual explainer by FELIXIORITY</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 20, fontFamily: MONO, textAlign: "center", width: 860 }}>Tidak berafiliasi dengan Pterodactyl, Telegram, maupun WhatsApp. Data di layar adalah simulasi.</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Sweep f={f} at={0} half="out" dir="up" />
    </AbsoluteFill>
  );
};
export const sfxP6 = (): SfxCue[] => {
  const o = L6.from;
  return [s(o + T6.soft - 10, "whip_air", 0.3), s(o + T6.soft + 4, "impact_card", 0.32), s(o + T6.hosting - 10, "whip_air", 0.3, 1.1), s(o + T6.hosting + 4, "impact_card", 0.32, 0.9),
    s(o + T6.jadi - 4, "lens_pass", 0.4, 0.85), s(o + T6.jadi + 6, "swell_bright", 0.3, 0.75), s(o + T6.end - 220, "resolve", 0.33)];
};

void softShadow; void DRIFT;
