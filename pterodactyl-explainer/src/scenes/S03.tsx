import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { easeBack, easeIO, easeOut, kf, life, mix, p } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Flow, GlowWave, Label, Obj, Stage, Words, WarmLight } from "../components/Primitives";
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

const Chip: React.FC<{ icon: "Package" | "Cpu" | "Wifi"; text: string; q: number }> = ({ icon, text, q }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", fontFamily: FONT, fontSize: 22, fontWeight: 600, opacity: q, transform: `scale(${mix(0.7, 1, q)})`, whiteSpace: "nowrap" }}>
    <Icon name={icon} size={26} color={C.coral} draw={q} />
    {text}
  </div>
);

const Check: React.FC<{ f: number; at: number; text: string; color?: string }> = ({ f, at, text, color = C.ok }) => {
  const q = p(f, at - 6, at + 26, easeOut);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: Math.min(1, q * 2) }}>
      <div style={{ width: 46, height: 46, borderRadius: 23, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${mix(0.6, 1, p(f, at - 6, at + 20, easeBack))})`,
        background: `${color}22` }}>
        <Icon name="Check" size={28} color={color} stroke={2.6} draw={p(f, at + 2, at + 24, easeOut)} />
      </div>
      <Words f={f} text={text} at={at} size={44} color="#fff" weight={600} />
    </div>
  );
};

export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const shrink = p(f, 0, 120, easeIO); // wave from scene 2 collapses into the process
  const proc = p(f, 70, 140, easeOut);
  const cont = p(f, T.keduanya - 20, T.keduanya + 60, easeOut);
  const branch = p(f, T.ptero - 10, T.tg + 30, easeOut);
  const finale = p(f, T.k1 - 30, T.k1 + 10, easeIO);
  const camX = kf(f, [T.karena, T.wa + 20, T.kode, T.k1], [0, 260, 120, 0]);
  const camZ = kf(f, [0, T.jawab + 80, T.bagi, T.keduanya, T.karena, T.wa, T.kode + 20, T.k1, T.end], [0, -120, -60, -180, -40, 60, -60, 140, 220]);
  const camRy = kf(f, [0, T.bagi, T.keduanya, T.karena, T.kode, T.k1], [-6, 4, -5, 5, -3, 0]);
  const camRx = kf(f, [0, T.keduanya, T.karena, T.k1], [6, 10, 4, 2]);
  const procWord = f < T.proses - 4 ? "Program" : "Proses";
  const swap = f < T.proses - 4 ? p(f, T.program - 10, T.program + 20) : p(f, T.proses - 4, T.proses + 20);
  const procX = kf(f, [T.cara, T.sgame - 10], [0, 0]);
  const runtime = f < T.python - 4 ? "Node.js" : "Python";
  const rtSwap = f < T.python - 4 ? p(f, T.node - 10, T.node + 16, easeOut) : p(f, T.python - 4, T.python + 16, easeOut);

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <WarmLight f={f} o={0.25 + cont * 0.25} y={600} r={900} />
      <GlowWave f={f + 1800} y={640} amp={50 * (1 - shrink)} o={1 - shrink} wl={520} reveal={1 - shrink * 0.9} />

      <Stage cam={{ x: camX, z: camZ, ry: camRy, rx: camRx }}>
        {/* converging labels: game server & bot are both programs */}
        {[["Server game", T.sgame, -1], ["Bot", T.bot, 1]].map(([t, at, side]) => {
          const q = life(f, (at as number) - 8, 30, T.keduanya - 30, 40);
          const conv = p(f, T.program - 20, T.program + 30, easeIO);
          return (
            <Obj key={t as string} x={(side as number) * mix(440, 240, conv)} y={-40} w={300} h={60} o={q * (1 - conv * 0.6)}>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 34, fontWeight: 600 }}>{t}</div>
            </Obj>
          );
        })}
        {[-1, 1].map((side) => (
          <Flow key={side} f={f} d={`M ${side * 300} -40 L ${side * 140} -40`} reveal={life(f, T.program - 20, 30, T.keduanya - 30, 30)} width={2} pulses={2} />
        ))}

        {/* the process object */}
        <Obj x={procX} y={-40} w={180} h={180} o={proc} s={mix(0.4, 1, proc) * (1 + 0.025 * Math.sin(f * 0.07))} z={0}>
          <div style={{ width: 180, height: 180, borderRadius: 36, background: "linear-gradient(160deg, rgba(255,138,92,0.3), rgba(255,77,18,0.12))", border: `2px solid ${C.orange}`,
            boxShadow: glow(0.8), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="Bot" size={70} color="#fff" stroke={1.5} draw={p(f, 90, 150)} />
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 600, opacity: swap, transform: `translateY(${(1 - swap) * 8}px)`, filter: `blur(${(1 - swap) * 4}px)` }}>
              {f > T.program - 10 ? procWord : ""}
            </div>
          </div>
        </Obj>
        <Obj x={0} y={110} w={600} h={50} o={life(f, T.dijalankan - 6, 24, T.keduanya - 20, 30)}>
          <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
            {[["dijalankan", T.dijalankan], ["diawasi", T.diawasi]].map(([t, at]) => (
              <div key={t as string} style={{ opacity: p(f, (at as number) - 6, (at as number) + 16), transform: `translateY(${(1 - p(f, (at as number) - 6, (at as number) + 20, easeOut)) * 14}px)` }}>
                <Label bg="rgba(255,255,255,0.08)" color="#fff" size={20}>{t}</Label>
              </div>
            ))}
          </div>
        </Obj>

        {/* environment = container around the process */}
        <Obj x={0} y={-10} w={460} h={460} o={cont * (1 - finale * 0.65)} s={mix(1.25, 1, cont)}>
          <ContainerIllo d={cont} size={460} color="rgba(255,255,255,0.8)" open={kf(f, [T.keduanya, T.keduanya + 60, T.karena, T.karena + 40], [0.6, 0.35, 0.35, 0.1])} />
        </Obj>
        <Obj x={0} y={-300} w={500} h={70} o={life(f, T.runtime - 10, 30, T.karena, 30)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, color: "rgba(255,255,255,0.6)", fontSize: 22, fontWeight: 500 }}>
            Runtime
            <div style={{ padding: "8px 18px", borderRadius: 12, border: `1px solid ${C.orange}`, color: "#fff", fontFamily: MONO, fontSize: 26, fontWeight: 500, minWidth: 140, textAlign: "center",
              opacity: f < T.node - 10 ? 0.3 : 1 }}>
              <span style={{ display: "inline-block", opacity: f < T.node - 10 ? 0 : rtSwap, transform: `translateY(${(1 - rtSwap) * -16}px)` }}>{runtime}</span>
            </div>
          </div>
        </Obj>
        {([["Package", "Dependensi", T.dep, -420, 40], ["Cpu", "Sumber daya", T.sumber, 420, -60], ["Wifi", "Koneksi jaringan", T.koneksi, 400, 120]] as const).map(([ic, t, at, x, y]) => {
          const q = life(f, at - 8, 30, T.k1 - 40, 30);
          return (
            <React.Fragment key={t}>
              <Flow f={f} d={`M ${x * 0.55} ${y} L ${x * 0.82} ${y}`} reveal={q} width={2} color="rgba(255,255,255,0.5)" glowOn={false} />
              <Obj x={x} y={y} w={300} h={70} o={1}>
                <div style={{ display: "flex", justifyContent: "center" }}><Chip icon={ic} text={t} q={q} /></div>
              </Obj>
            </React.Fragment>
          );
        })}

        {/* branches to platforms */}
        <Flow f={f} d="M 200 -30 C 420 -30 480 -260 700 -260" reveal={branch * (1 - finale)} color={C.telegram} pulses={3} pulseSpeed={0.008} width={2.5} />
        <Flow f={f} d="M 200 20 C 420 20 480 230 700 230" reveal={p(f, T.wa - 10, T.wa + 30, easeOut) * (1 - finale)} color={C.whatsapp} pulses={3} pulseSpeed={0.008} width={2.5} />
        {([["telegram", T.tg, -260], ["whatsapp", T.wa, 230]] as const).map(([b, at, y]) => {
          const q = p(f, at - 10, at + 24, easeBack) * (1 - finale);
          return (
            <Obj key={b} x={790} y={y} w={180} h={140} o={q} s={mix(0.6, 1, q)}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <BrandLogo brand={b} size={84} />
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 600 }}>{b === "telegram" ? "Telegram" : "WhatsApp"}</div>
              </div>
            </Obj>
          );
        })}
        <Obj x={0} y={290} w={900} h={60} o={life(f, T.konfig - 10, 30, T.kode - 10, 30)}>
          <Words f={f} text="Dengan konfigurasi yang sesuai" at={T.karena} times={[T.karena + 20, T.konfig, T.konfig + 14, T.konfig + 30]} size={30} color="rgba(255,255,255,0.8)" weight={500} accent={[1]} />
        </Obj>

        {/* code still needs adjusting */}
        <Obj x={-600} y={-250} w={460} h={260} o={life(f, T.kode - 14, 30, T.k1 - 30, 30)} ry={18} s={mix(0.9, 1, p(f, T.kode - 14, T.kode + 30, easeOut))}>
          <CodeCard f={f} at={T.kode - 10} w={460} title="bot/config.js" size={18}
            lines={[{ text: "module.exports = {", tone: "kw" }, { text: "  runtime: 'node',", tone: "str" }, { text: "  token: process.env.TOKEN,", tone: "plain" }, { text: "  start: 'node index.js',", tone: "str" }, { text: "};", tone: "kw" }]}
            hiLine={3} hiA={p(f, T.sesuaikan - 10, T.sesuaikan + 20)} hiColor={C.warn} />
        </Obj>
        <Obj x={-600} y={-80} w={460} h={50} o={life(f, T.sesuaikan - 10, 24, T.k1 - 30, 30)}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Label bg="rgba(245,181,68,0.14)" color={C.warn} size={20}><Icon name="Wrench" size={18} color={C.warn} /> tetap perlu disesuaikan</Label>
          </div>
        </Obj>
      </Stage>

      {/* finale: three statements */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `rgba(3,3,3,${finale * 0.55})` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, opacity: finale, transform: `translateY(${(1 - finale) * 30}px)` }}>
          <Check f={f} at={T.k1} text="Lingkungan sesuai." />
          <Check f={f} at={T.k2} text="Proses berjalan." />
          <Check f={f} at={T.k3} text="Bot terhubung." color={C.telegram} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 120 }}>
          <Words f={f} text="Cara kerja aplikasi" at={T.cara} times={[T.cara, T.cara + 10, T.cara + 22]} size={30} color="rgba(255,255,255,0.75)" weight={500} out={T.sgame - 20} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx03 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 20, "panel_pass", 0.3, 0.8), s(o + 110, "settle", 0.45), s(o + T.sgame - 8, "click_glass", 0.3), s(o + T.bot - 8, "click_glass", 0.3, 1.15),
    s(o + T.program - 20, "data_flow", 0.3), s(o + T.proses - 6, "text_in", 0.3), s(o + T.keduanya - 20, "latch", 0.45), s(o + T.keduanya + 30, "settle", 0.35, 1.2),
    s(o + T.node - 8, "click_soft", 0.4), s(o + T.python - 6, "click_soft", 0.4, 1.12), s(o + T.dep - 8, "settle_light", 0.3), s(o + T.sumber - 8, "settle_light", 0.3, 1.1),
    s(o + T.koneksi - 8, "settle_light", 0.3, 0.9), s(o + T.ptero - 10, "data_flow", 0.4), s(o + T.tg - 8, "status_on", 0.25), s(o + T.wa - 8, "status_on", 0.25, 1.06),
    s(o + T.kode - 14, "panel_slide", 0.35), s(o + T.sesuaikan - 8, "status_warn", 0.3), s(o + T.k1 - 30, "swell_bright", 0.3, 0.8),
    s(o + T.k1, "click_glass", 0.35), s(o + T.k2, "click_glass", 0.35, 1.08), s(o + T.k3, "status_on", 0.3),
  ];
};
