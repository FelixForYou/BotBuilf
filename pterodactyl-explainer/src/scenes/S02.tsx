import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, softShadow } from "../lib/theme";
import { rand } from "../lib/anim";
import { arc, breathe, clamp01, DRIFT, GLIDE, inOut, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, GlowWave, Label, Obj, Stage, Words, WarmLight } from "../components/Primitives";
import { MBlur, Sweep, SwapText } from "../components/Motion";
import { Icon } from "../components/Icon";
import { Browser } from "../components/UI";
import { PteroMark } from "../components/Logos";

const L = makeLocal("s02");
const T = {
  ptero: L.c("Pterodactyl"), gratis: L.c("gratis"), open: L.c("open source"), artinya: L.c("Artinya"), kode: L.c("kode"), terbuka: L.c("terbuka"),
  dipelajari: L.c("dipelajari"), dikembangkan: L.c("dikembangkan"), pengembangan: L.c("Pengembangannya"), kontributor: L.c("kontributor"),
  proyek: L.c("Proyek"), sejak: L.c("sejak"), dua: L.c("dua ribu"), tujuan: L.c("Tujuan"), mempermudah: L.c("mempermudah"), game: L.c("server game"),
  web: L.c("antarmuka web"), nyala: L.c("Menyalakan"), mati: L.c("mematikan"), pantau: L.c("memantau"), browser: L.c("browser"),
  lalu: L.c("Lalu"), bagaimana: L.c("bagaimana"), bot: L.c("bot"), end: L.dur,
};
const M = { ptero: -460, code: 0, year: 760, web: 1460 }; // markers along the timeline (world x)
const SWEEP = T.lalu - 20;

const CODE = ["class ServerManager {", "  start(id) { … }", "  stop(id) { … }", "  status(id) { … }", "}"];

const Roll: React.FC<{ f: number; at: number; value: string; size: number }> = ({ f, at, value, size }) => (
  <div style={{ display: "flex", fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: "-0.05em", color: C.ink, height: size * 1.05, overflow: "hidden" }}>
    {value.split("").map((d, i) => {
      const q = clamp01(spr(f, at + i * 4, { stiffness: 120, damping: 17 }));
      const target = Number(d);
      const pos = lerp(target + 10, target + 20, q);
      const speed = Math.abs(lerp(target + 10, target + 20, clamp01(spr(f - 1, at + i * 4, { stiffness: 120, damping: 17 }))) - pos);
      return (
        <div key={i} style={{ height: size * 1.05, overflow: "hidden" }}>
          <div style={{ transform: `translateY(${-pos * size * 1.05}px)`, filter: speed > 0.05 ? `blur(${Math.min(6, speed * 20)}px)` : undefined }}>
            {Array.from({ length: 31 }).map((_, k) => <div key={k} style={{ height: size * 1.05, lineHeight: `${size * 1.05}px` }}>{k % 10}</div>)}
          </div>
        </div>
      );
    })}
  </div>
);

const cam = (f: number) =>
  rig(f, { x: 0, y: 0, z: 0 }, [
    { at: 2, to: { x: M.ptero + 120, z: -240, rx: 14, ry: 8, y: -150 }, feel: GLIDE },
    { at: T.ptero + 20, to: { x: M.ptero + 40, ry: -4 }, feel: DRIFT },
    { at: T.kode - 16, to: { x: M.code, z: -280, rx: 10, ry: -6, y: -170 }, feel: GLIDE },
    { at: T.pengembangan - 6, to: { z: -60, ry: 8, rx: 14, y: -160 }, feel: DRIFT },
    { at: T.proyek - 4, to: { x: M.year, ry: -10, z: -300, rx: 8, y: -150 }, feel: WHIP },
    { at: T.dua + 30, to: { ry: 4, z: -340 }, feel: DRIFT },
    { at: T.tujuan - 10, to: { x: M.web, ry: -8, z: -220, rx: 4, y: -200 }, feel: WHIP },
    { at: T.nyala - 10, to: { y: -220, z: -330, ry: 6 }, feel: GLIDE },
    { at: T.pantau, to: { y: -190, z: -300, ry: -4 }, feel: GLIDE },
  ]);

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 1.1, 1), f);
  const black = f >= SWEEP + 16;

  const tag = (at: number, i: number) => {
    const q = clamp01(spr(f, at - 6, { stiffness: 160, damping: 16 }));
    const [x, y, z] = arc(q, [M.ptero, 0, 0], [M.ptero + (i ? 260 : -200), -260, 200], [M.ptero + (i ? 110 : -90), -110, 40]);
    return { x, y, z, q };
  };
  const contributors = Array.from({ length: 10 }).map((_, i) => {
    const at = T.pengembangan + i * 4;
    const q = clamp01(spr(f, at, { stiffness: 90, damping: 15 }));
    const a0 = rand(i) * Math.PI * 2;
    const orbit = (f - at) * 0.012 + (i / 10) * Math.PI * 2;
    const R = 300 + rand(i + 4) * 40;
    const tx = M.code + Math.cos(orbit) * R, ty = -200 + Math.sin(orbit) * R * 0.32, tz = Math.sin(orbit) * 160;
    const sx = M.code + Math.cos(a0) * 1400, sy = -600 + Math.sin(a0) * 600, sz = 600;
    const leave = out(f, T.proyek - 2 + i * 2, 14);
    return { x: lerp(sx, tx, q) + leave * 900, y: lerp(sy, ty, q), z: lerp(sz, tz, q), o: clamp01(q * 2) * (1 - leave), front: Math.sin(orbit) > 0 };
  });
  const codeUp = spr(f, T.kode - 18, PANEL);
  const browserUp = spr(f, T.tujuan - 6, PANEL);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {!black && (
        <>
          <Stage cam={c} blur={[cd.x, cd.y]}>
            {/* timeline: the folded panel edge from scene 1 */}
            <Obj x={600} y={0} w={4200} h={2}><div style={{ width: 4200, height: 2, background: C.orange, boxShadow: "0 0 12px rgba(255,106,43,0.5)" }} /></Obj>
            {Array.from({ length: 42 }).map((_, i) => (
              <Obj key={i} x={-1500 + i * 100} y={0} w={2} h={14} o={0.22 * clamp01(f / 20)}><div style={{ width: 2, height: 14, background: C.ink }} /></Obj>
            ))}
            {[M.ptero, M.code, M.year, M.web].map((x, i) => {
              const q = clamp01(spr(f, 6 + i * 5, POP));
              return <Obj key={x} x={x} y={0} w={20} h={20} s={q}><div style={{ width: 20, height: 20, borderRadius: 10, background: i === 2 ? C.orange : C.ink, boxShadow: i === 2 ? "0 0 0 8px rgba(255,106,43,0.18)" : undefined }} /></Obj>;
            })}

            {/* Pterodactyl, free + open source */}
            <Obj x={M.ptero} y={-250} w={520} h={80} o={inOut(f, T.ptero - 12, T.proyek - 20, SNAP, 12)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <PteroMark size={54} draw={clamp01((f - T.ptero + 12) / 26)} />
                <SwapText f={f} items={[{ at: T.ptero - 6, text: "Pterodactyl" }]} size={44} weight={700} />
              </div>
            </Obj>
            {[["Gratis", T.gratis], ["Open source", T.open]].map(([t, at], i) => {
              const g = tag(at as number, i);
              const leave = out(f, T.proyek - 24 + i * 4, 12);
              return (
                <Obj key={t as string} x={g.x} y={g.y - leave * 200} z={g.z} w={260} h={60} s={lerp(0.3, 1, g.q)} o={clamp01(g.q * 3) * (1 - leave)}>
                  <div style={{ display: "flex", justifyContent: "center" }}><Label size={24} bg={C.ink} color="#fff">{t}</Label></div>
                </Obj>
              );
            })}

            {/* code card stands up out of the line */}
            <Obj x={M.code} y={-200} w={440} h={240} rx={lerp(-90, 0, codeUp)} o={clamp01(codeUp * 4) * (1 - out(f, T.proyek + 4, 14))} z={-out(f, T.proyek + 4, 14) * 500}
              style={{ transformOrigin: "50% 100%" }}>
              <Card w={440} h={240} tone="light" radius={18} shadowA={1.3}>
                <div style={{ padding: "18px 22px", fontFamily: MONO, fontSize: 19, lineHeight: "36px", color: C.ink }}>
                  {CODE.map((l, i) => {
                    const at = T.kode - 4 + i * 5;
                    const chars = Math.floor(clamp01((f - at) / 10) * l.length);
                    const hi = f > T.terbuka - 4 && i > 0 && i < 4;
                    return <div key={i} style={{ whiteSpace: "pre", color: i === 0 || i === 4 ? C.ember : undefined, background: hi ? `rgba(255,106,43,${0.12 * clamp01((f - T.terbuka + 4 - i * 3) / 8)})` : undefined, borderRadius: 4 }}>{l.slice(0, chars)}</div>;
                  })}
                </div>
                <div style={{ position: "absolute", right: 16, bottom: 12, fontSize: 12, fontFamily: MONO, color: C.gray, letterSpacing: "0.08em" }}>ILUSTRASI</div>
              </Card>
            </Obj>
            {contributors.map((p, i) => (
              <Obj key={i} x={p.x} y={p.y} z={p.z} w={54} h={54} o={p.o}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#fff", boxShadow: softShadow(), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="User" size={26} color={i % 3 === 0 ? C.orange : C.ink} />
                </div>
              </Obj>
            ))}

            {/* 2015 */}
            <Obj x={M.year} y={-190} w={760} h={280} o={inOut(f, T.sejak - 14, T.tujuan - 8, SNAP, 12)} z={-out(f, T.tujuan - 8, 12) * 300}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <SwapText f={f} items={[{ at: T.proyek + 2, text: "Proyek ini" }, { at: T.sejak - 8, text: "Open source sejak" }]} size={24} weight={600} color={C.gray} spacing={0.14} />
                <Roll f={f} at={T.dua - 26} value="2015" size={190} />
              </div>
            </Obj>
            {f > T.sejak - 20 && (
              <Obj x={M.year} y={0} w={120} h={120}>
                {[0, 1].map((k) => {
                  const ph = ((f - T.sejak + 20 + k * 30) % 60) / 60;
                  return <div key={k} style={{ position: "absolute", left: 60 - 60 * ph, top: 60 - 60 * ph, width: 120 * ph, height: 120 * ph, borderRadius: "50%", border: `2px solid ${C.orange}`, opacity: 1 - ph }} />;
                })}
              </Obj>
            )}

            {/* browser rises from the marker */}
            <Obj x={M.web} y={lerp(0, -250, browserUp)} w={780} h={450} s={lerp(0.04, 1, browserUp)} rx={lerp(30, 0, browserUp)} ry={lerp(-25, -6, browserUp)}>
              <div style={{ boxShadow: softShadow(1.5), borderRadius: 16 }}>
                <Browser w={780} h={450} url="panel.contoh.id">
                  <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ fontSize: 15, color: C.gray, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: clamp01((f - T.tujuan - 10) / 10) }}>Proses server</div>
                    {([["Power", "Nyalakan", T.nyala, C.ok], ["Square", "Matikan", T.mati, C.err], ["Activity", "Pantau", T.pantau, C.orange]] as const).map(([ic, t, at, col], i) => {
                      const rowIn = clamp01(spr(f, T.tujuan + 14 + i * 5, SNAP));
                      const on = clamp01(spr(f, at - 8, POP));
                      return (
                        <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, height: 80, borderRadius: 14, padding: "0 20px", background: on > 0.02 ? "#fff" : C.paper,
                          border: `1.5px solid ${on > 0.02 ? col : "rgba(0,0,0,0.05)"}`, boxShadow: on > 0.02 ? `0 12px 30px ${col}33` : "none", opacity: rowIn,
                          transform: `translateX(${(1 - rowIn) * 60}px) scale(${1 + on * 0.025 - Math.max(0, on - 1) * 0.5})` }}>
                          <Icon name={ic} size={32} color={on > 0.02 ? col : C.gray} draw={Math.max(0.35, Math.min(1, on))} />
                          <div style={{ fontSize: 23, fontWeight: 600, color: C.ink }}>{t}</div>
                          <div style={{ flex: 1 }} />
                          {ic === "Activity" ? (
                            <svg width={170} height={44}>
                              <path d={Array.from({ length: 44 }).map((_, k) => `${k ? "L" : "M"}${k * 4},${22 + Math.sin(k * 0.55 + f * 0.2) * 12 * Math.min(1, on)}`).join(" ")} stroke={col} strokeWidth={2.4} fill="none" />
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
          </Stage>

          <AbsoluteFill style={{ alignItems: "center" }}>
            <div style={{ position: "absolute", top: 830 }}>
              <SwapText f={f} items={[{ at: T.kode - 6, text: "Kode sumber terbuka" }, { at: T.pengembangan - 4, text: "Dikembangkan bersama kontributor" }]} size={32}
                style={{ opacity: 1 - out(f, T.proyek - 6, 10) }} />
            </div>
            <div style={{ position: "absolute", top: 830 }}>
              <Words f={f} text="Berawal dari pengelolaan server game." at={T.mempermudah} times={[T.mempermudah - 10, T.mempermudah, T.mempermudah + 10, T.game, T.game + 10]} size={38} accent={[3, 4]} out={SWEEP - 6} outLen={10} />
            </div>
            <div style={{ position: "absolute", top: 892 }}>
              <Words f={f} text="lewat antarmuka web" at={T.web} stagger={4} size={22} color={C.gray} weight={500} out={SWEEP - 6} outLen={10} />
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* black world after a panel passes the lens */}
      {black && (
        <AbsoluteFill style={{ background: C.black }}>
          <WarmLight f={f} o={0.25} y={640} r={800} />
          <GlowWave f={f} y={640} amp={lerp(60, 0, clamp01(spr(f, T.end - 34, GLIDE)))} reveal={clamp01((f - SWEEP - 10) / 30)} speed={0.04}
            o={1 - clamp01((f - T.end + 16) / 14)} />
          {/* the wave contracts into the dot that becomes scene 3's process object */}
          <div style={{ position: "absolute", left: 960 - 14, top: 640 - 14 - clamp01(spr(f, T.end - 26, SNAP)) * 100, width: 28, height: 28, borderRadius: 14, background: C.orange,
            boxShadow: "0 0 30px rgba(255,106,43,0.9), 0 0 80px rgba(255,77,18,0.6)", opacity: clamp01((f - T.end + 30) / 8), transform: `scale(${clamp01(spr(f, T.end - 30, POP))})` }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <Words f={f} text="Lalu, bagaimana dengan bot?" at={T.lalu} times={[T.lalu + 2, T.bagaimana, T.bagaimana + 14, T.bot]} size={48} color="#fff" accent={[3]} out={T.end - 30} outLen={12} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      <Sweep f={f} at={SWEEP} half="in" dir="left" />
      <Sweep f={f} at={SWEEP + 16} half="out" dir="left" />
    </AbsoluteFill>
  );
};

export const sfx02 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 2, "whip_low", 0.3, 1.1), s(o + 6, "stack_ticks", 0.3), s(o + T.ptero - 6, "scramble", 0.25),
    s(o + T.gratis - 6, "msg_out", 0.25, 1.3), s(o + T.gratis + 8, "impact_glass", 0.3), s(o + T.open - 6, "msg_out", 0.25, 1.4), s(o + T.open + 8, "impact_glass", 0.3, 1.1),
    s(o + T.kode - 18, "flip", 0.35), s(o + T.kode - 2, "type_short", 0.28), s(o + T.terbuka - 4, "data_tick", 0.25),
    s(o + T.pengembangan, "stack_ticks", 0.3, 0.9), s(o + T.pengembangan + 20, "data_flow", 0.22),
    s(o + T.proyek - 4, "whip_fast", 0.4), s(o + T.dua - 26, "scramble", 0.3, 0.8), s(o + T.dua + 4, "impact_soft", 0.35),
    s(o + T.tujuan - 10, "whip_fast", 0.38, 0.9), s(o + T.tujuan - 4, "panel_lift", 0.3, 1.2), s(o + T.tujuan + 14, "stack_ticks", 0.25, 1.1),
    s(o + T.nyala - 8, "click_low", 0.45), s(o + T.mati - 8, "click_low", 0.45, 0.9), s(o + T.pantau - 8, "data_tick", 0.35),
    s(o + SWEEP, "lens_pass", 0.45), s(o + SWEEP + 26, "line_draw", 0.3, 0.9), s(o + T.bot - 4, "text_in", 0.25), s(o + T.end - 34, "morph_down", 0.35),
  ];
};
