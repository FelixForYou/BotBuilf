import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, glow } from "../lib/theme";
import { easeAnticipate, easeIn, easeIO, easeOut, kf, life, mix, p } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, DashedGrid, Flow, GlowWave, Obj, Stage, Words, WarmLight } from "../components/Primitives";
import { ServerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo, PteroLogo } from "../components/Logos";
import { PowerButtons, StatusPill } from "../components/UI";

const L = makeLocal("s01");
const T = {
  pesan: L.c("Pesan"), masuk: L.c("masuk"), bot: L.c("Bot"), membalas: L.c("membalas"),
  hanya: L.c("Hanya"), layar: L.c("Di layar"), tapi: L.c("Tapi"), balik: L.c("baliknya"),
  setiap: L.c("Setiap"), aplikasi: L.c("aplikasi"), berjalan: L.c("berjalan"), perangkat: L.c("perangkat"), server: L.c("server yang aktif"),
  untuk: L.c("Untuk"), mengawasi: L.c("mengawasi"), panel: L.c("panel"), salah: L.c("Salah"), ptero: L.c("Pterodactyl"), panelName: L.c("Panel", 1),
  end: L.dur,
};

/** Small Telegram bubble used for the opening message trip. */
const Bubble: React.FC<{ text: string; side: "user" | "bot"; w?: number }> = ({ text, side, w = 300 }) => (
  <div style={{ width: w, padding: "14px 18px", borderRadius: 20, borderBottomLeftRadius: side === "bot" ? 6 : 20, borderBottomRightRadius: side === "user" ? 6 : 20,
    background: side === "user" ? C.telegram : "#fff", color: side === "user" ? "#fff" : C.ink, fontFamily: FONT, fontSize: 21, fontWeight: 500,
    boxShadow: "0 16px 40px rgba(10,10,12,0.14)", display: "flex", gap: 12, alignItems: "center", border: side === "bot" ? "1px solid rgba(0,0,0,0.06)" : undefined }}>
    {side === "bot" && <BrandLogo brand="telegram" size={26} />}
    {text}
  </div>
);

export const S01: React.FC = () => {
  const f = useCurrentFrame();

  /* --- shot A/B: white world with a message travelling to a server ---------------- */
  const toBlack = p(f, T.tapi + 90, T.tapi + 170, easeIn); // circle reveal from server
  const camX = kf(f, [T.hanya - 30, T.layar + 40, T.tapi + 20], [0, 0, 120]);
  const camZ = kf(f, [0, T.hanya, T.tapi, T.tapi + 170], [-200, -300, -260, 900], easeIO);
  const serverDraw = p(f, T.hanya - 10, T.hanya + 70, easeOut);
  const trip = p(f, T.hanya + 10, T.hanya + 110, easeIO); // user bubble trip
  const reply = p(f, T.layar - 10, T.layar + 100, easeOut);

  // message route (world coords)
  const route = "M -560 40 C -400 -120 -260 -140 -40 -10";
  const routeOut = "M 60 10 C 260 140 420 120 600 -20";
  const bx = mix(-560, -150, trip), by = mix(40, -70, trip) + Math.sin(trip * Math.PI) * -40;

  /* --- shot D/E/F: black world ---------------------------------------------------------- */
  const blackF = f - (T.tapi + 140);
  const wave = p(f, T.setiap - 60, T.setiap + 40, easeOut);
  const panelIn = p(f, T.untuk - 10, T.untuk + 90, easeOut);
  const panelOrbit = kf(f, [T.untuk, T.salah, T.end], [-22, -8, 6]);
  const titleIn = p(f, T.ptero - 12, T.ptero + 40, easeOut);
  const flatten = p(f, T.end - 70, T.end - 10, easeAnticipate);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {/* WHITE PART */}
      <AbsoluteFill style={{ opacity: 1 - p(f, T.tapi + 150, T.tapi + 175) }}>
        <DashedGrid f={f} ys={[540]} color="rgba(10,10,12,0.09)" o={life(f, 0, 60, T.hanya, 30)} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${kf(f, [T.bot - 10, T.bot + 20], [0, -40], easeOut)}px)` }}>
          <div style={{ position: "absolute", top: 500 }}>
            <Words f={f} text="Pesan masuk." at={T.pesan} times={[T.pesan, T.masuk]} size={40} out={T.bot - 6} outLen={20} />
          </div>
          <div style={{ position: "absolute", top: 540 }}>
            <Words f={f} text="Bot membalas." at={T.bot} times={[T.bot, T.membalas]} size={40} accent={[0]} accentColor={C.telegram} out={T.hanya - 20} outLen={22} />
          </div>
        </AbsoluteFill>

        <Stage cam={{ x: camX, z: camZ }}>
          <Flow f={f} d={route} color="rgba(10,10,12,0.3)" reveal={p(f, T.hanya - 20, T.hanya + 60)} width={2.2} glowOn={false} />
          <Flow f={f} d={routeOut} color="rgba(10,10,12,0.3)" reveal={p(f, T.layar - 20, T.layar + 50)} width={2.2} glowOn={false} />
          <Obj x={0} y={0} w={220} h={190} o={serverDraw} s={mix(0.9, 1, serverDraw)}>
            <ServerIllo d={serverDraw} f={f} color={C.ink} size={220} load={0.6} />
          </Obj>
          <Obj x={bx} y={by - 40} w={300} h={60} o={p(f, T.hanya - 6, T.hanya + 14) * (1 - p(f, T.hanya + 96, T.hanya + 116))} s={mix(1, 0.6, trip)}>
            <Bubble text="Halo, ada jadwal hari ini?" side="user" w={300} />
          </Obj>
          <Obj x={mix(120, 420, reply)} y={mix(50, 90, reply) - 70} w={320} h={60} o={reply * (1 - toBlack)} s={mix(0.6, 1, reply)}>
            <Bubble text="Ada. Rapat pukul 10.00" side="bot" w={320} />
          </Obj>
        </Stage>

        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 210 }}>
            <Words f={f} text="Sekejap." at={T.hanya + 30} size={30} color={C.gray} weight={500} out={T.layar - 20} />
          </div>
          <div style={{ position: "absolute", top: 210 }}>
            <Words f={f} text="Terlihat sederhana." at={T.layar + 60} size={30} color={C.gray} weight={500} out={T.tapi - 30} />
          </div>
          <div style={{ position: "absolute", top: 800 }}>
            <Words f={f} text="Apa yang bekerja di baliknya?" at={T.tapi} times={[T.tapi + 40, T.tapi + 48, T.tapi + 56, T.balik - 24, T.balik]} size={40} accent={[4]} out={T.tapi + 120} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* circle reveal into the black world, opening from the server */}
      <AbsoluteFill style={{ background: C.black, clipPath: `circle(${toBlack * 1300}px at 50% 50%)` }}>
        <AbsoluteFill style={{ opacity: wave }}>
          <WarmLight f={f} o={0.35 + panelIn * 0.4} y={620} r={1000} />
          <GlowWave f={f} y={600} amp={70 - panelIn * 30} reveal={wave} o={1 - titleIn * 0.35} />
        </AbsoluteFill>

        {/* D: app on an active machine */}
        <Stage cam={{ z: kf(f, [T.tapi + 140, T.setiap, T.untuk + 40], [500, 0, -200]), ry: kf(f, [T.setiap, T.untuk], [-6, 4]) }}>
          <Obj x={-260} y={-30} w={240} h={220} o={life(f, T.perangkat - 10, 40, T.untuk - 10, 40)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Icon name="Laptop" size={150} color="#fff" stroke={1.3} draw={p(f, T.perangkat - 10, T.perangkat + 40, easeOut)} />
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, fontWeight: 500 }}>Perangkat</div>
            </div>
          </Obj>
          <Obj x={260} y={-30} w={240} h={260} o={life(f, T.server - 10, 40, T.untuk - 10, 40)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <ServerIllo d={p(f, T.server - 10, T.server + 50, easeOut)} f={f} size={170} color="#fff" />
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                Server <StatusPill state="running" f={f} size={14} label="aktif" />
              </div>
            </div>
          </Obj>
          <Obj x={0} y={-30} w={200} h={200} o={life(f, T.aplikasi - 10, 30, T.untuk - 10, 40)} s={1 + 0.04 * Math.sin(f * 0.08)}>
            <div style={{ width: 200, height: 200, borderRadius: 40, background: "rgba(255,106,43,0.12)", border: `2px solid ${C.orange}`, boxShadow: glow(0.6),
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="Bot" size={96} color="#fff" stroke={1.5} draw={p(f, T.aplikasi - 10, T.aplikasi + 40)} />
            </div>
          </Obj>
          <Obj x={0} y={130} w={1000} h={60} o={life(f, T.aplikasi, 30, T.untuk - 10, 40)}>
            <Words f={f} text="Aplikasi yang terus berjalan" at={T.aplikasi} times={[T.aplikasi, T.aplikasi + 20, T.berjalan - 14, T.berjalan]} size={34} color="#fff" accent={[3]} />
          </Obj>
        </Stage>

        {/* E/F: management panel rises; title */}
        <Stage cam={{ z: kf(f, [T.untuk, T.salah, T.end], [200, 0, 120]), ry: panelOrbit * 0.3 }}>
          <DashedGrid f={blackF} xs={[520, 1400]} ys={[300, 790]} o={life(f, T.panel - 20, 40, T.ptero - 20, 40) * 0.5} reveal={p(f, T.panel - 20, T.panel + 40)} />
          <Obj x={0} y={mix(420, 20, panelIn) + flatten * 20 + titleIn * 90} z={-titleIn * 260} rx={mix(38, 10, panelIn) + flatten * 78} ry={panelOrbit} w={940} h={520} o={panelIn * (1 - p(f, T.end - 20, T.end))}>
            <Card w={940} h={520} tone="dark" glowA={0.9 - titleIn * 0.3} radius={24}>
              <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22, opacity: 1 - titleIn * 0.55 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <BrandLogo brand="telegram" size={34} />
                  <div style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>asisten-bot</div>
                  <StatusPill state="running" f={f} size={15} />
                  <div style={{ flex: 1 }} />
                  <PowerButtons scale={0.85} />
                </div>
                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: 2, height: 330, borderRadius: 12, background: "#0f1114", padding: 18, fontFamily: "'JetBrains Mono'", fontSize: 16, color: "#9aa3ad", lineHeight: "28px" }}>
                    {["[bot] memuat konfigurasi…", "[bot] terhubung ke layanan", "[bot] menunggu pesan", "[bot] pesan diterima, membalas"].map((l, i) => (
                      <div key={i} style={{ opacity: p(f, T.untuk + 40 + i * 30, T.untuk + 60 + i * 30), color: i === 3 ? C.ok : undefined }}>{l}</div>
                    ))}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                    {(["Cpu", "MemoryStick", "HardDrive"] as const).map((n, i) => (
                      <div key={n} style={{ height: 100, borderRadius: 12, background: "#23272e", display: "flex", alignItems: "center", gap: 14, padding: "0 18px" }}>
                        <Icon name={n} size={28} color={C.coral} draw={p(f, T.untuk + 30 + i * 12, T.untuk + 80 + i * 12)} />
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                          <div style={{ width: `${(0.2 + 0.15 * i + 0.06 * Math.sin(f * 0.05 + i)) * 100}%`, height: 8, borderRadius: 4, background: C.coral }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Obj>
        </Stage>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 150 }}>
            <Words f={f} text="Panel untuk mengawasi" at={T.untuk} times={[T.panel - 10, T.untuk + 10, T.mengawasi]} size={30} color="rgba(255,255,255,0.78)" weight={500} out={T.salah - 10} />
          </div>
          <div style={{ opacity: titleIn * (1 - flatten), transform: `translateY(${(1 - titleIn) * 30 - flatten * 60}px) scale(${mix(0.94, 1, titleIn)})`, filter: `blur(${(1 - titleIn) * 12}px)`,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <PteroLogo height={86} reveal={p(f, T.ptero - 6, T.panelName + 30, easeOut)} />
            <div style={{ color: "#fff", fontSize: 30, fontWeight: 500, letterSpacing: "0.32em", textTransform: "uppercase", opacity: p(f, T.panelName, T.panelName + 30) }}>Panel</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* hand-off: the panel flattens into the timeline line of the next scene */}
      <AbsoluteFill style={{ background: C.white, opacity: p(f, T.end - 34, T.end - 4) }}>
        <div style={{ position: "absolute", left: mix(960, 160, p(f, T.end - 34, T.end)), right: mix(960, 160, p(f, T.end - 34, T.end)), top: 539, height: 2, background: C.orange }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


export const sfx01 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + T.pesan, "text_in", 0.35), s(o + T.bot, "text_in", 0.35, 1.12),
    s(o + T.hanya - 12, "line_draw", 0.35), s(o + T.hanya - 4, "msg_out", 0.5), s(o + T.hanya + 100, "data_tick", 0.35),
    s(o + T.layar - 8, "msg_in", 0.45), s(o + T.tapi + 40, "text_in", 0.3, 0.9),
    s(o + T.tapi + 95, "swell_deep", 0.55), s(o + T.setiap - 50, "line_draw", 0.3, 0.8),
    s(o + T.aplikasi - 6, "settle_light", 0.4), s(o + T.perangkat - 8, "click_glass", 0.3), s(o + T.server - 8, "click_glass", 0.3, 0.85),
    s(o + T.untuk - 6, "panel_lift", 0.5), s(o + T.untuk + 80, "settle", 0.4), s(o + T.ptero - 14, "swell_bright", 0.4), s(o + T.end - 70, "panel_pass", 0.4),
  ];
};
