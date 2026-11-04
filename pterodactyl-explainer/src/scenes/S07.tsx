import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { easeBack, easeIO, easeOut, kf, life, mix, p } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, Flow, Label, Obj, Redacted, Stage, Words, WarmLight, LightStreak } from "../components/Primitives";
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

const msgs: Msg[] = [
  { t: T.terima - 10, from: "user", text: "Jam layanan hari ini?" },
  { t: T.siap - 6, from: "bot", text: "Senin–Jumat, 08.00–16.00\n(contoh balasan otomatis)", typing: 50 },
];

const Block: React.FC<{ w?: number; children: React.ReactNode; glowA?: number }> = ({ w = 330, children, glowA = 0 }) => (
  <Card w={w} h={230} tone="dark" radius={24} glowA={glowA}>
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#fff", textAlign: "center", padding: 18 }}>{children}</div>
  </Card>
);

export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const morph = p(f, 10, 90, easeIO);
  const bubbleOut = p(f, T.misal - 30, T.misal + 10, easeIO);
  const chat = life(f, T.misal - 20, 40, T.aplikasi - 10, 40);
  const chain = p(f, T.aplikasi - 20, T.integrasi + 30, easeOut);
  const zones = p(f, T.ptero - 20, T.ptero + 20, easeOut);
  const zone2 = p(f, T.sementara - 10, T.hubungan + 30, easeOut);
  const chainOut = p(f, T.jadi - 20, T.jadi + 20, easeIO);
  const statusIn = p(f, T.dua - 20, T.dua + 20, easeOut);
  const connected = f >= T.terhubung - 4 && f < T.status + 10;
  const broken = f >= T.status + 10;
  const camZ = kf(f, [0, T.misal, T.aplikasi, T.kompat, T.ptero, T.jadi, T.status, T.end], [0, -60, 80, -40, 60, -40, -100, 40]);
  const camRy = kf(f, [0, T.misal, T.aplikasi, T.ptero, T.jadi, T.status, T.end], [0, 8, -6, 4, -4, 4, 0]);
  const camX = kf(f, [T.aplikasi, T.kompat, T.ptero, T.sementara, T.hubungan + 20, T.jadi], [0, 120, -120, -120, 160, 0]);

  const bubbleCol = interpolateColors(morph, [0, 1], [C.telegram, "#1fa855"]);

  return (
    <AbsoluteFill style={{ background: interpolateColors(morph, [0, 1], [C.white, C.black]), fontFamily: FONT }}>
      <LightStreak f={f} o={0.35 * morph} angle={-32} color="255,106,43" seed={8} />
      <WarmLight f={f} o={0.4 * morph} y={620} r={1000} seed={9} />
      <Stage cam={{ x: camX, z: camZ, ry: camRy, rx: 3 }}>
        {/* the bubble from the Telegram scene turns into WhatsApp */}
        <Obj x={mix(0, -380, bubbleOut)} y={mix(0, 120, bubbleOut)} w={360} h={70} o={1 - p(f, T.misal, T.misal + 20)} s={mix(1.2, 0.8, bubbleOut)}>
          <div style={{ position: "relative", padding: "18px 24px", borderRadius: 26, borderBottomRightRadius: 8, background: bubbleCol, color: "#fff", fontSize: 24, fontWeight: 600, textAlign: "center", boxShadow: `0 20px 60px rgba(0,0,0,${0.2 + morph * 0.3})` }}>
            <div style={{ position: "absolute", left: -46, top: 18, opacity: morph }}><BrandLogo brand="whatsapp" size={34} /></div>
            Pesan baru masuk
          </div>
        </Obj>
        {/* B: an info bot on WhatsApp */}
        <Obj x={-380} y={20} w={500} h={640} ry={14} o={chat} s={mix(0.92, 1, chat)}>
          <div style={{ boxShadow: glow(0.5), borderRadius: 26 }}>
            <ChatWindow f={f} platform="whatsapp" title="Info Layanan" subtitle="bot · contoh fiktif" msgs={msgs} w={500} h={640} dark />
          </div>
        </Obj>
        <Obj x={300} y={-30} w={560} h={200} o={chat}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[["Bot informasi", T.info, "Info"], ["menerima pesan", T.terima, "MessageCircle"], ["menyiapkan jawaban", T.siap, "Send"]].map(([t, at, ic]) => {
              const q = p(f, (at as number) - 8, (at as number) + 22, easeOut);
              return (
                <div key={t as string} style={{ display: "flex", alignItems: "center", gap: 14, opacity: q, transform: `translateX(${(1 - q) * 30}px)`, color: "#fff", fontSize: 30, fontWeight: 600 }}>
                  <Icon name={ic as "Info"} size={30} color={C.whatsapp} draw={q} /> {t}
                </div>
              );
            })}
          </div>
        </Obj>

        {/* C: app → integration → platform */}
        {([
          [-470, T.aplikasi, (
            <>
              <ContainerIllo d={p(f, T.aplikasi - 10, T.aplikasi + 40)} size={110} open={0.2} />
              <div style={{ fontSize: 23, fontWeight: 700 }}>Aplikasi bot</div>
              <div style={{ fontSize: 15, color: C.grayLight, fontFamily: MONO }}>di dalam container</div>
            </>
          )],
          [0, T.integrasi, (
            <>
              <div style={{ display: "flex", gap: 14 }}>
                <Icon name="Plug" size={46} color={C.coral} draw={p(f, T.integrasi - 6, T.integrasi + 30)} />
                <Icon name="KeyRound" size={46} color={C.coral} draw={p(f, T.auth - 6, T.auth + 30)} />
              </div>
              <div style={{ fontSize: 23, fontWeight: 700 }}>Integrasi & autentikasi</div>
              <div style={{ fontSize: 15, color: C.grayLight, fontFamily: MONO, opacity: p(f, T.auth, T.auth + 20) }}>sesi/kunci:<Redacted n={7} />(disensor)</div>
            </>
          )],
          [470, T.integrasi + 30, (
            <>
              <BrandLogo brand="whatsapp" size={84} />
              <div style={{ fontSize: 23, fontWeight: 700 }}>Layanan WhatsApp</div>
              <div style={{ fontSize: 15, color: C.grayLight }}>pihak platform</div>
            </>
          )],
        ] as const).map(([x, at, content], i) => {
          const q = p(f, at - 14, at + 26, easeOut) * (1 - chainOut);
          return (
            <Obj key={i} x={x} y={-40} w={330} h={230} o={q} s={mix(0.85, 1, q)} z={(1 - q) * -200}>
              <Block glowA={i === 1 ? 0.5 * p(f, T.kompat, T.kompat + 30) : 0}>{content}</Block>
            </Obj>
          );
        })}
        <Flow f={f} d="M -300 -40 L -170 -40" reveal={p(f, T.integrasi - 10, T.integrasi + 20) * (1 - chainOut)} color={C.coral} pulses={2} width={2.5} />
        <Flow f={f} d="M 170 -40 L 300 -40" reveal={p(f, T.integrasi + 20, T.integrasi + 50) * (1 - chainOut)} color={C.whatsapp} pulses={2} width={2.5} />
        <Obj x={0} y={150} w={1100} h={50} o={life(f, T.kompat - 10, 30, T.ptero - 10, 30)}>
          <Words f={f} text="Kompatibilitas & koneksi bergantung pada metode integrasi" at={T.kompat} times={[T.kompat, T.koneksi - 10, T.koneksi, T.koneksi + 30, T.metode - 14, T.metode - 6, T.metode + 4]} size={28} color="rgba(255,255,255,0.85)" weight={500} accent={[5, 6]} />
        </Obj>

        {/* D: responsibility zones */}
        <Obj x={-470} y={140} w={360} h={90} o={zones * (1 - chainOut)}>
          <div style={{ borderTop: `2px solid ${C.orange}`, paddingTop: 14, textAlign: "center", color: C.coral, fontSize: 20, fontWeight: 600, transform: `scaleX(${mix(0.6, 1, zones)})` }}>
            Pterodactyl: mengelola proses aplikasi
          </div>
        </Obj>
        <Obj x={235} y={140} w={800} h={90} o={zone2 * (1 - chainOut)}>
          <div style={{ borderTop: `2px solid ${C.whatsapp}`, paddingTop: 14, textAlign: "center", color: "#7fe3a7", fontSize: 20, fontWeight: 600, transform: `scaleX(${mix(0.6, 1, zone2)})` }}>
            Integrasi bot: hubungan dengan platform
          </div>
        </Obj>

        {/* E/F: two statuses that both matter */}
        <Obj x={-260} y={-40} w={440} h={250} o={statusIn} s={mix(0.85, 1, statusIn)} ry={8}>
          <Block w={440} glowA={0.4 * statusIn}>
            <Icon name="Activity" size={44} color={C.ok} draw={p(f, T.aktif - 10, T.aktif + 30)} />
            <div style={{ fontSize: 26, fontWeight: 700 }}>Proses aktif</div>
            <StatusPill state={f < T.aktif - 6 ? "starting" : "running"} f={f} size={17} />
          </Block>
        </Obj>
        <Obj x={260} y={-40} w={440} h={250} o={p(f, T.konplat - 20, T.konplat + 10)} s={mix(0.85, 1, p(f, T.konplat - 20, T.konplat + 20, easeOut))} ry={-8}>
          <Block w={440} glowA={0.4}>
            <Icon name={broken ? "WifiOff" : "Wifi"} size={44} color={broken ? C.err : connected ? C.whatsapp : C.warn} />
            <div style={{ fontSize: 26, fontWeight: 700 }}>Koneksi platform</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.06)", fontSize: 17, fontWeight: 600,
              border: `1px solid ${broken ? C.err : connected ? C.whatsapp : C.warn}55` }}>
              <div style={{ width: 9, height: 9, borderRadius: 5, background: broken ? C.err : connected ? C.whatsapp : C.warn, opacity: connected || broken ? 1 : 0.5 + 0.5 * Math.sin(f * 0.25) }} />
              {broken ? "terputus (contoh)" : connected ? "terhubung" : "menghubungkan…"}
            </div>
          </Block>
        </Obj>
        <Obj x={0} y={200} w={1100} h={60} o={life(f, T.status - 6, 24, T.end - 30, 30)}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Label bg="rgba(240,82,79,0.14)" color="#ff9a98" size={22}><Icon name="TriangleAlert" size={20} color="#ff9a98" /> "Running" belum menjamin bot bisa membalas</Label>
          </div>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 120 }}>
          <Words f={f} text="Bagaimana dengan WhatsApp?" at={T.bagaimana} times={[T.bagaimana + 10, T.wa - 10, T.wa]} size={42} color="#fff" accent={[2]} accentColor={C.whatsapp} out={T.misal - 10} />
        </div>
        <div style={{ position: "absolute", top: 110 }}>
          <Words f={f} text="Perhatikan dua hal." at={T.jadi} times={[T.jadi + 30, T.dua, T.dua + 12]} size={40} color="#fff" accent={[1, 2]} out={T.status - 20} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx07 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 10, "swell_deep", 0.4, 1.2), s(o + T.wa - 10, "text_in", 0.3), s(o + T.misal - 24, "panel_slide", 0.35), s(o + T.terima - 10, "msg_out", 0.4, 1.06),
    s(o + T.siap + 44, "msg_in", 0.4, 0.95), s(o + T.aplikasi - 14, "panel_pass", 0.3, 1.05), s(o + T.aplikasi, "settle_light", 0.3), s(o + T.integrasi - 6, "latch", 0.35),
    s(o + T.auth - 6, "click_glass", 0.3), s(o + T.integrasi + 20, "data_flow", 0.3, 1.1), s(o + T.ptero - 20, "line_draw", 0.3), s(o + T.sementara - 10, "line_draw", 0.3, 1.2),
    s(o + T.jadi - 20, "panel_lift", 0.35, 1.05), s(o + T.aktif - 8, "status_on", 0.25), s(o + T.konplat - 20, "settle_light", 0.3, 1.1), s(o + T.terhubung - 4, "status_on", 0.25, 1.06),
    s(o + T.status + 10, "error_blip", 0.35),
  ];
};
