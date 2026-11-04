import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "../lib/theme";
import { arc, breathe, clamp01, DRIFT, GLIDE, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, Flow, Label, LightStreak, Obj, Stage, WarmLight } from "../components/Primitives";
import { MBlur, Sweep, SwapText } from "../components/Motion";
import { NetworkIllo, ServerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo, PteroMark } from "../components/Logos";
import { CodeCard, ConsoleView, Line } from "../components/UI";

const L = makeLocal("s09");
const T = {
  lalu: L.c("Lalu"), bisa: L.c("apa yang bisa"), tidak: L.c("tidak bisa"), misal: L.c("Misalnya"), error: L.c("error"), console: L.c("console"),
  bantu: L.c("Panel membantu"), lihat: L.c("melihat masalah"), kendali: L.c("mengendalikan"), tapi: L.c("tapi perbaikannya"), kodeapp: L.c("kode aplikasi"),
  juga: L.c("Panel juga"), otomatis: L.c("otomatis"), membuat: L.c("membuat bot"), ram: L.c("ram gratis"), lang: L.c("Kelangsungan"), mesin: L.c("mesin server"),
  jaringan: L.c("jaringan"), layanan: L.c("layanan platformnya"), tidakada: L.c("Tidak ada panel"), selalu: L.c("selalu aktif"), kendala: L.c("kendala"),
  software: L.c("Software"), gratis: L.c("gratis", 1), open: L.c("open source"), infra: L.c("infrastruktur hosting"), biaya: L.c("berbiaya"), end: L.dur,
};
const SWEEP = T.lang - 30; // vertical pass in front of the lens: white -> black
const SPLIT = T.end - 36; // cost cards split past the camera -> scene 10

const logs: Line[] = [
  { t: T.misal - 10, text: "[info] pesan masuk: /jadwal", kind: "in" },
  { t: T.misal + 6, text: "[info] memproses perintah jadwal", kind: "info" },
  { t: T.error - 8, text: "[error] TypeError: Cannot read properties of undefined (reading 'tanggal')", kind: "err" },
  { t: T.error + 10, text: "    at formatAgenda (commands/jadwal.js:7:24)", kind: "dim" },
  { t: T.kendali - 4, text: "[panel] restart diminta", kind: "dim" },
  { t: T.kendali + 30, text: "[info] Asisten Bot dimulai ulang", kind: "info" },
];

const camW = (f: number) =>
  rig(f, { x: 0, y: 0, z: 0 }, [
    { at: T.misal - 20, to: { z: -60, ry: -4, rx: 3 }, feel: GLIDE },
    { at: T.error + 4, to: { z: -300, x: -120, y: -10, ry: 4 }, feel: WHIP },
    { at: T.lihat + 10, to: { z: -220, x: -40, ry: -3 }, feel: DRIFT },
    { at: T.tapi - 16, to: { z: -120, x: 0, y: 0, ry: 6 }, feel: GLIDE },
    { at: T.juga - 16, to: { z: 40, ry: -4, rx: 2 }, feel: GLIDE },
  ]);
const camB = (f: number) =>
  rig(f, { x: 0, y: 0, z: 400, rx: 8 }, [
    { at: SWEEP + 10, to: { z: 60, rx: 4 }, feel: GLIDE },
    { at: T.mesin - 10, to: { x: -260, ry: 8 }, feel: GLIDE },
    { at: T.jaringan - 10, to: { x: 0, ry: 0 }, feel: WHIP },
    { at: T.layanan - 10, to: { x: 260, ry: -8 }, feel: WHIP },
    { at: T.tidakada - 6, to: { x: 0, ry: 0, z: 200, rx: 6 }, feel: GLIDE },
    { at: T.software - 24, to: { z: -40, rx: 2 }, feel: GLIDE },
    { at: SPLIT, to: { z: -500 }, feel: WHIP },
  ]);

export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const black = f >= SWEEP + 16;
  const { v: cw, d: cwd } = vel((ff) => breathe(camW(ff), ff, 1, 9), f);
  const { v: cb, d: cbd } = vel((ff) => breathe(camB(ff), ff, 0.9, 10), f);
  const lineW = lerp(160, 560, clamp01(spr(f, 0, { stiffness: 120, damping: 17 })));
  const consoleQ = clamp01(spr(f, T.misal - 22, { stiffness: 120, damping: 18 }));
  const toCode = clamp01(spr(f, T.tapi - 18, PANEL));
  const fixQ = clamp01(spr(f, T.kodeapp - 8, SNAP));
  const notQ = (at: number) => clamp01(spr(f, at - 12, { stiffness: 150, damping: 16 }));
  const notOut = out(f, SWEEP - 14, 12);
  const split = out(f, SPLIT, 26);
  const errRow = (ff: number) => {
    const t = clamp01(spr(ff, T.tapi - 18, { stiffness: 110, damping: 18 }));
    const [x, y, z] = arc(t, [-30, -40, 30], [-120, -260, 340], [10, 5, 60]);
    return { x, y, z, t };
  };
  const { v: er, d: erd } = vel(errRow, f);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {!black && (
        <AbsoluteFill>
          <Stage cam={cw} blur={[cwd.x, cwd.y]}>
            {/* the underline from scene 8 grows into the top edge of the console */}
            <Obj x={0} y={lerp(60, -190, consoleQ)} w={lerp(lineW, 1100, consoleQ)} h={lerp(6, 330, consoleQ)} z={-toCode * 400} o={1 - clamp01(toCode * 1.6)}>
              <div style={{ width: "100%", height: "100%", borderRadius: lerp(3, 20, consoleQ), background: consoleQ < 0.05 ? `linear-gradient(90deg, ${C.coral}, ${C.ember})` : "linear-gradient(160deg,#1d1f23,#16171a)",
                boxShadow: consoleQ > 0.05 ? "0 30px 80px rgba(0,0,0,0.3), 0 0 60px rgba(255,106,43,0.25)" : undefined, overflow: "hidden", position: "relative" }}>
                {consoleQ > 0.6 && (
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, opacity: clamp01((consoleQ - 0.6) * 3) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 19, fontWeight: 600 }}><PteroMark size={24} /> Console · asisten-bot</div>
                    <ConsoleView f={f} lines={logs} w={1060} h={250} size={19} highlight={2} hiA={clamp01((f - T.error) / 8) * (1 - toCode)} />
                  </div>
                )}
              </div>
            </Obj>
            {/* the highlighted error row detaches and becomes the buggy line of code */}
            <Obj x={er.x} y={er.y - 190 * (1 - er.t)} z={er.z} w={900} h={36} o={f > T.tapi - 18 && er.t < 0.97 ? 1 : 0} s={lerp(1, 0.9, er.t)}>
              <MBlur dx={erd.x - cwd.x} dy={erd.y}>
                <div style={{ padding: "4px 16px", borderRadius: 6, background: "rgba(240,82,79,0.22)", border: `1px solid ${C.err}`, color: "#ff8f8c", fontFamily: MONO, fontSize: 19, whiteSpace: "nowrap" }}>
                  return agenda.tanggal + ': ' + agenda.isi;
                </div>
              </MBlur>
            </Obj>
            <Obj x={0} y={-30} w={900} h={330} o={clamp01((toCode - 0.3) * 2) * (1 - notOut)} s={lerp(0.85, 1, toCode)} ry={lerp(-25, 0, toCode)} z={-out(f, T.juga - 16, 14) * 700}>
              <CodeCard f={f} at={T.tapi - 10} w={900} title="commands/jadwal.js" size={21} hiLine={fixQ > 0.5 ? 2 : 3} hiA={1} hiColor={fixQ > 0.5 ? C.ok : C.err}
                lines={[
                  { text: "function formatAgenda(agenda) {", tone: "kw" },
                  { text: "  // agenda bisa kosong", tone: "cm" },
                  { text: fixQ > 0.2 ? "  if (!agenda) return 'Belum ada agenda.';" : "", tone: "fix" },
                  { text: "  return agenda.tanggal + ': ' + agenda.isi;", tone: fixQ > 0.5 ? "plain" : "err" },
                  { text: "}", tone: "kw" },
                ]} />
            </Obj>
            <Obj x={0} y={190} w={900} h={50} s={spr(f, T.kodeapp - 8, POP) * (1 - out(f, T.juga - 16, 10))}>
              <div style={{ display: "flex", justifyContent: "center" }}><Label size={22} bg="rgba(10,10,12,0.06)" color={C.ink}><Icon name="Wrench" size={20} color={C.orange} /> Perbaikan ada di kode aplikasi</Label></div>
            </Obj>
            {[["tidak otomatis membuat bot", T.membuat, -150], ["tidak menyediakan RAM gratis", T.ram, 0]].map(([t, at, y], i) => {
              const q = notQ(at as number);
              const strike = clamp01((f - (at as number) - 6) / 16);
              return (
                <Obj key={t as string} x={lerp(i ? 900 : -900, 0, q)} y={(y as number) - 20} z={lerp(-300, 0, q)} w={780} h={110} o={clamp01(q * 3) * (1 - notOut)} rz={(1 - q) * (i ? 6 : -6)}>
                  <Card w={780} h={110} tone="light" radius={22} shadowA={1.4}>
                    <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 20, padding: "0 30px", fontSize: 30, fontWeight: 600, color: C.ink, position: "relative" }}>
                      <Icon name="Ban" size={38} color={C.err} draw={strike} />
                      Panel {t}
                    </div>
                  </Card>
                </Obj>
              );
            })}
          </Stage>
          <AbsoluteFill style={{ alignItems: "center" }}>
            <div style={{ position: "absolute", top: 470, opacity: 1 - out(f, T.misal - 24, 10), transform: `translateY(${-out(f, T.misal - 24, 10) * 60}px)` }}>
              <SwapText f={f} items={[{ at: 2, text: "Apa yang bisa?" }, { at: T.tidak - 4, text: "Bisa, dan tidak bisa." }]} size={54} />
            </div>
            <div style={{ position: "absolute", top: 640, display: "flex", gap: 18, opacity: 1 - out(f, T.misal - 24, 10) }}>
              <div style={{ transform: `scale(${spr(f, T.tidak + 10, POP)})` }}><Label size={22} bg="rgba(62,207,142,0.14)" color="#1d8a5a"><Icon name="Check" size={20} color="#1d8a5a" /> dibantu panel</Label></div>
              <div style={{ transform: `scale(${spr(f, T.tidak + 16, POP)})` }}><Label size={22} bg="rgba(240,82,79,0.12)" color="#c23a37"><Icon name="X" size={20} color="#c23a37" /> di luar panel</Label></div>
            </div>
            <div style={{ position: "absolute", top: 790, opacity: 1 - out(f, T.tapi - 14, 10) }}>
              <SwapText f={f} items={[{ at: T.lihat - 6, text: "Pemantauan lebih mudah." }, { at: T.kendali - 4, text: "Kontrol lebih jelas." }]} size={36} />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {black && (
        <AbsoluteFill style={{ background: C.black }}>
          <LightStreak f={f} o={0.5} angle={-26} seed={12} />
          <WarmLight f={f} o={0.55} y={560} r={1100} seed={13} />
          <Stage cam={cb} blur={[cbd.x, cbd.y]}>
            {([["Mesin server", T.mesin, -520], ["Jaringan", T.jaringan, 0], ["Layanan platform", T.layanan, 520]] as const).map(([t, at, x], i) => {
              const fn = (ff: number) => {
                const q = clamp01(spr(ff, at - 14, { stiffness: 140, damping: 17 }));
                const lo = out(ff, T.software - 34 + i * 3, 14);
                const [px, py, pz] = arc(q, [x * 2.4, 500, -900], [x * 1.4, -300, -200], [x, -60, 0]);
                return { x: px + lo * (x === 0 ? 0 : Math.sign(x) * 1400), y: py - lo * (x === 0 ? 900 : 0), z: pz + lo * 600 };
              };
              const { v, d } = vel(fn, f);
              const q = clamp01(spr(f, at - 14, SNAP));
              return (
                <Obj key={t} x={v.x} y={v.y} z={v.z} w={340} h={320} o={clamp01(q * 3)}>
                  <MBlur dx={d.x - cbd.x} dy={d.y}>
                    <Card w={340} h={320} tone="dark" radius={26} glowA={0.4}>
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, color: "#fff" }}>
                        {i === 0 && <ServerIllo d={clamp01((f - at + 10) / 20)} f={f} size={150} />}
                        {i === 1 && <NetworkIllo d={clamp01((f - at + 10) / 20)} f={f} size={150} />}
                        {i === 2 && <div style={{ display: "flex", gap: 14 }}><BrandLogo brand="telegram" size={70} /><BrandLogo brand="whatsapp" size={70} /></div>}
                        <div style={{ fontSize: 25, fontWeight: 700 }}>{t}</div>
                      </div>
                    </Card>
                  </MBlur>
                </Obj>
              );
            })}
            {/* links: they part for a moment ("tanpa kendala" is not guaranteed) and reconnect */}
            {[[-350, -170, T.jaringan], [170, 350, T.layanan]].map(([a, b, at], i) => {
              const gap = Math.sin(clamp01((f - T.selalu + 4) / 50) * Math.PI) * 40;
              return <Flow key={i} f={f} d={`M ${a + (i ? gap : 0)} -60 L ${b - (i ? 0 : gap)} -60`} reveal={clamp01((f - at + 2) / 12) * (1 - out(f, T.software - 34, 10))} color={gap > 8 ? C.err : C.coral} pulses={gap > 8 ? 0 : 2} width={2.5} />;
            })}
            {([["Software panel", "gratis & open source (MIT)", -300, T.software, C.ok], ["Infrastruktur hosting", "bisa memiliki biaya", 300, T.infra, C.warn]] as const).map(([a, b, x, at, col], i) => {
              const fn = (ff: number) => {
                const q = clamp01(spr(ff, at - 12, { stiffness: 140, damping: 17 }));
                const sp = out(ff, SPLIT + i * 2, 24);
                return { x: lerp(x * 3, x, q) + sp * Math.sign(x) * 1700, y: -30, z: lerp(-600, 0, q) + sp * 900 };
              };
              const { v, d } = vel(fn, f);
              const q = clamp01(spr(f, at - 12, SNAP));
              return (
                <Obj key={a} x={v.x} y={v.y} z={v.z} w={520} h={300} o={clamp01(q * 3)} ry={x < 0 ? 8 : -8}>
                  <MBlur dx={d.x - cbd.x} dy={d.y}>
                    <Card w={520} h={300} tone="dark" radius={28} glowA={0.45}>
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, color: "#fff", textAlign: "center" }}>
                        {i === 0 ? <PteroMark size={70} draw={clamp01((f - at + 8) / 18)} /> : <Icon name="Coins" size={64} color={col} draw={clamp01((f - at + 8) / 18)} />}
                        <div style={{ fontSize: 30, fontWeight: 700 }}>{a}</div>
                        <div style={{ fontSize: 22, color: col, fontWeight: 600 }}>{b}</div>
                      </div>
                    </Card>
                  </MBlur>
                </Obj>
              );
            })}
          </Stage>
          <AbsoluteFill style={{ alignItems: "center" }}>
            <div style={{ position: "absolute", top: 820 }}>
              <SwapText f={f} items={[{ at: T.lang - 6, text: "Tetap bergantung pada aplikasi dan infrastrukturnya.", color: "#fff" }, { at: T.tidakada - 6, text: "Tidak ada jaminan bot selalu aktif tanpa kendala.", color: "#fff" }]} size={34}
                style={{ opacity: 1 - out(f, T.software - 30, 10) }} />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      <Sweep f={f} at={SWEEP} half="in" dir="up" />
      <Sweep f={f} at={SWEEP + 16} half="out" dir="up" />
    </AbsoluteFill>
  );
};

export const sfx09 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o, "morph_up", 0.3, 1.2), s(o + 2, "scramble", 0.22), s(o + T.tidak - 4, "scramble", 0.22, 0.9), s(o + T.tidak + 10, "impact_glass", 0.25), s(o + T.tidak + 16, "impact_glass", 0.25, 1.1),
    s(o + T.misal - 22, "morph_up", 0.35, 0.9), s(o + T.misal - 4, "type_short", 0.25), s(o + T.error - 8, "error_blip", 0.45), s(o + T.error + 4, "whip_fast", 0.3, 0.9),
    s(o + T.lihat - 6, "scramble", 0.2), s(o + T.kendali - 4, "click_low", 0.4), s(o + T.tapi - 18, "whip_air", 0.32), s(o + T.tapi + 6, "impact_card", 0.3),
    s(o + T.kodeapp - 8, "type_long", 0.28), s(o + T.kodeapp + 20, "status_on", 0.2), s(o + T.juga - 16, "whip_low", 0.3),
    s(o + T.membuat - 12, "whip_fast", 0.28, 1.1), s(o + T.membuat, "impact_card", 0.3), s(o + T.ram - 12, "whip_fast", 0.28, 0.95), s(o + T.ram, "impact_card", 0.3, 1.1),
    s(o + SWEEP, "lens_pass", 0.45, 0.9), s(o + T.mesin - 14, "whip_low", 0.3), s(o + T.mesin, "impact_soft", 0.3), s(o + T.jaringan - 14, "whip_low", 0.3, 1.1), s(o + T.jaringan, "impact_soft", 0.3, 1.1),
    s(o + T.layanan - 14, "whip_low", 0.3, 1.2), s(o + T.layanan, "impact_soft", 0.3, 1.2), s(o + T.selalu, "status_warn", 0.25), s(o + T.software - 34, "whip_air", 0.3),
    s(o + T.software - 12, "impact_card", 0.3), s(o + T.infra - 12, "impact_card", 0.3, 0.9), s(o + SPLIT, "lens_pass", 0.45, 1.1),
  ];
};

void DRIFT; void WHIP;
