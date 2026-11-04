import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { arc, breathe, clamp01, DRIFT, GLIDE, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, Flow, Label, LightStreak, Obj, Redacted, Stage, WarmLight } from "../components/Primitives";
import { CircleReveal, MBlur, SwapText } from "../components/Motion";
import { ContainerIllo } from "../components/Illustrations";
import { Icon } from "../components/Icon";
import { BrandLogo } from "../components/Logos";
import { ChatWindow, Msg, StatusPill } from "../components/UI";

const L = makeLocal("s07");
const T = {
  bagaimana: L.c("Bagaimana"), wa: L.c("WhatsApp"), misal: L.c("Misalnya"), info: L.c("bot informasi"), terima: L.c("menerima pesan"), siap: L.c("menyiapkan jawaban"),
  aplikasi: L.c("Aplikasi"), integrasi: L.c("integrasi"), auth: L.c("autentikasi"), kompat: L.c("kompatibilitas"), koneksi: L.c("koneksinya"), metode: L.c("metode"),
  digunakan: L.c("digunakan"), ptero: L.c("Pterodactyl"), kelola: L.c("mengelola proses"), sementara: L.c("sementara"), hubungan: L.c("hubungan"), ditangani: L.c("ditangani"),
  intbot: L.c("integrasi bot"), jadi: L.c("Jadi"), dua: L.c("dua hal"), aktif: L.c("proses yang aktif"), konplat: L.c("koneksi platform"), terhubung: L.c("terhubung"),
  status: L.c("Status Running"), belum: L.c("belum menjamin"), membalas: L.c("membalas"), end: L.dur,
};
const FLIP = T.end - 36;
const CHATP = { x: -380, y: 20 };

const msgs: Msg[] = [
  { t: T.misal + 14, from: "user", text: "Jam layanan hari ini?" },
  { t: T.siap - 10, from: "bot", text: "Senin–Jumat, 08.00–16.00\n(contoh balasan otomatis)", typing: 44 },
];

const cam = (f: number) =>
  rig(f, { x: 0, y: 0, z: 0 }, [
    { at: 20, to: { z: -80 }, feel: GLIDE },
    { at: T.misal - 16, to: { x: -180, z: -120, ry: 10 }, feel: WHIP },
    { at: T.info, to: { x: -60, ry: 4 }, feel: DRIFT },
    { at: T.aplikasi - 16, to: { x: -260, z: 80, ry: 10, rx: 4 }, feel: WHIP },
    { at: T.integrasi + 10, to: { x: 0, z: 60, ry: -3 }, feel: GLIDE },
    { at: T.kompat - 6, to: { x: 30, z: -60, ry: 4 }, feel: GLIDE },
    { at: T.ptero - 10, to: { x: -300, z: -40, ry: 8 }, feel: GLIDE },
    { at: T.sementara - 4, to: { x: 260, ry: -8 }, feel: GLIDE },
    { at: T.jadi - 14, to: { x: 0, z: 40, ry: 0, rx: 2 }, feel: GLIDE },
    { at: T.status, to: { x: 120, z: -80, ry: -5 }, feel: GLIDE },
    { at: FLIP, to: { x: 0, z: 0, ry: 0, rx: 0 }, feel: WHIP },
  ]);

const Block: React.FC<{ w?: number; h?: number; children: React.ReactNode; glowA?: number }> = ({ w = 330, h = 230, children, glowA = 0 }) => (
  <Card w={w} h={h} tone="dark" radius={24} glowA={glowA}>
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#fff", textAlign: "center", padding: 18, boxSizing: "border-box" }}>{children}</div>
  </Card>
);

export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 1, 7), f);
  const morph = clamp01(spr(f, 4, { stiffness: 120, damping: 18 }));
  const reveal = clamp01(spr(f, 8, { stiffness: 60, damping: 18 })) * 1300;
  const bubbleCol = interpolateColors(morph, [0, 1], [C.telegram, "#1fa855"]);
  const intoChat = (ff: number) => {
    const t = clamp01(spr(ff, T.misal - 10, { stiffness: 100, damping: 17 }));
    const [x, y, z] = arc(t, [0, 0, 0], [-150, -260, 260], [CHATP.x + 90, -190, 30]);
    return { x, y, z, t };
  };
  const { v: bq, d: bqd } = vel(intoChat, f);
  const chatQ = spr(f, T.misal - 20, PANEL) * (1 - out(f, T.aplikasi - 18, 14));
  const chainOut = clamp01(spr(f, T.jadi - 14, PANEL));
  const blocks = [
    { at: T.aplikasi - 10, from: [-1500, 200, -600], to: [-470, -40, 0] },
    { at: T.integrasi - 10, from: [0, -1100, 200], to: [0, -40, 0] },
    { at: T.integrasi + 14, from: [1500, -100, -600], to: [470, -40, 0] },
  ].map((b, i) => {
    const fn = (ff: number) => {
      const q = clamp01(spr(ff, b.at, { stiffness: 150, damping: 17 }));
      const [x, y, z] = arc(q, b.from as [number, number, number], [(b.from[0] + b.to[0]) / 2, b.to[1] - 200, 300], b.to as [number, number, number]);
      // collapse into the two status cards
      const target = i === 0 ? [-270, -40, 0] : [270, -40, 0];
      const cq = chainOut;
      return { x: lerp(x, target[0], cq), y: lerp(y, target[1], cq), z: lerp(z, target[2], cq) };
    };
    return { ...vel(fn, f), q: clamp01(spr(f, b.at, SNAP)), i };
  });
  const statusQ = clamp01((chainOut - 0.4) * 2);
  const connected = f >= T.terhubung - 4 && f < T.status + 10;
  const broken = f >= T.status + 10;
  const flip = spr(f, FLIP, { stiffness: 110, damping: 20 });

  const blockContent = (i: number) => {
    if (i === 0) return (<>
      <ContainerIllo d={clamp01((f - T.aplikasi + 10) / 24)} size={110} open={0.2} />
      <div style={{ fontSize: 23, fontWeight: 700 }}>Aplikasi bot</div>
      <div style={{ fontSize: 15, color: C.grayLight, fontFamily: MONO }}>di dalam container</div>
    </>);
    if (i === 1) return (<>
      <div style={{ display: "flex", gap: 14 }}>
        <Icon name="Plug" size={46} color={C.coral} draw={clamp01((f - T.integrasi + 6) / 16)} />
        <span style={{ display: "inline-block", transform: `rotate(${clamp01(spr(f, T.auth, POP)) * 90 - 90}deg)` }}><Icon name="KeyRound" size={46} color={C.coral} draw={clamp01((f - T.auth + 6) / 16)} /></span>
      </div>
      <div style={{ fontSize: 23, fontWeight: 700 }}>Integrasi & autentikasi</div>
      <div style={{ fontSize: 15, color: C.grayLight, fontFamily: MONO, opacity: clamp01((f - T.auth) / 10) }}>sesi/kunci:<Redacted n={7} />(disensor)</div>
    </>);
    return (<>
      <BrandLogo brand="whatsapp" size={84} />
      <div style={{ fontSize: 23, fontWeight: 700 }}>Layanan WhatsApp</div>
      <div style={{ fontSize: 15, color: C.grayLight }}>pihak platform</div>
    </>);
  };

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <CircleReveal r={reveal} bg={C.black}>
        <LightStreak f={f} o={0.35} angle={-32} seed={8} />
        <WarmLight f={f} o={0.4} y={620} r={1000} seed={9} />
        <Stage cam={c} blur={[cd.x, cd.y]}>
          {/* B: WhatsApp info bot */}
          <Obj x={lerp(-1300, CHATP.x, clamp01(chatQ))} y={CHATP.y} w={500} h={640} ry={lerp(40, 14, clamp01(chatQ))} z={-out(f, T.aplikasi - 18, 14) * 600} o={clamp01(chatQ * 3)}>
            <div style={{ boxShadow: glow(0.5), borderRadius: 26 }}>
              <ChatWindow f={f} platform="whatsapp" title="Info Layanan" subtitle="bot · contoh fiktif" msgs={msgs} w={500} h={640} dark />
            </div>
          </Obj>
          <Obj x={330} y={-40} w={580} h={210} o={1 - out(f, T.aplikasi - 18, 12)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[["Bot informasi", T.info, "Info"], ["menerima pesan", T.terima, "MessageCircle"], ["menyiapkan jawaban", T.siap, "Send"]].map(([t, at, ic]) => {
                const q = clamp01(spr(f, (at as number) - 8, SNAP));
                return (
                  <div key={t as string} style={{ display: "flex", alignItems: "center", gap: 14, opacity: q, transform: `translateX(${(1 - q) * 60}px)`, color: "#fff", fontSize: 32, fontWeight: 600 }}>
                    <Icon name={ic as "Info"} size={32} color={C.whatsapp} draw={q} /> {t}
                  </div>
                );
              })}
            </div>
          </Obj>

          {/* C: app -> integration -> platform, assembled from three directions */}
          {blocks.map((b) => (
            <Obj key={b.i} x={b.v.x} y={b.v.y} z={b.v.z} w={330} h={230} o={clamp01(b.q * 3) * (1 - statusQ) * (f > T.aplikasi - 12 ? 1 : 0)} s={1 - chainOut * 0.15}>
              <MBlur dx={b.d.x - cd.x} dy={b.d.y}><Block glowA={b.i === 1 ? 0.6 * clamp01((f - T.kompat) / 12) * (1 - chainOut) : 0}>{blockContent(b.i)}</Block></MBlur>
            </Obj>
          ))}
          <Flow f={f} d="M -300 -40 L -170 -40" reveal={clamp01((f - T.integrasi) / 12) * (1 - chainOut)} color={C.coral} pulses={2} width={2.5} />
          <Flow f={f} d="M 170 -40 L 300 -40" reveal={clamp01((f - T.integrasi - 20) / 12) * (1 - chainOut)} color={C.whatsapp} pulses={2} width={2.5} />
          <Obj x={0} y={160} w={1100} h={50} o={(1 - chainOut) * clamp01((f - T.kompat + 8) / 8)}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SwapText f={f} items={[{ at: T.kompat - 6, text: "Kompatibilitas & koneksi" }, { at: T.metode - 10, text: "bergantung pada metode integrasi", color: C.coral }]} size={30} weight={500} color="rgba(255,255,255,0.9)" />
            </div>
          </Obj>
          {/* responsibility zones drawn as underlines */}
          {([[-470, 360, T.ptero - 6, C.orange, C.coral, "Pterodactyl: mengelola proses aplikasi"], [235, 800, T.sementara, C.whatsapp, "#7fe3a7", "Integrasi bot: hubungan dengan platform"]] as const).map(([x, w, at, col, tc, t]) => {
            const q = clamp01(spr(f, at - 6, GLIDE)) * (1 - chainOut);
            return (
              <Obj key={t} x={x} y={130} w={w} h={90} o={clamp01(q * 3)}>
                <div style={{ height: 2, width: `${q * 100}%`, margin: "0 auto", background: col }} />
                <div style={{ paddingTop: 14, textAlign: "center", color: tc, fontSize: 20, fontWeight: 600, opacity: clamp01(q * 2 - 0.6) }}>{t}</div>
              </Obj>
            );
          })}

          {/* E/F: two statuses (the chain collapsed into them); then they flip toward the lens */}
          {[0, 1].map((i) => {
            const fx = i === 0 ? -270 : 270;
            const merge = clamp01(spr(f, FLIP - 4, WHIP));
            return (
              <Obj key={i} x={lerp(fx, 0, merge)} y={-40} z={flip * 1300 - i * 4} w={440} h={250} ry={(i === 0 ? 8 : -8) * (1 - merge) + flip * 180} o={statusQ * (i === 1 ? 1 - merge : 1)}
                s={lerp(0.85, 1, statusQ)} style={{ transformStyle: "preserve-3d" }}>
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
                  {i === 0 ? (
                    <Block w={440} h={250} glowA={0.45}>
                      <Icon name="Activity" size={44} color={C.ok} draw={clamp01((f - T.aktif + 10) / 18)} />
                      <div style={{ fontSize: 27, fontWeight: 700 }}>Proses aktif</div>
                      <StatusPill state={f < T.aktif - 6 ? "starting" : "running"} f={f} size={17} />
                    </Block>
                  ) : (
                    <Block w={440} h={250} glowA={0.45}>
                      <Icon name={broken ? "WifiOff" : "Wifi"} size={44} color={broken ? C.err : connected ? C.whatsapp : C.warn} draw={broken ? clamp01((f - T.status - 10) / 12) : 1} />
                      <div style={{ fontSize: 27, fontWeight: 700 }}>Koneksi platform</div>
                      <SwapText f={f} items={[{ at: 0, text: "menghubungkan…", color: C.warn }, { at: T.terhubung - 4, text: "terhubung", color: C.whatsapp }, { at: T.status + 10, text: "terputus (contoh)", color: C.err }]} size={18} />
                    </Block>
                  )}
                </div>
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 24, background: C.white }} />
              </Obj>
            );
          })}
          {/* a message that does not get answered while the platform link is down */}
          {broken && (
            <Obj x={lerp(520, 330, clamp01(spr(f, T.status + 14, PANEL)))} y={140} w={260} h={50} o={1 - out(f, FLIP - 6, 8)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 16, background: "#005c4b", color: "#e8eaed", fontSize: 18 }}>
                <Icon name="Clock" size={18} color="#e8eaed" /> belum terbalas
              </div>
            </Obj>
          )}
          <Obj x={0} y={210} w={1100} h={60} s={spr(f, T.status - 4, POP) * (1 - out(f, FLIP - 6, 8))}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Label bg="rgba(240,82,79,0.16)" color="#ff9a98" size={22}><Icon name="TriangleAlert" size={20} color="#ff9a98" /> "Running" belum menjamin bot bisa membalas</Label>
            </div>
          </Obj>
        </Stage>
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: 110 }}>
            <SwapText f={f} items={[{ at: T.bagaimana + 6, text: "Bagaimana dengan WhatsApp?", color: "#fff" }, { at: T.jadi + 20, text: "Perhatikan dua hal.", color: "#fff" }]} size={42}
              style={{ opacity: (1 - out(f, T.misal - 6, 10)) * (f < T.misal ? 1 : 0) + (f > T.jadi + 10 ? 1 - out(f, T.status - 16, 10) : 0) }} />
          </div>
        </AbsoluteFill>
      </CircleReveal>

      {/* the bubble from scene 6: turns green, then flies into the chat */}
      <Stage cam={c}>
        <Obj x={bq.x} y={bq.y} z={bq.z} w={360} h={70} s={lerp(1.2, 0.55, bq.t)} o={1 - clamp01((bq.t - 0.85) * 7)}>
          <MBlur dx={bqd.x - cd.x} dy={bqd.y}>
            <div style={{ position: "relative", padding: "18px 24px", borderRadius: 26, borderBottomRightRadius: 8, background: bubbleCol, color: "#fff", fontSize: 24, fontWeight: 600, textAlign: "center", boxShadow: `0 20px 60px rgba(0,0,0,${0.2 + morph * 0.3})` }}>
              <div style={{ position: "absolute", left: -46, top: 18, opacity: morph }}><BrandLogo brand="whatsapp" size={34} /></div>
              Pesan baru masuk
            </div>
          </MBlur>
        </Obj>
      </Stage>
      <AbsoluteFill style={{ background: C.white, opacity: clamp01((f - (T.end - 7)) / 6) }} />
    </AbsoluteFill>
  );
};

export const sfx07 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 4, "morph_up", 0.35, 0.9), s(o + 8, "swell_deep", 0.4, 1.2), s(o + T.bagaimana + 6, "scramble", 0.22),
    s(o + T.misal - 20, "whip_low", 0.3, 1.1), s(o + T.misal - 10, "whip_fast", 0.32), s(o + T.misal + 14, "msg_out", 0.35, 1.06), s(o + T.info - 8, "stack_ticks", 0.25),
    s(o + T.siap + 34, "msg_in", 0.38, 0.95), s(o + T.aplikasi - 18, "whip_air", 0.3), s(o + T.aplikasi, "impact_card", 0.35), s(o + T.integrasi - 10, "whip_low", 0.3, 1.2),
    s(o + T.integrasi + 2, "impact_soft", 0.35), s(o + T.auth, "latch", 0.35), s(o + T.integrasi + 14, "whip_fast", 0.28, 0.9), s(o + T.integrasi + 26, "impact_card", 0.32, 1.1),
    s(o + T.kompat - 6, "scramble", 0.2), s(o + T.metode - 10, "scramble", 0.2, 1.1), s(o + T.ptero - 6, "line_draw", 0.28), s(o + T.sementara, "line_draw", 0.28, 1.2),
    s(o + T.jadi - 14, "morph_down", 0.35), s(o + T.jadi + 10, "impact_soft", 0.3, 1.1), s(o + T.aktif - 6, "status_on", 0.22), s(o + T.terhubung - 4, "status_on", 0.22, 1.06),
    s(o + T.status + 10, "error_blip", 0.35), s(o + T.status + 14, "msg_out", 0.25, 0.85), s(o + FLIP - 4, "whip_air", 0.3), s(o + FLIP, "flip", 0.45), s(o + FLIP + 10, "lens_pass", 0.45, 1.15),
  ];
};

void DRIFT;
