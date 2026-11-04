import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { C, FONT, glow } from "../lib/theme";
import { easeBack, easeIO, easeOut, kf, life, mix, p } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, Flow, Label, Obj, Stage, Words, WarmLight, GlowWave } from "../components/Primitives";
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

const logs: Line[] = [
  { t: 0, text: "[info] pesan masuk: /jadwal", kind: "in" },
  { t: 30, text: "[info] memproses perintah jadwal", kind: "info" },
  { t: T.error - 8, text: "[error] TypeError: Cannot read properties of undefined (reading 'tanggal')", kind: "err" },
  { t: T.error + 14, text: "    at formatAgenda (commands/jadwal.js:7:24)", kind: "dim" },
  { t: T.kendali - 4, text: "[panel] restart diminta", kind: "dim" },
];

export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const consoleIn = p(f, T.misal - 30, T.misal + 10, easeOut);
  const toCode = p(f, T.tapi - 20, T.tapi + 20, easeIO);
  const fix = p(f, T.kodeapp - 10, T.kodeapp + 40, easeOut);
  const notIn = p(f, T.juga - 20, T.juga + 10, easeOut);
  const dark = p(f, T.lang - 40, T.lang, easeIO);
  const costIn = p(f, T.software - 30, T.software + 10, easeOut);
  const chainOut = p(f, T.software - 40, T.software - 5, easeIO);
  const flicker = f > T.selalu - 10 && f < T.kendala + 40 ? (Math.sin(f * 0.9) > 0.3 ? 0.25 : 1) : 1;

  const camZ = kf(f, [0, T.misal, T.error + 20, T.lihat, T.tapi, T.kodeapp, T.juga, T.lang, T.tidakada, T.software, T.end], [100, -40, -260, -200, -120, -170, 0, 80, -40, 40, 120]);
  const camX = kf(f, [T.misal, T.error + 20, T.lihat, T.tapi, T.juga], [0, -120, -80, 0, 0]);
  const camRy = kf(f, [0, T.misal, T.tapi, T.juga, T.lang, T.tidakada, T.software, T.end], [3, -5, 5, -4, 4, -3, 2, 0]);

  return (
    <AbsoluteFill style={{ background: interpolateColors(dark, [0, 1], [C.white, C.black]), fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: dark }}>
        <WarmLight f={f} o={0.45} y={600} r={1000} seed={11} />
        <GlowWave f={f} y={860} amp={30} o={0.55 * (1 - costIn * 0.5)} reveal={p(f, T.lang - 30, T.lang + 60)} />
      </AbsoluteFill>
      <Stage cam={{ x: camX, z: camZ, ry: camRy, rx: 2 }}>
        {/* A: can / cannot */}
        <Obj x={0} y={-40} w={1000} h={200} o={life(f, T.lalu, 30, T.misal - 20, 30)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
            <Words f={f} text="Bisa, dan tidak bisa." at={T.bisa} times={[T.bisa, T.tidak, T.tidak + 12]} size={52} accent={[1, 2]} accentColor={C.gray} />
            <div style={{ display: "flex", gap: 18, opacity: p(f, T.tidak + 20, T.tidak + 50) }}>
              <Label size={22} bg="rgba(62,207,142,0.14)" color="#1d8a5a"><Icon name="Check" size={20} color="#1d8a5a" /> dibantu panel</Label>
              <Label size={22} bg="rgba(240,82,79,0.12)" color="#c23a37"><Icon name="X" size={20} color="#c23a37" /> di luar panel</Label>
            </div>
          </div>
        </Obj>

        {/* B: error appears in console */}
        <Obj x={0} y={-20} w={1100} h={330} o={consoleIn * (1 - toCode)} s={mix(0.9, 1, consoleIn)} z={-toCode * 200}>
          <Card w={1100} h={330} tone="dark" radius={20} glowA={0.25}>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 19, fontWeight: 600 }}>
                <PteroMark size={24} /> Console · asisten-bot
              </div>
              <ConsoleView f={f} lines={logs} w={1060} h={250} size={19} highlight={2} hiA={p(f, T.error, T.error + 20)} />
            </div>
          </Card>
        </Obj>
        <Obj x={0} y={240} w={1000} h={60} o={life(f, T.lihat - 10, 24, T.tapi - 10, 24)}>
          <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
            <Words f={f} text="Kontrol lebih jelas." at={T.kendali} times={[T.kendali, T.kendali + 10, T.kendali + 20]} size={32} accent={[2]} />
            <Words f={f} text="Pemantauan lebih mudah." at={T.lihat} times={[T.lihat, T.lihat + 10, T.lihat + 20]} size={32} accent={[2]} />
          </div>
        </Obj>

        {/* C: the fix lives in the code */}
        <Obj x={0} y={-30} w={900} h={330} o={toCode * (1 - notIn)} s={mix(0.8, 1, toCode)} ry={mix(-20, 0, toCode)}>
          <CodeCard f={f} at={T.tapi - 16} w={900} title="commands/jadwal.js" size={21} hiLine={fix > 0.5 ? 4 : 3} hiA={1} hiColor={fix > 0.5 ? C.ok : C.err} strike={fix > 0.5 ? 0 : 0}
            lines={[
              { text: "function formatAgenda(agenda) {", tone: "kw" },
              { text: "  // agenda bisa kosong", tone: "cm" },
              { text: "  if (!agenda) return 'Belum ada agenda.';", tone: fix > 0.5 ? "fix" : "cm" },
              { text: "  return agenda.tanggal + ': ' + agenda.isi;", tone: fix > 0.5 ? "plain" : "err" },
              { text: fix > 0.5 ? "  // diperbaiki di kode aplikasi" : "", tone: "cm" },
              { text: "}", tone: "kw" },
            ]} />
        </Obj>
        <Obj x={0} y={190} w={900} h={50} o={life(f, T.kodeapp - 10, 24, T.juga - 10, 24)}>
          <div style={{ display: "flex", justifyContent: "center" }}><Label size={22} bg="rgba(10,10,12,0.06)" color={C.ink}><Icon name="Wrench" size={20} color={C.orange} /> Perbaikan ada di kode aplikasi</Label></div>
        </Obj>

        {/* D: what a panel does not do */}
        {[["tidak otomatis membuat bot", T.membuat, -150], ["tidak menyediakan RAM gratis", T.ram, 0]].map(([t, at, y]) => {
          const q = life(f, (at as number) - 14, 26, T.lang - 30, 26);
          const strike = p(f, (at as number) + 10, (at as number) + 40, easeOut);
          return (
            <Obj key={t as string} x={0} y={(y as number) - 20} w={760} h={110} o={q} s={mix(0.9, 1, q)}>
              <Card w={760} h={110} tone="light" radius={22} shadowA={1.3}>
                <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 20, padding: "0 30px", fontSize: 30, fontWeight: 600, color: C.ink }}>
                  <Icon name="Ban" size={38} color={C.err} draw={strike} />
                  Panel {t}
                </div>
              </Card>
            </Obj>
          );
        })}

        {/* E: continuity depends on machine, network, platform */}
        {([["Mesin server", T.mesin, -520], ["Jaringan", T.jaringan, 0], ["Layanan platform", T.layanan, 520]] as const).map(([t, at, x], i) => {
          const q = life(f, at - 14, 30, T.software - 40, 30);
          return (
            <Obj key={t} x={x} y={-60} w={340} h={320} o={q * (i === 1 ? flicker : 1)} s={mix(0.85, 1, q)} z={(1 - q) * -200}>
              <Card w={340} h={320} tone="dark" radius={26} glowA={0.35 * q}>
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, color: "#fff" }}>
                  {i === 0 && <ServerIllo d={q} f={f} size={150} />}
                  {i === 1 && <NetworkIllo d={q} f={f} size={150} />}
                  {i === 2 && <div style={{ display: "flex", gap: 14 }}><BrandLogo brand="telegram" size={70} /><BrandLogo brand="whatsapp" size={70} /></div>}
                  <div style={{ fontSize: 25, fontWeight: 700 }}>{t}</div>
                </div>
              </Card>
            </Obj>
          );
        })}
        <Flow f={f} d="M -350 -60 L -170 -60" reveal={p(f, T.jaringan - 10, T.jaringan + 20) * (1 - chainOut)} color={C.coral} pulses={2} width={2.5} o={flicker} />
        <Flow f={f} d="M 170 -60 L 350 -60" reveal={p(f, T.layanan - 10, T.layanan + 20) * (1 - chainOut)} color={C.coral} pulses={2} width={2.5} o={flicker} />
        <Obj x={0} y={190} w={1300} h={60} o={life(f, T.lang - 10, 30, T.software - 40, 30)}>
          <Words f={f} text="Tetap bergantung pada aplikasi dan infrastrukturnya." at={T.lang} stagger={7} size={34} color="#fff" accent={[3, 5]} />
        </Obj>
        <Obj x={0} y={260} w={900} h={50} o={life(f, T.tidakada - 6, 24, T.software - 40, 24)}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Label size={20} bg="rgba(255,255,255,0.08)" color="rgba(255,255,255,0.8)"><Icon name="TriangleAlert" size={18} color={C.warn} /> Tidak ada jaminan bot selalu aktif tanpa kendala</Label>
          </div>
        </Obj>

        {/* F: software free vs hosting cost */}
        {([["Software panel", "gratis & open source (MIT)", "Github" as const, -300, T.software, C.ok], ["Infrastruktur hosting", "bisa memiliki biaya", "Coins" as const, 300, T.infra, C.warn]] as const).map(([a, b, ic, x, at, col]) => {
          const q = p(f, at - 14, at + 26, easeBack);
          return (
            <Obj key={a} x={x} y={-30} w={520} h={300} o={Math.min(1, q * 1.4) * costIn} s={mix(0.85, 1, q)} ry={x < 0 ? 6 : -6}>
              <Card w={520} h={300} tone="dark" radius={28} glowA={0.4}>
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, color: "#fff", textAlign: "center" }}>
                  {ic === "Github" ? <PteroMark size={70} draw={q} /> : <Icon name="Coins" size={64} color={col} draw={q} />}
                  <div style={{ fontSize: 30, fontWeight: 700 }}>{a}</div>
                  <div style={{ fontSize: 22, color: col, fontWeight: 600 }}>{b}</div>
                </div>
              </Card>
            </Obj>
          );
        })}
      </Stage>
    </AbsoluteFill>
  );
};

export const sfx09 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + T.bisa - 4, "text_in", 0.3), s(o + T.tidak - 4, "text_in", 0.3, 0.9), s(o + T.misal - 30, "panel_slide", 0.35), s(o + T.misal, "type_short", 0.25),
    s(o + T.error - 8, "error_blip", 0.45), s(o + T.lihat - 6, "click_soft", 0.3), s(o + T.kendali - 4, "click_low", 0.4), s(o + T.tapi - 20, "warp", 0.35, 1.2),
    s(o + T.kodeapp - 6, "type_long", 0.3), s(o + T.kodeapp + 30, "status_on", 0.2), s(o + T.juga - 18, "panel_pass", 0.3), s(o + T.membuat + 10, "click_glass", 0.3, 0.8),
    s(o + T.ram + 10, "click_glass", 0.3, 0.72), s(o + T.lang - 40, "swell_deep", 0.45), s(o + T.mesin - 12, "settle", 0.35), s(o + T.jaringan - 12, "settle", 0.35, 1.15),
    s(o + T.layanan - 12, "settle", 0.35, 1.3), s(o + T.selalu - 8, "status_warn", 0.3), s(o + T.software - 30, "panel_lift", 0.35), s(o + T.infra - 12, "settle_light", 0.35),
  ];
};
