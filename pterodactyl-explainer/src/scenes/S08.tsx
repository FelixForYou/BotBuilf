import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "../lib/theme";
import { arc, breathe, clamp01, DRIFT, GLIDE, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, DashedGrid, Label, Obj, Stage, Words } from "../components/Primitives";
import { MBlur, SwapText } from "../components/Motion";
import { ChipIllo, ContainerIllo, EggIllo, FolderIllo, RamIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";

const L = makeLocal("s08");
const T = {
  mari: L.c("Mari masuk"), sumber: L.c("sumber dayanya"), cpu: L.c("C P U"), hitung: L.c("perhitungan"), proses: L.c("memproses pesan"), ram: L.c("ram"),
  tampung: L.c("menampung data"), dipakai: L.c("dipakai"), simpan: L.c("Penyimpanan"), kode: L.c("menyimpan kode"), dep: L.c("dependensi"), berkas: L.c("berkas lainnya"),
  lalu: L.c("Lalu ada"), egg: L.c("egg"), resep: L.c("resep"), lingkungan: L.c("lingkungan"), image: L.c("image container"), runtime: L.c("runtime"), perintah: L.c("perintah awal"),
  bukan: L.c("Egg bukan"), kodebot: L.c("kode bot"), kapasitas: L.c("Kapasitas"), beda: L.c("berbeda-beda"), gantung: L.c("bergantung"), fKode: L.c("kode", 2),
  fitur: L.c("fitur"), aktivitas: L.c("jumlah aktivitas"), fDep: L.c("dependensi", 1), botnya: L.c("botnya"), end: L.dur,
};
const INK = C.ink;
const SHRINK = T.end - 30; // capacity bar becomes scene 9's underline

const cam = (f: number) =>
  rig(f, { x: 0, y: 0, z: -1500 }, [
    { at: 0, to: { z: 60, ry: -6, rx: 4 }, feel: { stiffness: 90, damping: 20 } },
    { at: T.sumber - 20, to: { z: -260, ry: 0, rx: 2 }, feel: GLIDE },
    { at: T.cpu - 14, to: { x: -560, z: -180, ry: 7 }, feel: WHIP },
    { at: T.ram - 14, to: { x: 0, ry: -3 }, feel: WHIP },
    { at: T.simpan - 14, to: { x: 560, ry: -7 }, feel: WHIP },
    { at: T.lalu - 16, to: { x: 0, z: -40, ry: 0 }, feel: GLIDE },
    { at: T.image - 10, to: { x: 120, z: -140, ry: -5 }, feel: GLIDE },
    { at: T.bukan - 20, to: { x: -60, z: -100, ry: 6 }, feel: GLIDE },
    { at: T.kapasitas - 30, to: { x: 0, z: 200, ry: 0, rx: 0 }, feel: GLIDE },
  ]);

const Section: React.FC<{ w: number; h: number; title: string; icon: "Cpu" | "MemoryStick" | "HardDrive"; active: number; children: React.ReactNode; caption: React.ReactNode }> = ({ w, h, title, icon, active, children, caption }) => (
  <Card w={w} h={h} tone="light" radius={28} shadowA={0.7 + active * 0.9} style={{ border: `1.5px solid rgba(255,106,43,${active * 0.7})` }}>
    <div style={{ padding: 30, height: "100%", display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 700, color: INK, letterSpacing: "-0.02em" }}>
        <Icon name={icon} size={32} color={active > 0.5 ? C.orange : C.gray} /> {title}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <div style={{ fontSize: 21, color: "#55585e", fontWeight: 500, minHeight: 56, lineHeight: 1.35 }}>{caption}</div>
    </div>
  </Card>
);

export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 0.9, 8), f);
  const open = spr(f, T.sumber - 26, { stiffness: 130, damping: 18 });
  const act = (a: number, b: number) => clamp01(spr(f, a - 14, SNAP)) * (1 - clamp01(spr(f, b - 14, SNAP)) * 0.75);
  const aC = act(T.cpu, T.ram), aR = act(T.ram, T.simpan), aS = act(T.simpan, T.lalu);
  const away = (i: number) => out(f, T.lalu - 24 + i * 4, 16);
  const eggQ = spr(f, T.egg - 18, { stiffness: 110, damping: 19 });
  const toCont = clamp01(spr(f, T.bukan - 24, PANEL));
  const eggOut = out(f, T.kapasitas - 34, 14);
  const msgT = clamp01((f - T.proses + 18) / 44);
  const ramFill = lerp(0.12, 0.65, clamp01(spr(f, T.tampung - 10, DRIFT))) + 0.05 * Math.sin(f * 0.06);
  const sw = 500, sh = 600;
  const secX = (i: number) => lerp(0, (i - 1) * 560, open);
  const capIn = spr(f, T.kapasitas - 26, PANEL);
  const shrink = clamp01(spr(f, SHRINK, { stiffness: 170, damping: 22 }));
  const capOut = out(f, SHRINK, 12);
  const barW = lerp(900, 160, shrink);
  const barTarget = [T.kapasitas, T.fKode, T.fitur, T.aktivitas, T.fDep].reduce((acc, at, i) => acc + clamp01(spr(f, at - 4, PANEL)) * [14, 18, 20, 22, -10][i], 0);

  const recipe = [["Image container", "image: node (contoh)", T.image], ["Runtime", "Node.js / Python", T.runtime], ["Perintah awal", "node index.js", T.perintah]] as const;

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <DashedGrid f={f} xs={[160, 1760]} ys={[120, 960]} color="rgba(10,10,12,0.08)" march={1} />
      <Stage cam={c} blur={[cd.x, cd.y]}>
        {/* the card from scene 7 (seen from its white back) is the resource card */}
        <Obj x={0} y={0} w={560} h={320} o={1 - clamp01(open * 1.5)} s={lerp(1, 1.12, open)}>
          <Card w={560} h={320} tone="light" radius={26} shadowA={1.6}>
            <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
              <SwapText f={f} items={[{ at: 6, text: "Sumber daya" }]} size={28} weight={700} align="left" />
              {(["Cpu", "MemoryStick", "HardDrive"] as const).map((ic, i) => {
                const q = clamp01(spr(f, 14 + i * 5, SNAP));
                return (
                  <div key={ic} style={{ display: "flex", alignItems: "center", gap: 14, opacity: q }}>
                    <Icon name={ic} size={26} color={C.orange} draw={q} />
                    <div style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(10,10,12,0.06)" }}>
                      <div style={{ width: `${q * (30 + i * 18 + 6 * Math.sin(f * 0.06 + i))}%`, height: 10, borderRadius: 5, background: C.orange }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Obj>

        {/* the card opens into three layers */}
        {[0, 1, 2].map((i) => {
          const a = [aC, aR, aS][i];
          const q = clamp01(spr(f, T.sumber - 26 + i * 5, { stiffness: 130, damping: 18 }));
          const aw = away(i);
          return (
            <Obj key={i} x={secX(i)} y={-aw * 200} w={sw} h={sh} o={clamp01(q * 3) * (1 - aw)} ry={lerp(i === 0 ? 30 : i === 2 ? -30 : 0, (i - 1) * -8, q) * (1 - a)} z={a * 50 - aw * 900 + (1 - q) * -300}>
              {i === 0 && (
                <Section w={sw} h={sh} title="CPU" icon="Cpu" active={a} caption={<Words f={f} text="mengerjakan perhitungan, misalnya saat memproses pesan" at={T.hitung - 16} stagger={3} size={21} color="#55585e" weight={500} align="left" />}>
                  <div style={{ position: "relative" }}>
                    <ChipIllo d={clamp01((f - T.cpu + 16) / 22)} f={f} size={260} color={INK} heat={0.2 + Math.sin(msgT * Math.PI) * 0.8} />
                    {msgT > 0 && msgT < 1 && (
                      <div style={{ position: "absolute", left: lerp(-120, 330, msgT), top: 110 - Math.sin(msgT * Math.PI) * 30, filter: "blur(1px)" }}>
                        <Icon name="MessageCircle" size={42} color={C.telegram} stroke={2.2} />
                      </div>
                    )}
                  </div>
                </Section>
              )}
              {i === 1 && (
                <Section w={sw} h={sh} title="RAM" icon="MemoryStick" active={a} caption={<Words f={f} text="menampung data yang sedang dipakai aplikasi" at={T.tampung - 10} stagger={3} size={21} color="#55585e" weight={500} align="left" />}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative" }}>
                    <RamIllo d={clamp01((f - T.ram + 20) / 22)} size={400} color={INK} fill={ramFill} />
                    {[0, 1, 2, 3, 4].map((k) => {
                      const at = T.tampung - 6 + k * 9;
                      const q2 = clamp01(spr(f, at, { stiffness: 180, damping: 18 }));
                      return <div key={k} style={{ position: "absolute", left: 40 + k * 66, top: lerp(-260, 40, q2), width: 26, height: 30, borderRadius: 5, background: C.orange, opacity: f > at && q2 < 0.97 ? 1 : 0 }} />;
                    })}
                  </div>
                </Section>
              )}
              {i === 2 && (
                <Section w={sw} h={sh} title="Penyimpanan" icon="HardDrive" active={a} caption={<Words f={f} text="menyimpan kode, dependensi, dan berkas lainnya" at={T.kode - 10} times={[T.kode - 10, T.kode + 2, T.dep, T.berkas - 8, T.berkas, T.berkas + 10]} size={21} color="#55585e" weight={500} align="left" />}>
                  <div style={{ position: "relative", width: 420, height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <FolderIllo d={clamp01((f - T.simpan + 20) / 22)} size={250} color={INK} open={clamp01(spr(f, T.kode - 10, PANEL))} />
                    {[["index.js", T.kode, -130], ["node_modules/", T.dep, 0], ["data/", T.berkas, 130]].map(([t, at, x]) => {
                      const q2 = clamp01(spr(f, (at as number) - 6, { stiffness: 150, damping: 16 }));
                      const [px, py] = arc(q2, [0, 20, 0], [(x as number) * 0.6, -200, 0], [x as number, 128, 0]);
                      return (
                        <div key={t as string} style={{ position: "absolute", left: 210 + px - 70, top: 150 + py - 18, width: 140, display: "flex", justifyContent: "center", opacity: clamp01(q2 * 3), transform: `scale(${lerp(0.5, 1, q2)})` }}>
                          <Label size={16} bg="rgba(255,106,43,0.12)" color={C.ember} style={{ fontFamily: MONO }}>{t}</Label>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </Obj>
          );
        })}

        {/* egg: descends, its recipe streams out into a list, then it becomes the container */}
        <Obj x={-230} y={lerp(-900, -10, clamp01(eggQ))} z={-eggOut * 700} w={260} h={312} o={clamp01(eggQ * 3) * (1 - toCont) * (1 - eggOut)} rz={(1 - clamp01(eggQ)) * 18}>
          <EggIllo d={clamp01((f - T.egg + 14) / 24)} size={260} color={INK} lines={clamp01((f - T.image + 6) / 50)} />
        </Obj>
        <Obj x={-230} y={-10} z={-eggOut * 700} w={300} h={300} o={toCont * (1 - eggOut)} s={lerp(0.7, 1, toCont)}>
          <div style={{ position: "relative" }}>
            <ContainerIllo d={toCont} size={300} color={INK} open={lerp(0.9, 0.15, clamp01(spr(f, T.kodebot + 4, PANEL)))} />
            <div style={{ position: "absolute", left: 105, top: lerp(-140, 112, clamp01(spr(f, T.kodebot - 14, { stiffness: 170, damping: 18 }))), opacity: clamp01((f - T.kodebot + 16) / 6) }}>
              <Icon name="Bot" size={90} color={C.orange} stroke={1.8} />
            </div>
          </div>
        </Obj>
        <Obj x={330} y={-20} w={580} h={380} o={clamp01(eggQ * 2) * (1 - eggOut)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SwapText f={f} items={[{ at: T.egg - 6, text: "Egg" }, { at: T.resep - 6, text: "Egg: resep lingkungan" }]} size={42} align="left" />
            {recipe.map(([a, b, at], i) => {
              const q = clamp01(spr(f, at - 8, { stiffness: 140, damping: 17 }));
              return (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 14, opacity: clamp01(q * 2), transform: `translate(${(1 - q) * -420}px, ${(1 - q) * (60 - i * 40)}px) scale(${lerp(0.5, 1, q)})`, transformOrigin: "left" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: C.orange }} />
                  <div style={{ fontSize: 24, fontWeight: 600, color: INK, width: 200 }}>{a}</div>
                  <div style={{ fontSize: 19, fontFamily: MONO, color: "#55585e", background: "rgba(10,10,12,0.05)", padding: "6px 12px", borderRadius: 8 }}>{b}</div>
                </div>
              );
            })}
            <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
              {[["Egg: lingkungan", C.ink, "#fff", 0], ["Kode bot: terpisah", "rgba(255,106,43,0.12)", C.ember, 6]].map(([t, bg, col, d]) => (
                <div key={t as string} style={{ transform: `scale(${clamp01(spr(f, T.bukan - 4 + (d as number), POP))})` }}><Label size={20} bg={bg as string} color={col as string}>{t}</Label></div>
              ))}
            </div>
          </div>
        </Obj>
      </Stage>

      {/* capacity (screen space, so its bar can hand off exactly to scene 9) */}
      <AbsoluteFill style={{ alignItems: "center", opacity: clamp01(capIn * 2) }}>
        <div style={{ position: "absolute", top: 300, transform: `translateY(${(1 - clamp01(capIn)) * 60 - capOut * 120}px)`, opacity: 1 - capOut }}>
          <SwapText f={f} items={[{ at: T.kapasitas - 6, text: "Kapasitas berbeda-beda" }, { at: T.gantung - 6, text: "Bergantung pada botnya" }]} size={48} />
        </div>
        <div style={{ position: "absolute", top: 597, left: 960 - barW / 2, width: barW, height: 6, borderRadius: 3, background: shrink > 0.02 ? "transparent" : "rgba(10,10,12,0.07)" }}>
          <div style={{ height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.coral}, ${C.ember})`,
            width: `${lerp(lerp(10, 10 + barTarget, 1) + 3 * Math.sin(f * 0.05), 100, shrink)}%`, margin: shrink > 0.5 ? "0 auto" : undefined }} />
        </div>
        <div style={{ position: "absolute", top: 660, display: "flex", gap: 18, opacity: 1 - capOut, transform: `translateY(${capOut * 80}px)` }}>
          {([["Code", "Kode", T.fKode], ["Sparkles", "Fitur", T.fitur], ["Activity", "Jumlah aktivitas", T.aktivitas], ["Package", "Dependensi", T.fDep]] as const).map(([ic, t, at], i) => {
            const fn = (ff: number) => {
              const q = clamp01(spr(ff, at - 10, { stiffness: 150, damping: 16 }));
              const [x, y] = arc(q, [(i - 1.5) * 400, 500, 0], [(i - 1.5) * 200, -120, 0], [0, 0, 0]);
              return { x, y, q };
            };
            const { v, d } = vel(fn, f);
            return (
              <div key={t} style={{ opacity: clamp01(v.q * 3), transform: `translate(${v.x}px, ${v.y}px)` }}>
                <MBlur dx={d.x} dy={d.y}>
                  <Card w={250} h={110} tone="light" radius={20} shadowA={1.2}>
                    <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 14, padding: "0 22px", fontSize: 23, fontWeight: 600, color: INK }}>
                      <Icon name={ic} size={30} color={C.orange} draw={clamp01((f - at + 4) / 14)} /> {t}
                    </div>
                  </Card>
                </MBlur>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", top: 810, fontSize: 21, color: C.gray, fontWeight: 500, opacity: clamp01((f - T.botnya) / 12) * (1 - capOut) }}>Tidak ada satu angka RAM yang berlaku untuk semua bot.</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 70 }}>
          <SwapText f={f} items={[{ at: T.mari - 4, text: "Masuk ke sumber daya" }]} size={32} style={{ opacity: 1 - out(f, T.cpu - 16, 10) }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx08 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o, "lens_pass", 0.35, 1.3), s(o + 30, "impact_card", 0.3, 1.1), s(o + 14, "stack_ticks", 0.22), s(o + T.mari - 4, "scramble", 0.2),
    s(o + T.sumber - 26, "morph_up", 0.35), s(o + T.sumber - 14, "impact_card", 0.25), s(o + T.sumber - 9, "impact_card", 0.25, 1.1), s(o + T.sumber - 4, "impact_card", 0.25, 1.2),
    s(o + T.cpu - 14, "whip_fast", 0.32), s(o + T.proses - 18, "data_flow", 0.28, 0.9), s(o + T.ram - 14, "whip_fast", 0.32, 1.1), s(o + T.tampung - 6, "stack_ticks", 0.28),
    s(o + T.simpan - 14, "whip_fast", 0.32, 0.92), s(o + T.kode - 10, "flip", 0.25, 1.2), s(o + T.kode - 4, "msg_out", 0.2, 1.4), s(o + T.dep - 4, "msg_out", 0.2, 1.5), s(o + T.berkas - 4, "msg_out", 0.2, 1.3),
    s(o + T.lalu - 24, "whip_low", 0.32), s(o + T.egg - 18, "panel_lift", 0.3), s(o + T.egg + 4, "impact_soft", 0.35), s(o + T.resep - 6, "scramble", 0.2),
    s(o + T.image - 8, "whip_air", 0.22, 1.3), s(o + T.runtime - 8, "whip_air", 0.22, 1.4), s(o + T.perintah - 8, "whip_air", 0.22, 1.2), s(o + T.bukan - 24, "morph_up", 0.35, 0.9),
    s(o + T.kodebot - 14, "whip_fast", 0.25, 1.3), s(o + T.kodebot, "latch", 0.38), s(o + T.kapasitas - 34, "whip_low", 0.3, 1.1), s(o + T.kapasitas - 6, "scramble", 0.22),
    s(o + T.fKode - 10, "impact_card", 0.28), s(o + T.fitur - 10, "impact_card", 0.28, 1.1), s(o + T.aktivitas - 10, "impact_card", 0.28, 1.2), s(o + T.fDep - 10, "impact_card", 0.28, 0.92),
    s(o + T.gantung - 6, "scramble", 0.2, 1.1), s(o + SHRINK, "morph_down", 0.3),
  ];
};
