import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { arc, breathe, clamp01, DRIFT, GLIDE, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Flow, Label, LightStreak, Obj, Stage, Words, WarmLight } from "../components/Primitives";
import { MBlur, SwapText } from "../components/Motion";
import { ContainerIllo, ServerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo, PteroLogo } from "../components/Logos";
import { Browser, CodeCard, StatusPill } from "../components/UI";

const L = makeLocal("s04");
const T = {
  mari: L.c("Mari"), bawah: L.c("Paling bawah"), vps: L.c("V P S"), mesin: L.c("mesin server"), cpu: L.c("C P U"), ram: L.c("ram"), simpan: L.c("penyimpanan"),
  jaringan: L.c("jaringan"), disediakan: L.c("disediakan"), atas: L.c("Di atasnya"), panel: L.c("Panel"), antarmuka: L.c("antarmuka"), browser: L.c("browser"),
  perintah: L.c("Perintah"), wings: L.c("Wings"), mengelola: L.c("mengelola container"), container: L.c("Container"), terpisah: L.c("terpisah"),
  dalam: L.c("di dalamnya"), kode: L.c("kode bot berjalan"), pesan: L.c("Pesan dari pengguna"), tidak: L.c("tidak lewat"), dash: L.c("dashboard"),
  mengalir: L.c("Pesan mengalir"), tg: L.c("Telegram"), wa: L.c("WhatsApp"), langsung: L.c("langsung"), end: L.dur,
};
const TILT = 64;
const HANDOFF = T.end - 24; // panel flies into the lens -> scene 5

const cam = (f: number) =>
  rig(f, { x: 0, y: 330, z: -900, rx: -30 }, [
    { at: 0, to: { z: 380, y: 260, rx: -14, ry: -8 }, feel: GLIDE },
    { at: T.cpu - 14, to: { x: -120, z: 200, ry: 6 }, feel: GLIDE },
    { at: T.jaringan - 10, to: { x: 120, ry: -6 }, feel: GLIDE },
    { at: T.atas - 10, to: { x: 0, y: -60, z: 460, rx: -6, ry: 4 }, feel: WHIP },
    { at: T.perintah - 6, to: { y: 0, z: 520, ry: -8 }, feel: GLIDE },
    { at: T.container + 6, to: { y: 60, z: -460, rx: -2, ry: 0 }, feel: { stiffness: 140, damping: 22 } },
    { at: T.pesan - 26, to: { x: 200, y: -20, z: 640, ry: -14, rx: -10 }, feel: GLIDE },
    { at: T.mengalir, to: { x: 240, ry: -10 }, feel: DRIFT },
    { at: HANDOFF, to: { x: 0, y: -330, ry: 0, rx: 0, z: 300 }, feel: WHIP },
  ]);

const Module: React.FC<{ icon: "Cpu" | "MemoryStick" | "HardDrive" | "Network"; label: string; q: number; f: number; i: number }> = ({ icon, label, q, f, i }) => (
  <div style={{ width: 176, height: 160, borderRadius: 18, background: "linear-gradient(160deg,#25272c,#16171a)", border: "1px solid rgba(255,138,92,0.28)", boxShadow: glow(0.4 * clamp01(q)),
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
    <Icon name={icon} size={54} color={C.coral} draw={clamp01(q)} stroke={1.6} />
    <div style={{ color: "#fff", fontSize: 19, fontWeight: 600 }}>{label}</div>
    <div style={{ width: 120, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
      <div style={{ width: `${clamp01(q) * (30 + 25 * (0.5 + 0.5 * Math.sin(f * 0.06 + i * 1.7)))}%`, height: 5, borderRadius: 3, background: C.coral }} />
    </div>
  </div>
);

export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 0.9, 4), f);
  const vps = spr(f, 0, PANEL);
  const mods = [T.cpu, T.ram, T.simpan, T.jaringan];
  const panelQ = spr(f, T.atas - 12, { stiffness: 110, damping: 17 });
  const wingsQ = spr(f, T.wings - 18, PANEL);
  const dive = clamp01(spr(f, T.container + 6, GLIDE)) * (1 - clamp01(spr(f, T.pesan - 26, GLIDE)));
  const noPanel = spr(f, T.tidak - 8, SNAP);
  const route = clamp01((f - T.mengalir + 6) / 30);
  const hand = out(f, HANDOFF, 24);
  // command packets Panel -> Wings
  const packets = [0, 1, 2].map((k) => {
    const at = T.perintah + k * 16;
    const t = clamp01((f - at) / 26);
    const [x, y] = arc(t, [-110, -180, 0], [-170, -40, 0], [-90 + k * 230 - 230, 100, 0]);
    return { x, y, o: t > 0 && t < 1 ? 1 : 0, k };
  });
  // a user message that bounces off the panel and reroutes to the bot
  const msg = (ff: number) => {
    const t1 = clamp01((ff - T.pesan + 4) / 34);
    const bounce = clamp01((ff - T.tidak - 4) / 30);
    let [x, y] = arc(t1, [820, -60, 0], [640, -320, 0], [380, -300, 0]);
    if (ff > T.tidak + 4) [x, y] = arc(bounce, [380, -300, 0], [680, -120, 0], [760, 0, 0]);
    const t2 = clamp01((ff - T.mengalir + 2) / 40);
    if (ff > T.mengalir - 2) [x, y] = arc(t2, [760, 0, 0], [420, 60, 0], [40, 70, 0]);
    return { x, y };
  };
  const { v: m, d: md } = vel(msg, f);
  const msgO = clamp01((f - T.pesan + 4) / 6) * (1 - out(f, T.mengalir + 36, 8));

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.45} />
      <WarmLight f={f} o={0.4} y={760} r={1000} seed={4} />
      <Stage cam={c} blur={[cd.x, cd.y * 0.6]} >
        {/* VPS plate */}
        <Obj x={0} y={360} w={1280} h={520} rx={TILT} s={lerp(0.96, 1, vps)}>
          <div style={{ width: 1280, height: 520, borderRadius: 34, background: "linear-gradient(160deg, #1b1c20, #0d0d0f)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: glow(0.75),
            transformStyle: "preserve-3d", position: "relative" }}>
            <div style={{ position: "absolute", left: 40, bottom: 34, display: "flex", alignItems: "center", gap: 16, color: "#fff" }}>
              <ServerIllo d={clamp01((f - 6) / 30)} f={f} size={90} />
              <div>
                <SwapText f={f} items={[{ at: T.vps - 10, text: "VPS / mesin server" }]} size={30} weight={700} color="#fff" align="left" />
                <div style={{ fontSize: 18, color: C.grayLight, fontFamily: MONO, opacity: clamp01((f - T.mesin) / 10) }}>node-01 · sumber daya komputasi</div>
              </div>
            </div>
            {(["Cpu", "MemoryStick", "HardDrive", "Network"] as const).map((ic, i) => {
              const q = spr(f, mods[i] - 12, { stiffness: 200, damping: 16 });
              return (
                <div key={ic} style={{ position: "absolute", left: 350 + i * 215, top: 64, transformStyle: "preserve-3d", transformOrigin: "50% 100%",
                  transform: `translateZ(${clamp01(q) * 12}px) rotateX(${-TILT * q}deg)`, opacity: clamp01(q * 3) }}>
                  <Module icon={ic} label={["CPU", "RAM", "Penyimpanan", "Jaringan"][i]} q={q} f={f} i={i} />
                </div>
              );
            })}
          </div>
        </Obj>

        {/* Wings plate slides in on the same machine; containers pop as commands arrive */}
        <Obj x={lerp(1700, 0, wingsQ)} y={120} w={1000} h={380} rx={TILT} z={60} o={clamp01(wingsQ * 2)}>
          <div style={{ width: 1000, height: 380, borderRadius: 28, background: "linear-gradient(160deg, rgba(40,42,48,0.94), rgba(20,21,24,0.94))", border: "1px solid rgba(255,106,43,0.55)",
            transformStyle: "preserve-3d", position: "relative", boxShadow: "0 0 60px rgba(255,106,43,0.25)" }}>
            <div style={{ position: "absolute", left: 30, bottom: 24, color: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
              <Icon name="Layers" size={40} color={C.orange} draw={clamp01(wingsQ)} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>Wings</div>
                <div style={{ fontSize: 17, color: C.grayLight }}>mengelola container di node</div>
              </div>
            </div>
            {[0, 1, 2].map((i) => {
              const q = spr(f, T.perintah + 22 + i * 16, { stiffness: 260, damping: 15 });
              const main = i === 1;
              return (
                <div key={i} style={{ position: "absolute", left: 300 + i * 230, top: 40, transformStyle: "preserve-3d", transformOrigin: "50% 100%",
                  transform: `rotateX(${-TILT * Math.min(1.1, q)}deg)`, opacity: clamp01(q * 3) * (main ? 1 : 1 - dive * 0.7) }}>
                  <div style={{ width: 200, height: 210, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <ContainerIllo d={clamp01(q)} size={170} color={main ? "#fff" : "rgba(255,255,255,0.55)"} accent={main ? C.orange : C.gray}
                      open={main ? dive * 0.95 : 0.05 * Math.sin(f * 0.08 + i)} />
                    <div style={{ color: main ? "#fff" : C.gray, fontSize: 17, fontWeight: 600, fontFamily: MONO }}>{["bot-wa", "asisten-bot", "notif-bot"][i]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Obj>
        {packets.map((pk) => (
          <Obj key={pk.k} x={pk.x} y={pk.y} w={90} h={34} o={pk.o * (1 - dive)}>
            <div style={{ padding: "6px 12px", borderRadius: 17, background: C.orange, color: "#fff", fontFamily: MONO, fontSize: 15, fontWeight: 600, boxShadow: "0 0 24px rgba(255,106,43,0.9)", textAlign: "center" }}>start</div>
          </Obj>
        ))}

        {/* the camera dives into the container and finds the bot running inside */}
        <Obj x={0} y={lerp(40, -70, clamp01(spr(f, T.dalam - 26, PANEL)))} z={240} w={560} h={300} s={lerp(0.1, 0.58, clamp01(spr(f, T.dalam - 26, PANEL)))}
          o={clamp01((f - T.dalam + 26) / 8) * (1 - out(f, T.pesan - 24, 10))}>
          <CodeCard f={f} at={T.dalam - 16} w={560} title="asisten-bot/index.js" size={20}
            lines={[{ text: "bot.on('message', async (msg) => {", tone: "kw" }, { text: "  const reply = await jawab(msg.text);", tone: "plain" }, { text: "  await msg.reply(reply);", tone: "plain" }, { text: "});", tone: "kw" }, { text: "// berjalan di dalam container", tone: "cm" }]}
            hiLine={Math.floor(Math.max(0, f - T.kode) / 14) % 3} hiA={f > T.kode ? 1 : 0} hiColor={C.ok} />
        </Obj>

        {/* Panel (browser) descends from in front of the lens */}
        <Obj x={lerp(0, 0, hand)} y={-330} z={lerp(900, 0, clamp01(panelQ)) + hand * 1250} w={720} h={300} ry={lerp(-30, -6, clamp01(panelQ)) * (1 - hand)} rx={-6 * (1 - hand)}
          o={clamp01(panelQ * 4) * (1 - dive * 0.75)}>
          <div style={{ boxShadow: glow(0.6 * (1 - noPanel * 0.6)), borderRadius: 16, opacity: 1 - noPanel * 0.4 * (1 - hand) }}>
            <Browser w={720} h={300} tone="dark" url="panel.contoh.id">
              <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                <PteroLogo height={30} reveal={clamp01((f - T.panel + 6) / 20)} />
                <div style={{ display: "flex", gap: 10 }}>
                  {["asisten-bot", "bot-wa", "notif-bot"].map((n, i) => {
                    const q = clamp01(spr(f, T.antarmuka - 6 + i * 4, SNAP));
                    return (
                      <div key={n} style={{ flex: 1, height: 110, borderRadius: 12, background: "#23272e", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: q, transform: `translateY(${(1 - q) * 20}px)` }}>
                        <div style={{ color: "#fff", fontSize: 17, fontFamily: MONO }}>{n}</div>
                        <StatusPill state={f < T.perintah + 22 + i * 16 ? "offline" : f < T.perintah + 60 + i * 16 ? "starting" : "running"} f={f + i * 20} size={13} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Browser>
          </div>
        </Obj>

        <Flow f={f} d="M -120 -170 C -150 -60 -130 20 -90 70" reveal={clamp01((f - T.perintah + 8) / 18) * (1 - dive) * (1 - hand)} color={C.orange} width={3} />
        <Obj x={-340} y={-80} w={300} h={44} s={spr(f, T.perintah - 4, POP) * (1 - dive) * (1 - out(f, HANDOFF, 8))}>
          <Label bg="rgba(255,106,43,0.16)" color={C.coral} size={18}><Icon name="Terminal" size={18} color={C.coral} /> jalur perintah</Label>
        </Obj>

        {/* message path: platform -> bot directly */}
        <Obj x={880} y={-110} w={260} h={220} s={spr(f, T.pesan - 14, PANEL) * (1 - out(f, HANDOFF, 10))}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 16 }}><BrandLogo brand="telegram" size={70} /><BrandLogo brand="whatsapp" size={70} /></div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 600 }}>Layanan platform</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.grayLight, fontSize: 16 }}><Icon name="Users" size={18} color={C.grayLight} /> pengguna</div>
          </div>
        </Obj>
        <Obj x={480} y={-250} w={70} h={70} s={noPanel * (1 - out(f, T.mengalir + 20, 10))}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: "rgba(240,82,79,0.2)", border: `2px solid ${C.err}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="X" size={36} color={C.err} stroke={2.6} draw={clamp01((f - T.tidak) / 12)} />
          </div>
        </Obj>
        <Flow f={f} d="M 700 -20 C 520 40 260 60 40 80" reveal={route * (1 - hand)} color={C.telegram} pulses={4} pulseSpeed={0.012} width={3} dashed={false} />
        <Flow f={f} d="M 720 30 C 540 110 280 120 50 100" reveal={clamp01((f - T.wa + 6) / 30) * (1 - hand)} color={C.whatsapp} pulses={4} pulseSpeed={0.012} width={3} dashed={false} />
        <Obj x={m.x} y={m.y} z={60} w={64} h={48} o={msgO}>
          <MBlur dx={md.x - cd.x} dy={md.y}>
            <div style={{ width: 64, height: 48, borderRadius: 16, borderBottomLeftRadius: 4, background: C.telegram, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(38,165,228,0.7)" }}>
              <Icon name="MessageCircle" size={26} color="#fff" />
            </div>
          </MBlur>
        </Obj>
        <Obj x={500} y={150} w={300} h={44} s={spr(f, T.mengalir - 4, POP) * (1 - out(f, HANDOFF, 8))}>
          <Label bg="rgba(38,165,228,0.18)" color="#8fd3f5" size={18}><Icon name="MessageCircle" size={18} color="#8fd3f5" /> jalur pesan</Label>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center", opacity: 1 - out(f, HANDOFF, 10) }}>
        <div style={{ position: "absolute", top: 90 }}>
          <SwapText f={f} items={[
            { at: T.cpu - 16, text: "Server menyediakan tenaga.", color: "#fff" },
            { at: T.panel - 4, text: "Panel mengelola.", color: "#fff" },
            { at: T.kode - 6, text: "Bot menjalankan logika.", color: "#fff" },
            { at: T.pesan - 6, text: "Pesan tidak lewat dashboard panel.", color: "#fff" },
          ]} size={40} weight={600} />
        </div>
        <div style={{ position: "absolute", bottom: 66 }}>
          <Words f={f} text="Container: lingkungan proses terpisah" at={T.container} times={[T.container, T.terpisah - 30, T.terpisah - 18, T.terpisah]} size={26} color="rgba(255,255,255,0.75)" weight={500} out={T.kode - 10} outLen={10} />
        </div>
      </AbsoluteFill>
      {/* opening: same dark tone that closed scene 3 */}
      <AbsoluteFill style={{ background: "#111113", opacity: 1 - clamp01(f / 10) }} />
      {/* closing: the panel fills the lens; scene 5 starts from its surface colour */}
      <AbsoluteFill style={{ background: "#1b1e23", opacity: clamp01((f - (T.end - 7)) / 6) }} />
    </AbsoluteFill>
  );
};

export const sfx04 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o, "swell_deep", 0.4, 1.1), s(o + 26, "settle", 0.35, 0.9), s(o + T.vps - 10, "scramble", 0.22),
    s(o + T.cpu - 12, "impact_card", 0.3), s(o + T.ram - 12, "impact_card", 0.3, 1.1), s(o + T.simpan - 12, "impact_card", 0.3, 0.95), s(o + T.jaringan - 12, "impact_card", 0.3, 1.2),
    s(o + T.atas - 12, "lens_pass", 0.35, 1.25), s(o + T.atas + 12, "impact_soft", 0.35, 1.1), s(o + T.panel - 4, "scramble", 0.2),
    s(o + T.perintah, "data_flow", 0.3, 1.1), s(o + T.wings - 18, "whip_low", 0.35), s(o + T.perintah + 24, "impact_glass", 0.28), s(o + T.perintah + 40, "impact_glass", 0.28, 1.1), s(o + T.perintah + 56, "impact_glass", 0.28, 1.2),
    s(o + T.container + 6, "whip_fast", 0.35, 0.8), s(o + T.container + 20, "latch", 0.35), s(o + T.dalam - 22, "rise_short", 0.3), s(o + T.kode - 4, "type_long", 0.25),
    s(o + T.pesan - 26, "whip_air", 0.3), s(o + T.pesan - 4, "msg_out", 0.35), s(o + T.tidak + 4, "error_blip", 0.3), s(o + T.mengalir - 2, "data_flow", 0.35, 1.05),
    s(o + T.mengalir + 38, "msg_in", 0.35), s(o + HANDOFF, "rise_short", 0.35, 0.9), s(o + T.end - 10, "lens_pass", 0.4, 1.1),
  ];
};

void DRIFT; void WHIP;
