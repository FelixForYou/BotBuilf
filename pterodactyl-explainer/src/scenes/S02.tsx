import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, softShadow } from "../lib/theme";
import { easeBack, easeIn, easeIO, easeOut, kf, life, mix, p, rand } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, GlowWave, Label, Obj, Stage, Words } from "../components/Primitives";
import { Icon } from "../components/Icon";
import { Browser } from "../components/UI";
import { PteroMark } from "../components/Logos";

const L = makeLocal("s02");
const T = {
  ptero: L.c("Pterodactyl"), gratis: L.c("gratis"), open: L.c("open source"), artinya: L.c("Artinya"), kode: L.c("kode"), terbuka: L.c("terbuka"),
  dipelajari: L.c("dipelajari"), dikembangkan: L.c("dikembangkan"), pengembangan: L.c("Pengembangannya"), kontributor: L.c("kontributor"),
  proyek: L.c("Proyek"), sejak: L.c("sejak"), dua: L.c("dua ribu"), tujuan: L.c("Tujuan"), mempermudah: L.c("mempermudah"), game: L.c("server game"),
  web: L.c("antarmuka web"), nyala: L.c("Menyalakan"), mati: L.c("mematikan"), pantau: L.c("memantau"), browser: L.c("browser"),
  lalu: L.c("Lalu"), bot: L.c("bot"), end: L.dur,
};

const CODE = ["class ServerManager {", "  start(id) { … }", "  stop(id) { … }", "  status(id) { … }", "}"];

/** Digit roller for the year. */
const Roll: React.FC<{ f: number; at: number; value: string; size: number }> = ({ f, at, value, size }) => (
  <div style={{ display: "flex", fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: "-0.05em", color: C.ink, height: size * 1.05, overflow: "hidden" }}>
    {value.split("").map((d, i) => {
      const q = p(f, at + i * 7, at + i * 7 + 50, easeOut);
      const target = Number(d);
      const from = (target + 6) % 10;
      const pos = mix(from + 10 * (i % 2 ? 1 : 2), target + 20, q);
      return (
        <div key={i} style={{ height: size * 1.05, overflow: "hidden" }}>
          <div style={{ transform: `translateY(${-(pos % 30) * size * 1.05}px)`, filter: `blur(${(1 - q) * 4}px)` }}>
            {Array.from({ length: 30 }).map((_, k) => <div key={k} style={{ height: size * 1.05, lineHeight: `${size * 1.05}px` }}>{k % 10}</div>)}
          </div>
        </div>
      );
    })}
  </div>
);

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const camX = kf(f, [0, T.artinya - 20, T.proyek - 30, T.sejak + 20, T.tujuan - 20, T.mempermudah + 10], [-420, -380, 0, 640, 640, 1320]);
  const camZ = kf(f, [0, T.artinya, T.proyek, T.sejak + 40, T.tujuan, T.nyala, T.lalu, T.end], [-220, -280, -180, -340, -220, -300, -220, 1100]);
  const camRy = kf(f, [0, T.proyek, T.sejak + 40, T.tujuan, T.lalu], [4, -3, 3, -4, 0]);
  const toBlack = p(f, T.lalu - 10, T.lalu + 40, easeIn);
  const lineReveal = mix(0.55, 1, p(f, 0, 90, easeOut));

  const contributors = Array.from({ length: 9 }).map((_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const r = 250 + rand(i) * 60;
    return { x: Math.cos(a) * r, y: -170 + Math.sin(a) * r * 0.45, t: T.pengembangan + i * 7 };
  });

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <Stage cam={{ x: camX, z: camZ, ry: camRy, y: -40 }}>
        {/* timeline axis inherited from scene 1's flattening panel */}
        <Obj x={450} y={0} w={3400} h={2}>
          <div style={{ width: `${lineReveal * 100}%`, height: 2, background: C.orange, marginLeft: `${(1 - lineReveal) * 50}%`, boxShadow: "0 0 12px rgba(255,106,43,0.5)" }} />
        </Obj>
        {/* moving ticks along the axis keep the line alive */}
        {Array.from({ length: 34 }).map((_, i) => (
          <Obj key={i} x={-1200 + i * 100 + ((f * 0.4) % 100)} y={0} w={2} h={12} o={0.25 * lineReveal}><div style={{ width: 2, height: 12, background: C.ink }} /></Obj>
        ))}

        {/* A: free + open source tags */}
        <Obj x={-420} y={-150} w={600} h={120} o={life(f, T.ptero - 10, 30, T.proyek, 40)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: p(f, T.ptero - 10, T.ptero + 20) }}>
              <PteroMark size={46} draw={p(f, T.ptero - 10, T.ptero + 50)} />
              <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", color: C.ink }}>Pterodactyl</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {[["Gratis", T.gratis], ["Open source", T.open]].map(([t, at]) => {
                const q = p(f, (at as number) - 6, (at as number) + 24, easeBack);
                return <div key={t as string} style={{ transform: `scale(${q}) translateY(${(1 - q) * 20}px)`, opacity: q }}><Label size={22} bg={C.ink} color="#fff">{t}</Label></div>;
              })}
            </div>
          </div>
        </Obj>
        <Obj x={-420} y={0} w={18} h={18} o={lineReveal}><div style={{ width: 18, height: 18, borderRadius: "50%", background: C.orange, boxShadow: "0 0 0 6px rgba(255,106,43,0.18)" }} /></Obj>

        {/* B: open source code + contributors */}
        <Obj x={0} y={-190} w={420} h={230} o={life(f, T.kode - 14, 30, T.sejak, 40)} ry={kf(f, [T.kode, T.proyek], [-14, 10])} s={mix(0.85, 1, p(f, T.kode - 14, T.kode + 30, easeOut))}>
          <Card w={420} h={230} tone="light" radius={18}>
            <div style={{ padding: "18px 22px", fontFamily: MONO, fontSize: 18, lineHeight: "34px", color: C.ink }}>
              {CODE.map((l, i) => (
                <div key={i} style={{ opacity: p(f, T.kode + i * 6, T.kode + i * 6 + 20), whiteSpace: "pre", color: i === 0 || i === 4 ? C.ember : undefined }}>{l}</div>
              ))}
            </div>
            <div style={{ position: "absolute", right: 16, bottom: 12, fontSize: 12, fontFamily: MONO, color: C.gray, letterSpacing: "0.08em" }}>ILUSTRASI</div>
          </Card>
        </Obj>
        <Obj x={0} y={70} w={600} h={60} o={life(f, T.terbuka - 6, 24, T.proyek - 10, 30)}>
          <Words f={f} text="Kode sumber terbuka" at={T.kode} times={[T.kode, T.kode + 10, T.terbuka]} size={30} accent={[2]} />
        </Obj>
        {contributors.map((c, i) => {
          const q = life(f, c.t, 30, T.sejak - 10 + i * 2, 30);
          return (
            <React.Fragment key={i}>
              <Obj x={c.x * q} y={-190 + (c.y + 190) * q} w={52} h={52} o={q}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff", boxShadow: softShadow(), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="User" size={26} color={i % 3 === 0 ? C.orange : C.ink} />
                </div>
              </Obj>
            </React.Fragment>
          );
        })}
        <Obj x={0} y={0} w={18} h={18} o={lineReveal}><div style={{ width: 18, height: 18, borderRadius: "50%", background: C.ink }} /></Obj>

        {/* C: 2015 */}
        <Obj x={640} y={-150} w={700} h={260} o={life(f, T.dua - 30, 30, T.mempermudah - 10, 40)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.gray, letterSpacing: "0.2em", textTransform: "uppercase", opacity: p(f, T.sejak - 10, T.sejak + 20) }}>Open source sejak</div>
            <Roll f={f} at={T.dua - 24} value="2015" size={180} />
          </div>
        </Obj>
        <Obj x={640} y={0} w={26} h={26} o={p(f, T.sejak - 20, T.sejak + 10)} s={1 + 0.15 * Math.sin(f * 0.1)}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.orange, boxShadow: "0 0 0 10px rgba(255,106,43,0.15), 0 0 30px rgba(255,106,43,0.6)" }} />
        </Obj>

        {/* D/E: browser-based management (no game shown) */}
        <Obj x={1320} y={-170 + (1 - p(f, T.tujuan - 20, T.tujuan + 40, easeOut)) * 80} w={760} h={440} o={p(f, T.tujuan - 20, T.tujuan + 30)} rx={kf(f, [T.tujuan, T.nyala], [12, 0])} ry={kf(f, [T.tujuan, T.lalu], [-10, 6])}>
          <div style={{ boxShadow: softShadow(1.4), borderRadius: 16 }}>
            <Browser w={760} h={440} url="panel.contoh.id">
              <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 15, color: C.gray, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Proses server</div>
                {([["Power", "Nyalakan", T.nyala, C.ok], ["Square", "Matikan", T.mati, C.err], ["Activity", "Pantau", T.pantau, C.orange]] as const).map(([ic, t, at, col], i) => {
                  const on = p(f, at - 8, at + 18, easeOut);
                  return (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, height: 76, borderRadius: 14, padding: "0 20px", background: on > 0.01 ? `rgba(255,255,255,1)` : C.paper,
                      border: `1.5px solid ${on > 0.01 ? col : "rgba(0,0,0,0.05)"}`, boxShadow: on > 0.01 ? `0 10px 30px ${col}33` : "none", opacity: p(f, T.tujuan + 20 + i * 10, T.tujuan + 40 + i * 10),
                      transform: `translateX(${(1 - p(f, T.tujuan + 20 + i * 10, T.tujuan + 50 + i * 10, easeOut)) * 40}px) scale(${1 + on * 0.02})` }}>
                      <Icon name={ic} size={30} color={on > 0.01 ? col : C.gray} draw={Math.max(0.3, on)} />
                      <div style={{ fontSize: 22, fontWeight: 600, color: C.ink }}>{t}</div>
                      <div style={{ flex: 1 }} />
                      {ic === "Activity" ? (
                        <svg width={160} height={40}>
                          <path d={Array.from({ length: 40 }).map((_, k) => `${k ? "L" : "M"}${k * 4},${20 + Math.sin(k * 0.5 + f * 0.15) * 10 * on}`).join(" ")} stroke={col} strokeWidth={2.2} fill="none" />
                        </svg>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 600, color: on > 0.5 ? col : C.gray }}>
                          <div style={{ width: 12, height: 12, borderRadius: 6, background: on > 0.5 ? col : "#d4d4d4", boxShadow: on > 0.5 ? `0 0 10px ${col}` : "none" }} />
                          {ic === "Power" ? "aktif" : "berhenti"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Browser>
          </div>
        </Obj>
        <Obj x={1320} y={0} w={18} h={18} o={lineReveal}><div style={{ width: 18, height: 18, borderRadius: "50%", background: C.ink }} /></Obj>
        <Obj x={1320} y={150} w={1000} h={60} o={life(f, T.mempermudah - 10, 30, T.lalu - 20, 30)}>
          <Words f={f} text="Berawal dari pengelolaan server game." at={T.mempermudah} times={[T.mempermudah - 6, T.mempermudah + 6, T.mempermudah + 16, T.game, T.game + 10]} size={36} accent={[3, 4]} />
        </Obj>
        <Obj x={1320} y={215} w={800} h={40} o={life(f, T.browser - 10, 30, T.lalu - 20, 30)}>
          <Words f={f} text="lewat antarmuka web" at={T.web} size={22} color={C.gray} weight={500} />
        </Obj>
      </Stage>

      {/* F: black flip + question */}
      <AbsoluteFill style={{ background: C.black, opacity: toBlack }}>
        <GlowWave f={f} y={640} amp={50} reveal={p(f, T.lalu + 10, T.end - 10, easeOut)} o={0.85} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Words f={f} text="Lalu, bagaimana dengan bot?" at={T.lalu} times={[T.lalu + 6, T.lalu + 40, T.lalu + 56, T.bot]} size={46} color="#fff" accent={[3]} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx02 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 4, "line_draw", 0.35, 0.9), s(o + T.gratis - 4, "click_soft", 0.4), s(o + T.open - 4, "click_soft", 0.4, 1.1),
    s(o + T.kode - 14, "panel_slide", 0.35), s(o + T.kode + 4, "type_short", 0.3),
    s(o + T.pengembangan, "data_tick", 0.3), s(o + T.pengembangan + 30, "data_tick", 0.25, 1.2),
    s(o + T.proyek - 30, "panel_pass", 0.35, 0.9), s(o + T.dua - 24, "data_flow", 0.35, 0.8), s(o + T.dua + 26, "settle_light", 0.35),
    s(o + T.tujuan - 24, "panel_slide", 0.4, 0.85), s(o + T.nyala - 8, "click_low", 0.45), s(o + T.mati - 8, "click_low", 0.45, 0.9), s(o + T.pantau - 8, "data_tick", 0.35),
    s(o + T.lalu - 14, "swell_deep", 0.5, 1.1), s(o + T.bot - 4, "text_in", 0.3),
  ];
};
