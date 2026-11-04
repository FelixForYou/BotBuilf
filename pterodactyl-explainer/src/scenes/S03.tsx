import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { arc, breathe, clamp01, DRIFT, GLIDE, inOut, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Flow, GlowWave, Label, Obj, Stage, Words, WarmLight, LightStreak } from "../components/Primitives";
import { MBlur, SwapText } from "../components/Motion";
import { ContainerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo } from "../components/Logos";
import { CodeCard } from "../components/UI";

const L = makeLocal("s03");
const T = {
  jawab: L.c("Jawabannya"), cara: L.c("cara kerja"), sgame: L.c("Server game"), bot: L.c("bot"), program: L.c("program"), bagi: L.c("Bagi"),
  proses: L.c("proses"), dijalankan: L.c("dijalankan"), diawasi: L.c("diawasi"), keduanya: L.c("Keduanya butuh"), runtime: L.c("runtime"),
  node: L.c("Node"), python: L.c("Python"), dep: L.c("dependensi"), sumber: L.c("sumber daya"), koneksi: L.c("koneksi"), karena: L.c("Karena"),
  konfig: L.c("konfigurasi"), ptero: L.c("Pterodactyl"), tg: L.c("Telegram"), wa: L.c("WhatsApp"), kode: L.c("Kode botnya"), sesuaikan: L.c("disesuaikan"),
  k1: L.c("Lingkungan sesuai"), k2: L.c("proses berjalan"), k3: L.c("bot terhubung"), end: L.dur,
};
const RUSH = T.end - 22; // container rushes through the lens into scene 4

const cam = (f: number) =>
  rig(f, { x: 0, y: 0, z: 0 }, [
    { at: 10, to: { z: -160, rx: 4 }, feel: GLIDE },
    { at: T.sgame - 12, to: { z: 40, ry: -4 }, feel: GLIDE },
    { at: T.program + 4, to: { z: -220, ry: 3 }, feel: WHIP },
    { at: T.keduanya - 20, to: { z: 60, rx: 12, ry: -6 }, feel: GLIDE },
    { at: T.dep - 6, to: { ry: 6, x: -60 }, feel: DRIFT },
    { at: T.koneksi - 6, to: { ry: -4, x: 80 }, feel: GLIDE },
    { at: T.ptero - 14, to: { x: 330, z: 140, ry: -10, rx: 6 }, feel: WHIP },
    { at: T.wa + 6, to: { y: 40, ry: -6 }, feel: GLIDE },
    { at: T.kode - 12, to: { x: -240, z: 40, ry: 10 }, feel: WHIP },
    { at: T.k1 - 30, to: { x: 0, z: 200, ry: 0, rx: 4, y: 0 }, feel: GLIDE },
    { at: RUSH, to: { z: -1500, rx: 0 }, feel: { stiffness: 180, damping: 26 } },
  ]);

const Chip: React.FC<{ icon: "Package" | "Cpu" | "Wifi"; text: string; q: number }> = ({ icon, text, q }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 14, background: "rgba(22,23,26,0.92)", border: "1px solid rgba(255,138,92,0.35)",
    color: "#fff", fontFamily: FONT, fontSize: 22, fontWeight: 600, whiteSpace: "nowrap", boxShadow: glow(0.25) }}>
    <Icon name={icon} size={26} color={C.coral} draw={clamp01(q)} />
    {text}
  </div>
);

const Check: React.FC<{ f: number; at: number; text: string; color?: string }> = ({ f, at, text, color = C.ok }) => {
  const q = spr(f, at - 8, POP);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: clamp01(q * 2), transform: `translateX(${(1 - clamp01(q)) * -40}px)` }}>
      <div style={{ width: 48, height: 48, borderRadius: 24, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${q})`, background: `${color}22` }}>
        <Icon name="Check" size={28} color={color} stroke={2.6} draw={clamp01((f - at + 2) / 14)} />
      </div>
      <Words f={f} text={text} at={at - 4} stagger={4} size={46} color="#fff" weight={600} />
    </div>
  );
};

export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 1, 3), f);
  const morph = spr(f, 2, { stiffness: 150, damping: 15 }); // dot -> process square
  const size = lerp(28, 190, morph);
  const swallow = (at: number) => clamp01(spr(f, at, { stiffness: 140, damping: 20 }));
  const contIn = spr(f, T.keduanya - 18, { stiffness: 90, damping: 18 });
  const finale = spr(f, T.k1 - 30, GLIDE);
  const rush = out(f, RUSH, 22);

  const label = (side: number, at: number) => {
    const q = clamp01(spr(f, at - 10, PANEL));
    const sw = swallow(T.program - 6);
    const [x0, y0, z0] = arc(q, [side * 1200, -300, -400], [side * 700, 120, 200], [side * 420, -40, 0]);
    return { x: lerp(x0, 0, sw), y: lerp(y0, -40, sw), z: z0, s: lerp(1, 0.2, sw), o: clamp01(q * 2) * (1 - clamp01((sw - 0.6) * 3)) };
  };
  const dock = (at: number, from: [number, number, number], to: [number, number, number], bend: [number, number, number]) => {
    const fn = (ff: number) => {
      const q = clamp01(spr(ff, at - 12, { stiffness: 120, damping: 17 }));
      const leave = out(ff, T.k1 - 40, 14);
      const [x, y, z] = arc(q, from, bend, to);
      return { x, y: y + leave * 300, z: z - leave * 600 };
    };
    return vel(fn, f);
  };
  const deps = [
    { icon: "Package" as const, text: "Dependensi", at: T.dep, ...dock(T.dep, [-1500, 500, -300], [-430, 60, 0], [-900, -200, 300]) },
    { icon: "Cpu" as const, text: "Sumber daya", at: T.sumber, ...dock(T.sumber, [1500, -600, -300], [430, -70, 0], [900, -300, 300]) },
    { icon: "Wifi" as const, text: "Koneksi jaringan", at: T.koneksi, ...dock(T.koneksi, [1500, 700, -300], [420, 120, 0], [800, 500, 200]) },
  ];
  const runtimeQ = spr(f, T.runtime - 10, SNAP) * (1 - out(f, T.karena - 4, 10));
  const branch = clamp01((f - T.ptero + 6) / 28);
  const codeQ = spr(f, T.kode - 16, PANEL) * (1 - out(f, T.k1 - 36, 12));

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.25 + contIn * 0.2} angle={-30} seed={7} />
      <WarmLight f={f} o={0.25 + contIn * 0.25} y={600} r={900} />
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-c.x * 0.3}px)`, opacity: 0.6 * (1 - finale * 0.5) }}>
        <GlowWave f={f + 1800} y={880} amp={22} reveal={clamp01((f - T.keduanya) / 40)} speed={0.03} width={0.7} />
      </div>
      <Stage cam={c} blur={[cd.x, cd.y]}>
        {/* game server & bot are both programs: labels get swallowed by the process */}
        {([[-1, T.sgame, "Server game"], [1, T.bot, "Bot"]] as const).map(([side, at, t]) => {
          const l = label(side, at);
          return (
            <Obj key={t} x={l.x} y={l.y} z={l.z} w={320} h={60} s={l.s} o={l.o}>
              <div style={{ textAlign: "center", color: "#fff", fontSize: 38, fontWeight: 600 }}>{t}</div>
            </Obj>
          );
        })}

        {/* the process object (born from scene 2's dot) */}
        <Obj x={0} y={lerp(0, -40, morph)} w={size} h={size} s={1 + 0.1 * Math.exp(-Math.max(0, f - T.program) / 10) * (f > T.program ? 1 : 0)} z={0}>
          <div style={{ width: size, height: size, borderRadius: lerp(14, 38, morph), background: "linear-gradient(160deg, rgba(255,138,92,0.34), rgba(255,77,18,0.14))", border: `2px solid ${C.orange}`,
            boxShadow: glow(0.9), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden" }}>
            <div style={{ transform: `scale(${clamp01(morph)})` }}><Icon name="Bot" size={72} color="#fff" stroke={1.5} draw={clamp01((f - 10) / 24)} /></div>
            <SwapText f={f} items={[{ at: T.program - 2, text: "Program" }, { at: T.proses - 6, text: "Proses" }]} size={23} color="#fff" />
          </div>
        </Obj>
        {[["dijalankan", T.dijalankan, -110], ["diawasi", T.diawasi, 110]].map(([t, at, x]) => {
          const q = spr(f, (at as number) - 8, POP) * (1 - out(f, T.keduanya - 24, 10));
          return (
            <Obj key={t as string} x={x as number} y={120 + Math.sin(f * 0.05 + (x as number)) * 6} w={220} h={50} s={q} o={clamp01(q * 2)}>
              <div style={{ display: "flex", justifyContent: "center" }}><Label bg="rgba(255,255,255,0.1)" color="#fff" size={21}>{t}</Label></div>
            </Obj>
          );
        })}

        {/* environment: the container arrives from in front of the lens and envelops the process */}
        <Obj x={0} y={-10} z={lerp(1100, 0, contIn)} w={480} h={480} o={clamp01(contIn * 3) * (1 - finale * 0.6)} rx={lerp(-30, 0, contIn)}>
          <ContainerIllo d={clamp01(contIn * 1.2)} size={480} color="rgba(255,255,255,0.85)"
            open={lerp(0.9, 0.3, clamp01(spr(f, T.keduanya + 20, PANEL))) - clamp01(spr(f, T.k2 - 10, SNAP)) * 0.3} />
        </Obj>
        <Obj x={0} y={-320} w={520} h={70} s={lerp(0.7, 1, clamp01(runtimeQ))} o={clamp01(runtimeQ * 2)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, color: "rgba(255,255,255,0.65)", fontSize: 23, fontWeight: 500 }}>
            Runtime
            <div style={{ padding: "8px 18px", borderRadius: 12, border: `1px solid ${C.orange}`, minWidth: 150, display: "flex", justifyContent: "center", background: "rgba(255,106,43,0.08)" }}>
              <SwapText f={f} items={[{ at: T.node - 8, text: "Node.js" }, { at: T.python - 6, text: "Python" }]} size={27} weight={500} color="#fff" style={{ fontFamily: MONO }} />
            </div>
          </div>
        </Obj>
        {deps.map((d) => {
          const q = spr(f, d.at - 12, SNAP);
          return (
            <React.Fragment key={d.text}>
              <Flow f={f} d={`M ${d.v.x * 0.5} ${d.v.y} L ${d.v.x * 0.8} ${d.v.y}`} reveal={clamp01((f - d.at - 6) / 12) * (1 - out(f, T.k1 - 40, 10))} width={2} color="rgba(255,255,255,0.5)" glowOn={false} />
              <Obj x={d.v.x} y={d.v.y} z={d.v.z} w={320} h={70} o={clamp01(q * 3)}>
                <MBlur dx={d.d.x - cd.x} dy={d.d.y}><div style={{ display: "flex", justifyContent: "center" }}><Chip icon={d.icon} text={d.text} q={q} /></div></MBlur>
              </Obj>
            </React.Fragment>
          );
        })}

        {/* branches to the platforms */}
        <Flow f={f} d="M 230 -40 C 450 -40 520 -280 760 -280" reveal={branch * (1 - finale)} color={C.telegram} pulses={4} pulseSpeed={0.012} width={3} />
        <Flow f={f} d="M 230 20 C 450 20 520 250 760 250" reveal={clamp01((f - T.wa + 10) / 24) * (1 - finale)} color={C.whatsapp} pulses={4} pulseSpeed={0.012} width={3} />
        {([["telegram", T.tg, -280], ["whatsapp", T.wa, 250]] as const).map(([b, at, y]) => {
          const q = spr(f, at - 8, POP) * (1 - out(f, T.k1 - 34, 10));
          return (
            <Obj key={b} x={860} y={y} w={200} h={150} s={q} o={clamp01(q * 2)} ry={-14}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: `rotate(${(1 - clamp01(q)) * -30}deg)` }}>
                <BrandLogo brand={b} size={90} />
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 600 }}>{b === "telegram" ? "Telegram" : "WhatsApp"}</div>
              </div>
            </Obj>
          );
        })}
        <Obj x={340} y={330} w={900} h={60} o={1 - out(f, T.kode - 14, 10)}>
          <Words f={f} text="Dengan konfigurasi yang sesuai" at={T.karena} times={[T.karena + 20, T.konfig, T.konfig + 12, T.konfig + 26]} size={32} color="rgba(255,255,255,0.85)" weight={500} accent={[1]} />
        </Obj>

        {/* code still needs adjusting */}
        <Obj x={-620} y={-240} w={470} h={260} ry={lerp(70, 18, clamp01(codeQ))} z={lerp(-400, 0, clamp01(codeQ))} o={clamp01(codeQ * 2)}>
          <CodeCard f={f} at={T.kode - 8} w={470} title="bot/config.js" size={18}
            lines={[{ text: "module.exports = {", tone: "kw" }, { text: "  runtime: 'node',", tone: "str" }, { text: "  token: process.env.TOKEN,", tone: "plain" }, { text: "  start: 'node index.js',", tone: "str" }, { text: "};", tone: "kw" }]}
            hiLine={3} hiA={clamp01((f - T.sesuaikan + 10) / 10)} hiColor={C.warn} />
        </Obj>
        <Obj x={-620} y={-70} w={470} h={50} s={spr(f, T.sesuaikan - 8, POP) * (1 - out(f, T.k1 - 36, 10))}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Label bg="rgba(245,181,68,0.16)" color={C.warn} size={20}>
              <span style={{ display: "inline-block", transform: `rotate(${Math.sin(Math.max(0, f - T.sesuaikan) * 0.3) * 25 * Math.exp(-Math.max(0, f - T.sesuaikan) / 30)}deg)` }}><Icon name="Wrench" size={18} color={C.warn} /></span>
              tetap perlu disesuaikan
            </Label>
          </div>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - rush }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, transform: `translateY(${-rush * 80}px)` }}>
          <Check f={f} at={T.k1} text="Lingkungan sesuai." />
          <Check f={f} at={T.k2} text="Proses berjalan." />
          <Check f={f} at={T.k3} text="Bot terhubung." color={C.telegram} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 130 }}>
          <SwapText f={f} items={[{ at: T.cara - 6, text: "Cara kerja aplikasi" }]} size={32} weight={500} color="rgba(255,255,255,0.8)" style={{ opacity: 1 - out(f, T.sgame - 16, 10) }} />
        </div>
      </AbsoluteFill>
      {/* lens covered by the container's dark face: scene 4 starts from this same tone */}
      <AbsoluteFill style={{ background: "#111113", opacity: clamp01((f - (T.end - 8)) / 7) }} />
    </AbsoluteFill>
  );
};

export const sfx03 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 2, "morph_up", 0.4), s(o + 16, "impact_glass", 0.3), s(o + T.cara - 6, "scramble", 0.2),
    s(o + T.sgame - 10, "whip_air", 0.3), s(o + T.bot - 10, "whip_air", 0.3, 1.15), s(o + T.program - 6, "morph_down", 0.35), s(o + T.program + 4, "impact_soft", 0.35),
    s(o + T.proses - 6, "scramble", 0.25), s(o + T.dijalankan - 8, "click_glass", 0.25), s(o + T.diawasi - 8, "click_glass", 0.25, 1.1),
    s(o + T.keduanya - 18, "lens_pass", 0.35, 1.2), s(o + T.keduanya + 14, "latch", 0.4), s(o + T.node - 8, "scramble", 0.22), s(o + T.python - 6, "scramble", 0.22, 1.1),
    s(o + T.dep - 12, "whip_fast", 0.28), s(o + T.dep + 2, "impact_card", 0.3), s(o + T.sumber - 12, "whip_fast", 0.28, 1.1), s(o + T.sumber + 2, "impact_card", 0.3, 1.1),
    s(o + T.koneksi - 12, "whip_fast", 0.28, 0.9), s(o + T.koneksi + 2, "impact_card", 0.3, 0.9), s(o + T.ptero - 14, "whip_low", 0.35), s(o + T.ptero - 6, "data_flow", 0.3),
    s(o + T.tg - 8, "impact_glass", 0.3), s(o + T.wa - 8, "impact_glass", 0.3, 1.12), s(o + T.kode - 16, "flip", 0.35), s(o + T.sesuaikan - 8, "status_warn", 0.25),
    s(o + T.k1 - 30, "whip_air", 0.3, 0.8), s(o + T.k1 - 8, "impact_glass", 0.3), s(o + T.k2 - 8, "impact_glass", 0.3, 1.08), s(o + T.k3 - 8, "status_on", 0.28), s(o + RUSH, "lens_pass", 0.5),
  ];
};

void DRIFT; void inOut;
