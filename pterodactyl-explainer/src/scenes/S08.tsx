import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, softShadow } from "../lib/theme";
import { easeBack, easeIO, easeOut, kf, life, mix, p, drift } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, DashedGrid, Label, Obj, Stage, Words } from "../components/Primitives";
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

const Section: React.FC<{ w: number; h: number; title: string; icon: "Cpu" | "MemoryStick" | "HardDrive"; active: number; children: React.ReactNode; caption: React.ReactNode }> = ({ w, h, title, icon, active, children, caption }) => (
  <Card w={w} h={h} tone="light" radius={28} shadowA={0.6 + active * 0.8} style={{ border: `1.5px solid rgba(255,106,43,${active * 0.7})` }}>
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
  const open = p(f, T.sumber - 30, T.cpu - 10, easeOut); // resource card splits into three
  const aC = kf(f, [T.cpu - 20, T.cpu, T.ram - 20, T.ram], [0.3, 1, 1, 0.3]);
  const aR = kf(f, [T.ram - 20, T.ram, T.simpan - 20, T.simpan], [0.3, 1, 1, 0.3]);
  const aS = kf(f, [T.simpan - 20, T.simpan, T.lalu - 20, T.lalu], [0.3, 1, 1, 0.3]);
  const away = p(f, T.lalu - 30, T.lalu + 20, easeIO);
  const eggIn = p(f, T.egg - 20, T.egg + 40, easeOut);
  const toCont = p(f, T.bukan - 40, T.bukan + 10, easeIO);
  const capIn = p(f, T.kapasitas - 30, T.kapasitas + 20, easeOut);
  const eggOut = p(f, T.kapasitas - 40, T.kapasitas, easeIO);

  const camX = kf(f, [0, T.sumber, T.cpu, T.ram, T.simpan, T.lalu, T.egg], [0, 0, -560, 0, 560, 560, 0]);
  const camZ = kf(f, [0, T.mari, T.sumber, T.cpu, T.ram, T.simpan, T.lalu, T.egg, T.bukan, T.kapasitas, T.end], [300, 0, -350, -150, -170, -150, -40, -120, -60, 0, 60]);
  const camRy = kf(f, [0, T.cpu, T.ram, T.simpan, T.lalu, T.bukan, T.kapasitas, T.end], [0, 6, -4, -8, 0, 5, -3, 2]);

  // data blocks flowing into RAM
  const ramFill = kf(f, [T.tampung - 20, T.dipakai + 40], [0.15, 0.62]) + 0.04 * Math.sin(f * 0.05);
  const msgT = p(f, T.proses - 20, T.proses + 50, easeIO);

  const sw = 500, sh = 600;
  const secX = (i: number) => mix(0, (i - 1) * 560, open);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <DashedGrid f={f} xs={[160, 1760]} ys={[120, 960]} color="rgba(10,10,12,0.08)" />
      <Stage cam={{ x: camX, z: camZ, ry: camRy, rx: 2 }}>
        {/* collapsed resource card at the start */}
        <Obj x={0} y={0} w={560} h={320} o={1 - open} s={mix(1, 1.15, open)}>
          <Card w={560} h={320} tone="light" radius={26} shadowA={1.6}>
            <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>Sumber daya</div>
              {(["Cpu", "MemoryStick", "HardDrive"] as const).map((ic, i) => (
                <div key={ic} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Icon name={ic} size={26} color={C.orange} />
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(10,10,12,0.06)" }}>
                    <div style={{ width: `${30 + i * 18 + 6 * Math.sin(f * 0.06 + i)}%`, height: 10, borderRadius: 5, background: C.orange }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Obj>

        {/* three sections */}
        <Obj x={secX(0)} y={0} w={sw} h={sh} o={open * (1 - away)} ry={mix(0, 10, open) * (1 - aC)} z={aC * 40 - away * 400}>
          <Section w={sw} h={sh} title="CPU" icon="Cpu" active={aC} caption={<Words f={f} text="mengerjakan perhitungan, misalnya saat memproses pesan" at={T.hitung - 20} stagger={4} size={21} color="#55585e" weight={500} align="left" />}>
            <div style={{ position: "relative" }}>
              <ChipIllo d={p(f, T.cpu - 20, T.cpu + 30)} f={f} size={260} color={INK} heat={0.2 + msgT * (1 - msgT) * 3} />
              <div style={{ position: "absolute", left: mix(-90, 320, msgT), top: 110, opacity: Math.sin(msgT * Math.PI) }}>
                <Icon name="MessageCircle" size={40} color={C.telegram} stroke={2} />
              </div>
            </div>
          </Section>
        </Obj>
        <Obj x={secX(1)} y={0} w={sw} h={sh} o={open * (1 - away)} z={aR * 40 - away * 400}>
          <Section w={sw} h={sh} title="RAM" icon="MemoryStick" active={aR} caption={<Words f={f} text="menampung data yang sedang dipakai aplikasi" at={T.tampung - 10} stagger={5} size={21} color="#55585e" weight={500} align="left" />}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <RamIllo d={p(f, T.ram - 30, T.ram + 20)} size={400} color={INK} fill={ramFill} />
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 1, 2, 3].map((i) => {
                  const ph = ((f - T.tampung + i * 22) % 90) / 90;
                  return <div key={i} style={{ width: 26, height: 18, borderRadius: 4, background: C.orange, opacity: f > T.tampung - 20 ? 0.25 + 0.75 * (1 - ph) : 0, transform: `translateY(${-ph * 50}px)` }} />;
                })}
              </div>
            </div>
          </Section>
        </Obj>
        <Obj x={secX(2)} y={0} w={sw} h={sh} o={open * (1 - away)} ry={mix(0, -10, open) * (1 - aS)} z={aS * 40 - away * 400}>
          <Section w={sw} h={sh} title="Penyimpanan" icon="HardDrive" active={aS} caption={<Words f={f} text="menyimpan kode, dependensi, dan berkas lainnya" at={T.kode - 10} times={[T.kode - 10, T.kode + 4, T.dep, T.berkas - 8, T.berkas, T.berkas + 12]} size={21} color="#55585e" weight={500} align="left" />}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <FolderIllo d={p(f, T.simpan - 30, T.simpan + 20)} size={250} color={INK} open={p(f, T.kode - 10, T.kode + 40, easeOut)} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", width: 400 }}>
                {[["index.js", T.kode], ["node_modules/", T.dep], ["data/", T.berkas]].map(([t, at]) => (
                  <div key={t as string} style={{ opacity: p(f, (at as number) - 6, (at as number) + 16), transform: `scale(${mix(0.7, 1, p(f, (at as number) - 6, (at as number) + 20, easeBack))})` }}>
                    <Label size={17} bg="rgba(255,106,43,0.1)" color={C.ember} style={{ fontFamily: MONO }}>{t}</Label>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </Obj>

        {/* egg: recipe of the environment */}
        <Obj x={-200} y={-10} w={260} h={312} o={eggIn * (1 - toCont)} s={mix(0.8, 1, eggIn) * (1 + 0.015 * Math.sin(f * 0.06))} rz={drift(f, 2, 0.02) * 2}>
          <EggIllo d={eggIn} size={260} color={INK} lines={kf(f, [T.image - 10, T.runtime, T.perintah + 10], [0, 0.66, 1])} />
        </Obj>
        <Obj x={-200} y={-10} w={300} h={300} o={toCont * (1 - eggOut)} s={mix(0.8, 1, toCont)}>
          <div style={{ position: "relative" }}>
            <ContainerIllo d={toCont} size={300} color={INK} open={kf(f, [T.bukan, T.bukan + 30, T.kodebot + 20], [0.8, 0.8, 0.15])} />
            <div style={{ position: "absolute", left: 105, top: mix(-60, 112, p(f, T.bukan, T.kodebot + 10, easeOut)), opacity: p(f, T.bukan - 10, T.bukan + 10) }}>
              <Icon name="Bot" size={90} color={C.orange} stroke={1.8} />
            </div>
          </div>
        </Obj>
        <Obj x={330} y={-20} w={560} h={360} o={eggIn * (1 - eggOut)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Words f={f} text="Egg: resep lingkungan" at={T.egg} times={[T.egg, T.resep, T.lingkungan]} size={40} align="left" accent={[0]} />
            {[["Image container", "image: node (contoh)", T.image], ["Runtime", "Node.js / Python", T.runtime], ["Perintah awal", "node index.js", T.perintah]].map(([a, b, at]) => {
              const q = p(f, (at as number) - 8, (at as number) + 22, easeOut);
              return (
                <div key={a as string} style={{ display: "flex", alignItems: "center", gap: 14, opacity: q, transform: `translateX(${(1 - q) * 30}px)` }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: C.orange }} />
                  <div style={{ fontSize: 24, fontWeight: 600, color: INK, width: 200 }}>{a}</div>
                  <div style={{ fontSize: 19, fontFamily: MONO, color: "#55585e", background: "rgba(10,10,12,0.05)", padding: "6px 12px", borderRadius: 8 }}>{b}</div>
                </div>
              );
            })}
            <div style={{ marginTop: 10, opacity: p(f, T.bukan - 6, T.bukan + 20), display: "flex", gap: 12 }}>
              <Label size={20} bg={C.ink} color="#fff">Egg: lingkungan</Label>
              <Label size={20} bg="rgba(255,106,43,0.12)" color={C.ember}>Kode bot: terpisah</Label>
            </div>
          </div>
        </Obj>

        {/* capacity depends on the bot */}
        <Obj x={0} y={-40} w={1300} h={500} o={capIn}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <Words f={f} text="Kapasitas berbeda-beda" at={T.kapasitas} times={[T.kapasitas, T.beda]} size={46} accent={[1]} />
            <div style={{ width: 900, height: 18, borderRadius: 9, background: "rgba(10,10,12,0.07)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 9, background: `linear-gradient(90deg, ${C.coral}, ${C.ember})`,
                width: `${kf(f, [T.kapasitas, T.fKode, T.fitur, T.aktivitas, T.fDep, T.botnya + 30], [12, 30, 48, 70, 58, 64]) + 3 * Math.sin(f * 0.05)}%` }} />
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              {([["Code", "Kode", T.fKode], ["Sparkles", "Fitur", T.fitur], ["Activity", "Jumlah aktivitas", T.aktivitas], ["Package", "Dependensi", T.fDep]] as const).map(([ic, t, at]) => {
                const q = p(f, at - 8, at + 22, easeBack);
                return (
                  <div key={t} style={{ opacity: Math.min(1, q * 1.5), transform: `translateY(${(1 - q) * 30}px)` }}>
                    <Card w={250} h={120} tone="light" radius={20}>
                      <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 14, padding: "0 22px", fontSize: 23, fontWeight: 600, color: INK }}>
                        <Icon name={ic} size={30} color={C.orange} draw={q} /> {t}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 20, color: C.gray, fontWeight: 500, opacity: p(f, T.botnya, T.botnya + 30) }}>Tidak ada satu angka RAM yang berlaku untuk semua bot.</div>
          </div>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 70 }}>
          <Words f={f} text="Masuk ke sumber daya" at={T.mari} times={[T.mari, T.sumber - 10, T.sumber, T.sumber + 10]} size={32} out={T.cpu} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx08 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o, "panel_lift", 0.3, 1.15), s(o + T.sumber - 30, "warp", 0.35, 1.1), s(o + T.cpu - 20, "settle", 0.35, 1.1),
    s(o + T.proses - 20, "data_flow", 0.3, 0.9), s(o + T.ram - 20, "panel_pass", 0.3), s(o + T.tampung - 10, "data_tick", 0.3), s(o + T.dipakai, "data_tick", 0.25, 1.2),
    s(o + T.simpan - 20, "panel_pass", 0.3, 1.15), s(o + T.kode - 10, "click_soft", 0.3), s(o + T.dep - 6, "click_soft", 0.3, 1.1), s(o + T.berkas - 6, "click_soft", 0.3, 1.2),
    s(o + T.lalu - 30, "swell_bright", 0.3, 0.9), s(o + T.egg - 16, "line_draw", 0.35), s(o + T.image - 8, "type_short", 0.25), s(o + T.runtime - 8, "click_glass", 0.25),
    s(o + T.perintah - 8, "type_short", 0.25, 1.1), s(o + T.bukan - 40, "warp", 0.35, 0.9), s(o + T.kodebot, "latch", 0.4), s(o + T.kapasitas - 30, "panel_slide", 0.35),
    s(o + T.fKode - 8, "settle_light", 0.3), s(o + T.fitur - 8, "settle_light", 0.3, 1.12), s(o + T.aktivitas - 8, "settle_light", 0.3, 1.25), s(o + T.fDep - 8, "settle_light", 0.3, 0.92),
  ];
};
