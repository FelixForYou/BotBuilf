import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { easeIO, easeOut, kf, life, mix, p, drift } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, Flow, Obj, Stage, Words, WarmLight, GlowWave, LightStreak } from "../components/Primitives";
import { ContainerIllo, ServerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo, PteroLogo } from "../components/Logos";
import { ChatWindow, ConsoleView, Graph, Line, Msg, PowerButtons, StatusPill, series } from "../components/UI";

const L = makeLocal("s10");
const T = {
  jadi: L.c("Jadi"), ptero: L.c("Pterodactyl"), berawal: L.c("berawal"), game: L.c("server game"), dengan: L.c("Dengan lingkungan"), tg: L.c("Telegram"), wa: L.c("WhatsApp"),
  pm: L.c("Panel mengelola"), st: L.c("server menyediakan"), tenaga: L.c("tenaga"), bl: L.c("bot menjalankan"), logika: L.c("logikanya"), kini: L.c("Kini"),
  membalas: L.c("membalas"), tahu: L.c("kamu tahu"), balik: L.c("baliknya"), kenali: L.c("Kenali"), botmu: L.c("botmu"), speechEnd: L.end, end: L.dur,
};

const logs: Line[] = Array.from({ length: 30 }).map((_, i) => ({
  t: i * 48, text: ["[info] pesan masuk", "[ok]   balasan terkirim", "[info] notifikasi dikirim", "[info] menunggu pesan"][i % 4], kind: (["in", "ok", "info", "dim"] as const)[i % 4],
}));
const tgMsgs: Msg[] = [{ t: 0, from: "user", text: "/jadwal" }, { t: 20, from: "bot", text: "Agenda hari ini siap." }, { t: T.kini + 20, from: "user", text: "Terima kasih!" }, { t: T.kini + 70, from: "bot", text: "Sama-sama." }];
const waMsgs: Msg[] = [{ t: 0, from: "user", text: "Jam layanan?" }, { t: 30, from: "bot", text: "08.00–16.00 (contoh)" }];
const cpu = series(21, 10, 6, [[40, 12, 4], [140, 16, 5]]);

type Piece = { k: string; x: number; y: number; z: number; ry: number; w: number; h: number; t: number };

export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const pieces: Piece[] = [
    { k: "panel", x: 0, y: -30, z: 0, ry: 0, w: 660, h: 380, t: 0 },
    { k: "server", x: -600, y: -200, z: -220, ry: 18, w: 330, h: 270, t: T.ptero - 10 },
    { k: "container", x: -560, y: 190, z: -120, ry: 16, w: 320, h: 250, t: T.berawal },
    { k: "console", x: 600, y: -210, z: -180, ry: -18, w: 440, h: 250, t: T.game - 10 },
    { k: "graph", x: 620, y: 170, z: -100, ry: -16, w: 430, h: 220, t: T.game + 10 },
    { k: "tg", x: -250, y: 330, z: 140, ry: 8, w: 340, h: 250, t: T.tg - 16 },
    { k: "wa", x: 260, y: 340, z: 160, ry: -8, w: 340, h: 250, t: T.wa - 16 },
  ];
  const pullBack = kf(f, [0, T.pm, T.kini, T.kenali, T.end], [-260, -120, 80, 420, 620], easeIO);
  const orbit = kf(f, [0, T.end], [-10, 9], easeIO);
  const clusterOut = p(f, T.kenali + 20, T.speechEnd + 40, easeIO);
  const titleIn = p(f, T.speechEnd + 10, T.speechEnd + 60, easeOut);
  const fadeOut = p(f, T.end - 46, T.end - 2, easeIO);
  const hi = (k: string) => (k === "panel" ? life(f, T.pm - 10, 20, T.st - 6, 20) : k === "server" ? life(f, T.st - 10, 20, T.bl - 6, 20) : k === "container" || k === "tg" ? life(f, T.bl - 10, 20, T.kini - 6, 20) : 0);

  const render = (pc: Piece) => {
    switch (pc.k) {
      case "panel":
        return (
          <Card w={pc.w} h={pc.h} tone="dark" radius={22} glowA={0.7 + hi("panel") * 0.5}>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}><PteroLogo height={28} /><div style={{ flex: 1 }} /><StatusPill state="running" f={f} size={14} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 20, fontWeight: 600 }}>
                <BrandLogo brand="telegram" size={26} /> asisten-bot <div style={{ flex: 1 }} /><PowerButtons scale={0.72} />
              </div>
              <ConsoleView f={f + 400} lines={logs.map((l) => ({ ...l, t: l.t }))} w={616} h={220} size={15} />
            </div>
          </Card>
        );
      case "server":
        return (
          <Card w={pc.w} h={pc.h} tone="dark" radius={22} glowA={0.35 + hi("server") * 0.6}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#fff" }}>
              <ServerIllo d={1} f={f} size={150} /><div style={{ fontSize: 21, fontWeight: 600 }}>Server</div>
            </div>
          </Card>
        );
      case "container":
        return (
          <Card w={pc.w} h={pc.h} tone="dark" radius={22} glowA={0.35 + hi("container") * 0.6}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#fff" }}>
              <ContainerIllo d={1} size={140} open={0.25 + 0.1 * Math.sin(f * 0.04)} /><div style={{ fontSize: 21, fontWeight: 600 }}>Container</div>
            </div>
          </Card>
        );
      case "console":
        return (
          <Card w={pc.w} h={pc.h} tone="ink" radius={22} glowA={0.35}>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", fontSize: 17, fontWeight: 600, marginBottom: 10 }}><Icon name="Terminal" size={20} color={C.coral} /> Console</div>
              <ConsoleView f={f + 200} lines={logs} w={408} h={176} size={15} />
            </div>
          </Card>
        );
      case "graph":
        return <div style={{ boxShadow: glow(0.35), borderRadius: 12 }}><Graph f={f} w={pc.w} h={pc.h} fn={cpu} color={C.coral} label="CPU" icon="Cpu" unit={(v) => `${v.toFixed(1)}%`} /></div>;
      case "tg":
        return <div style={{ boxShadow: glow(0.3 + hi("tg") * 0.5), borderRadius: 26 }}><ChatWindow f={f} platform="telegram" title="Asisten Bot" msgs={tgMsgs} w={pc.w} h={pc.h} dark /></div>;
      case "wa":
        return <div style={{ boxShadow: glow(0.3), borderRadius: 26 }}><ChatWindow f={f} platform="whatsapp" title="Info Layanan" msgs={waMsgs} w={pc.w} h={pc.h} dark /></div>;
    }
    return null;
  };

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
        <LightStreak f={f} o={0.5 * (1 - clusterOut * 0.6)} angle={-26} seed={12} />
        <WarmLight f={f} o={0.55} y={560} r={1100} seed={13} />
        <GlowWave f={f} y={560} amp={kf(f, [T.kenali, T.end], [10, 46])} o={titleIn * 0.8} reveal={titleIn} />
        <Stage cam={{ z: pullBack, ry: orbit, rx: 6 + drift(f, 3, 0.01) * 1.5, persp: 1700 }}>
          {pieces.map((pc, i) => {
            const q = p(f, pc.t - 10, pc.t + 50, easeOut);
            const bob = Math.sin(f * 0.03 + i * 1.3) * 8;
            return (
              <Obj key={pc.k} x={pc.x * mix(1.6, 1, q)} y={pc.y * mix(1.4, 1, q) + bob} z={mix(pc.z - 900, pc.z, q) - clusterOut * 300} ry={pc.ry * q} w={pc.w} h={pc.h}
                o={q * (1 - clusterOut * 0.85)} s={1 + hi(pc.k) * 0.05}>
                {render(pc)}
              </Obj>
            );
          })}
          {/* a last message travelling through the system */}
          <Flow f={f} d="M -250 250 C -200 120 -120 60 0 40 C 120 60 200 140 260 250" reveal={life(f, T.kini - 10, 50, T.kenali + 10, 30)} color={C.telegram} pulses={3} pulseSpeed={0.012} width={3} />
        </Stage>

        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 80 }}>
            <Words f={f} text="Berawal dari pengelolaan server game." at={T.berawal} times={[T.berawal, T.berawal + 14, T.game - 18, T.game, T.game + 12]} size={34} color="#fff" weight={500} accent={[3, 4]} out={T.pm - 14} />
          </div>
          <div style={{ position: "absolute", top: 80 }}>
            <Words f={f} text="Panel mengelola. Server menyediakan tenaga. Bot menjalankan logika." at={T.pm}
              times={[T.pm, T.pm + 16, T.st, T.st + 14, T.tenaga, T.bl, T.bl + 14, T.logika]} size={34} color="#fff" weight={600} accent={[1, 4, 7]} out={T.kini - 10} />
          </div>
          <div style={{ position: "absolute", top: 80 }}>
            <Words f={f} text="Setiap kali bot membalas, kamu tahu apa yang bekerja." at={T.kini} stagger={9} size={32} color="rgba(255,255,255,0.85)" weight={500} out={T.kenali - 14} />
          </div>
        </AbsoluteFill>

        {/* final title */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, transform: `translateY(${-30 + (1 - titleIn) * 24}px) scale(${mix(0.96, 1, titleIn) + p(f, T.speechEnd, T.end, easeIO) * 0.02})`,
            opacity: titleIn, filter: `blur(${(1 - titleIn) * 10}px)` }}>
            <PteroLogo height={84} reveal={p(f, T.speechEnd + 10, T.speechEnd + 70, easeOut)} />
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 500, letterSpacing: "0.32em", textTransform: "uppercase" }}>Panel</div>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 690 }}>
            <Words f={f} text="Kenali proses di balik botmu." at={T.kenali} times={[T.kenali, T.kenali + 14, T.kenali + 30, T.botmu - 10, T.botmu]} size={40} color="#fff" accent={[4]} />
          </div>
          <div style={{ position: "absolute", bottom: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: p(f, T.speechEnd + 50, T.speechEnd + 90) }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 20, fontWeight: 500, letterSpacing: "0.04em" }}>Visual explainer by FELIXIORITY</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: MONO }}>Tidak berafiliasi dengan Pterodactyl, Telegram, maupun WhatsApp. Data di layar adalah simulasi.</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx10 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 10, "panel_lift", 0.3, 0.95), s(o + T.ptero - 10, "settle_light", 0.3), s(o + T.berawal, "settle_light", 0.28, 1.1), s(o + T.game - 10, "settle_light", 0.28, 0.9),
    s(o + T.game + 10, "settle_light", 0.25, 1.2), s(o + T.tg - 16, "msg_in", 0.3), s(o + T.wa - 16, "msg_in", 0.3, 1.06), s(o + T.pm - 10, "click_glass", 0.25),
    s(o + T.st - 10, "click_glass", 0.25, 0.9), s(o + T.bl - 10, "click_glass", 0.25, 1.1), s(o + T.kini - 10, "data_flow", 0.3), s(o + T.kini + 20, "msg_out", 0.3),
    s(o + T.kini + 70, "msg_in", 0.3, 0.92), s(o + T.kenali + 20, "panel_pass", 0.3, 0.8), s(o + T.speechEnd + 6, "swell_bright", 0.3, 0.75),
    s(18000 - 230, "resolve", 0.35),
  ];
};
