import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { easeBack, easeIO, easeOut, kf, life, mix, p } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, Flow, Label, LightStreak, Obj, Stage, Words, WarmLight } from "../components/Primitives";
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

const TILT = 64; // plates lie like floors

const Module: React.FC<{ icon: "Cpu" | "MemoryStick" | "HardDrive" | "Network"; label: string; q: number; f: number; seed: number }> = ({ icon, label, q, f, seed }) => (
  <div style={{ width: 170, height: 150, borderRadius: 18, background: "linear-gradient(160deg,#24262b,#17181b)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: glow(0.35 * q),
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, transform: `translateY(${-Math.sin(f * 0.05 + seed) * 4}px)` }}>
    <Icon name={icon} size={52} color={C.coral} draw={q} stroke={1.6} />
    <div style={{ color: "#fff", fontSize: 19, fontWeight: 600 }}>{label}</div>
  </div>
);

export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const vps = p(f, T.bawah - 20, T.vps + 40, easeOut);
  const mods = [T.cpu, T.ram, T.simpan, T.jaringan];
  const panelIn = p(f, T.atas - 14, T.panel + 40, easeOut);
  const wingsIn = p(f, T.wings - 20, T.wings + 30, easeOut);
  const contIn = p(f, T.mengelola - 10, T.container + 20, easeOut);
  const dive = kf(f, [T.container + 20, T.dalam, T.pesan - 30, T.pesan + 20], [0, 1, 1, 0]);
  const msgRoute = p(f, T.mengalir - 10, T.langsung + 20, easeOut);
  const noPanel = p(f, T.tidak - 10, T.tidak + 20, easeOut);

  const camY = kf(f, [0, T.vps, T.disediakan, T.atas + 20, T.perintah, T.wings + 20, T.container, T.pesan, T.end], [520, 300, 260, -40, -20, 80, 40, 0, 0]);
  const camZ = kf(f, [0, T.vps, T.disediakan, T.atas + 30, T.perintah + 30, T.container, T.pesan + 20, T.end], [400, 120, 260, 420, 520, 520, 620, 700]) - dive * 980;
  const camRy = kf(f, [0, T.disediakan, T.perintah, T.container, T.pesan, T.end], [-10, 8, -6, 0, -12, -8]);
  const camRx = kf(f, [0, T.atas, T.container, T.pesan, T.end], [-14, -8, -4, -10, -12]);
  const camX = kf(f, [0, T.pesan, T.mengalir, T.end], [0, 0, 180, 200]) ;

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.45} />
      <WarmLight f={f} o={0.4} y={760} r={1000} seed={4} />
      <Stage cam={{ x: camX, y: camY, z: camZ, ry: camRy, rx: camRx, persp: 1700 }}>
        {/* VPS plate */}
        <Obj x={0} y={360} w={1280} h={520} rx={TILT} o={vps} s={mix(0.9, 1, vps)}>
          <div style={{ width: 1280, height: 520, borderRadius: 34, background: "linear-gradient(160deg, #1b1c20, #0d0d0f)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: glow(0.75),
            transformStyle: "preserve-3d", position: "relative" }}>
            <div style={{ position: "absolute", left: 40, bottom: 34, display: "flex", alignItems: "center", gap: 16, color: "#fff" }}>
              <ServerIllo d={vps} f={f} size={90} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>VPS / mesin server</div>
                <div style={{ fontSize: 18, color: C.grayLight, fontFamily: MONO }}>node-01 · sumber daya komputasi</div>
              </div>
            </div>
            {/* resource modules stand up out of the plate */}
            {(["Cpu", "MemoryStick", "HardDrive", "Network"] as const).map((ic, i) => {
              const q = life(f, mods[i] - 10, 30, T.perintah, 40);
              return (
                <div key={ic} style={{ position: "absolute", left: 360 + i * 210, top: 70, transformStyle: "preserve-3d", transformOrigin: "50% 100%",
                  transform: `translateZ(${q * 10}px) rotateX(${-TILT * q}deg)`, opacity: q }}>
                  <Module icon={ic} label={["CPU", "RAM", "Penyimpanan", "Jaringan"][i]} q={q} f={f} seed={i} />
                </div>
              );
            })}
          </div>
        </Obj>

        {/* Wings plate + containers (on the same machine) */}
        <Obj x={0} y={120} w={1000} h={380} rx={TILT} z={60} o={wingsIn}>
          <div style={{ width: 1000, height: 380, borderRadius: 28, background: "linear-gradient(160deg, rgba(40,42,48,0.92), rgba(20,21,24,0.92))", border: `1px solid rgba(255,106,43,${0.3 + 0.3 * wingsIn})`,
            transformStyle: "preserve-3d", position: "relative", boxShadow: "0 0 60px rgba(255,106,43,0.25)" }}>
            <div style={{ position: "absolute", left: 30, bottom: 24, color: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
              <Icon name="Layers" size={40} color={C.orange} draw={wingsIn} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>Wings</div>
                <div style={{ fontSize: 17, color: C.grayLight }}>mengelola container di node</div>
              </div>
            </div>
            {[0, 1, 2].map((i) => {
              const q = p(f, T.mengelola - 10 + i * 10, T.mengelola + 30 + i * 10, easeBack);
              const main = i === 1;
              return (
                <div key={i} style={{ position: "absolute", left: 300 + i * 230, top: 40, transformStyle: "preserve-3d", transformOrigin: "50% 100%",
                  transform: `rotateX(${-TILT * q}deg)`, opacity: q * (main ? 1 : 1 - dive * 0.6) }}>
                  <div style={{ width: 200, height: 210, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${-Math.sin(f * 0.06 + i) * 5}px)` }}>
                    <ContainerIllo d={q} size={170} color={main ? "#fff" : "rgba(255,255,255,0.55)"} accent={main ? C.orange : C.gray} open={main ? kf(f, [T.container, T.dalam], [0, 0.9]) * (1 - p(f, T.pesan, T.pesan + 40)) : 0} />
                    <div style={{ color: main ? "#fff" : C.gray, fontSize: 17, fontWeight: 600, fontFamily: MONO }}>{["bot-wa", "asisten-bot", "notif-bot"][i]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Obj>

        {/* code running inside the main container (revealed by the dive) */}
        <Obj x={0} y={-60} z={240} w={560} h={300} o={life(f, T.dalam - 30, 30, T.pesan - 10, 30)} s={0.55}>
          <CodeCard f={f} at={T.dalam - 24} w={560} title="asisten-bot/index.js" size={20}
            lines={[{ text: "bot.on('message', async (msg) => {", tone: "kw" }, { text: "  const reply = await jawab(msg.text);", tone: "plain" }, { text: "  await msg.reply(reply);", tone: "plain" }, { text: "});", tone: "kw" }, { text: "// berjalan di dalam container", tone: "cm" }]} />
        </Obj>

        {/* Panel (browser) on top */}
        <Obj x={0} y={-330} z={0} w={720} h={300} o={panelIn * (1 - dive * 0.7)} ry={kf(f, [T.atas, T.end], [-8, 6])} rx={-6} s={mix(0.85, 1, panelIn)}>
          <div style={{ boxShadow: glow(0.6 * (1 - noPanel * 0.6)), borderRadius: 16, opacity: 1 - noPanel * 0.45 }}>
            <Browser w={720} h={300} tone="dark" url="panel.contoh.id">
              <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                <PteroLogo height={30} />
                <div style={{ display: "flex", gap: 10 }}>
                  {["asisten-bot", "bot-wa", "notif-bot"].map((n, i) => (
                    <div key={n} style={{ flex: 1, height: 110, borderRadius: 12, background: "#23272e", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ color: "#fff", fontSize: 17, fontFamily: MONO }}>{n}</div>
                      <StatusPill state="running" f={f + i * 20} size={13} />
                    </div>
                  ))}
                </div>
              </div>
            </Browser>
          </div>
        </Obj>

        {/* management path: Panel → Wings (orange, dashed) */}
        <Flow f={f} d="M -120 -170 C -140 -60 -120 20 -90 70" reveal={p(f, T.perintah - 10, T.wings + 10, easeOut) * (1 - dive)} color={C.orange} pulses={3} pulseSpeed={0.01} width={3} />
        <Obj x={-330} y={-80} w={300} h={44} o={life(f, T.perintah, 30, T.container, 30) + life(f, T.pesan + 10, 30, T.end + 99, 1) * 0.9}>
          <Label bg="rgba(255,106,43,0.16)" color={C.coral} size={18}><Icon name="Terminal" size={18} color={C.coral} /> jalur perintah</Label>
        </Obj>

        {/* message path: platform → bot directly (not via panel) */}
        <Obj x={820} y={-110} w={260} h={220} o={p(f, T.pesan - 10, T.pesan + 20)} s={mix(0.8, 1, p(f, T.pesan - 10, T.pesan + 30, easeBack))}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <BrandLogo brand="telegram" size={70} />
              <BrandLogo brand="whatsapp" size={70} />
            </div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 600, textAlign: "center" }}>Layanan platform</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.grayLight, fontSize: 16 }}><Icon name="Users" size={18} color={C.grayLight} /> pengguna</div>
          </div>
        </Obj>
        <Flow f={f} d="M 700 -130 C 400 -260 300 -320 300 -330" reveal={noPanel} color="rgba(255,255,255,0.35)" width={2} glowOn={false} o={1 - msgRoute * 0.6} />
        <Obj x={470} y={-250} w={64} h={64} o={noPanel} s={mix(0.5, 1, p(f, T.tidak - 6, T.tidak + 20, easeBack))}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: "rgba(240,82,79,0.18)", border: `2px solid ${C.err}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="X" size={34} color={C.err} stroke={2.6} draw={p(f, T.tidak, T.tidak + 20)} />
          </div>
        </Obj>
        <Flow f={f} d="M 700 -20 C 520 40 260 60 40 80" reveal={msgRoute} color={C.telegram} pulses={4} pulseSpeed={0.009} width={3} dashed={false} />
        <Flow f={f} d="M 720 30 C 540 110 280 120 50 100" reveal={p(f, T.wa - 10, T.langsung + 20, easeOut)} color={C.whatsapp} pulses={4} pulseSpeed={0.009} width={3} dashed={false} />
        <Obj x={480} y={140} w={300} h={44} o={p(f, T.mengalir, T.mengalir + 30)}>
          <Label bg="rgba(38,165,228,0.16)" color="#8fd3f5" size={18}><Icon name="MessageCircle" size={18} color="#8fd3f5" /> jalur pesan</Label>
        </Obj>
      </Stage>

      {/* key statements */}
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 92 }}>
          <Words f={f} text="Server menyediakan tenaga." at={T.disediakan} times={[T.cpu - 20, T.disediakan - 8, T.disediakan + 10]} size={40} color="#fff" accent={[2]} out={T.atas - 6} />
        </div>
        <div style={{ position: "absolute", top: 92 }}>
          <Words f={f} text="Panel mengelola." at={T.antarmuka} times={[T.panel, T.antarmuka]} size={40} color="#fff" accent={[1]} out={T.container - 30} />
        </div>
        <div style={{ position: "absolute", top: 92 }}>
          <Words f={f} text="Bot menjalankan logika." at={T.kode} times={[T.kode, T.kode + 12, T.kode + 26]} size={40} color="#fff" accent={[2]} out={T.pesan - 10} />
        </div>
        <div style={{ position: "absolute", top: 92 }}>
          <Words f={f} text="Pesan tidak lewat dashboard panel." at={T.pesan} times={[T.pesan, T.tidak, T.tidak + 12, T.dash, T.dash + 18]} size={36} color="#fff" accent={[1, 2]} accentColor={C.coral} out={T.end - 40} />
        </div>
        <div style={{ position: "absolute", bottom: 70 }}>
          <Words f={f} text="Container: lingkungan proses terpisah" at={T.container} times={[T.container, T.terpisah - 30, T.terpisah - 18, T.terpisah]} size={26} color="rgba(255,255,255,0.7)" weight={500} out={T.kode - 10} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx04 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + T.bawah - 20, "swell_deep", 0.45, 0.9), s(o + T.vps + 30, "settle", 0.45, 0.9),
    s(o + T.cpu - 10, "latch", 0.3), s(o + T.ram - 10, "latch", 0.3, 1.1), s(o + T.simpan - 10, "latch", 0.3, 0.95), s(o + T.jaringan - 10, "latch", 0.3, 1.2),
    s(o + T.atas - 14, "panel_lift", 0.45), s(o + T.panel + 30, "settle_light", 0.35), s(o + T.perintah - 10, "data_flow", 0.35),
    s(o + T.wings - 20, "panel_slide", 0.35, 0.8), s(o + T.mengelola - 10, "settle_light", 0.3), s(o + T.mengelola, "settle_light", 0.3, 1.1), s(o + T.mengelola + 10, "settle_light", 0.3, 1.25),
    s(o + T.container + 10, "warp", 0.4), s(o + T.dalam - 20, "type_long", 0.28), s(o + T.pesan - 30, "panel_pass", 0.35, 0.85),
    s(o + T.tidak - 6, "error_blip", 0.25), s(o + T.mengalir - 6, "data_flow", 0.4, 1.1), s(o + T.wa - 8, "msg_in", 0.3),
  ];
};
