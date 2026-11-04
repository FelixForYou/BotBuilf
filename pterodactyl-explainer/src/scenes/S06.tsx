import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, softShadow } from "../lib/theme";
import { arc, breathe, clamp01, DRIFT, GLIDE, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, DashedGrid, Flow, Label, Obj, SimTag, Stage } from "../components/Primitives";
import { MBlur, SwapText } from "../components/Motion";
import { Icon } from "../components/Icon";
import { BrandLogo } from "../components/Logos";
import { ChatWindow, CodeCard, ConsoleView, Line, Msg, PowerButtons, StatusPill, series } from "../components/UI";

const L = makeLocal("s06");
const T = {
  sekarang: L.c("Sekarang"), ikuti: L.c("ikuti"), asisten: L.c("Asisten Bot"), seorang: L.c("Seorang pengguna"), kirim: L.c("mengirim perintah"),
  jadwal: L.c("jadwal"), agenda: L.c("agenda"), aplikasi: L.c("Aplikasi menerima"), proses: L.c("memprosesnya"), balasan: L.c("balasan"),
  botini: L.c("Bot seperti ini"), jawab: L.c("menjawab pertanyaan"), notif: L.c("notifikasi"), admin: L.c("administrasi"), setiap: L.c("Setiap aktivitas"),
  jejak: L.c("jejak"), console: L.c("console"), pakai: L.c("pemakaian"), gerak: L.c("bergerak"), tapi: L.c("Tapi ingat"), mampu: L.c("kemampuan membalas"),
  kode: L.c("kode bot"), panel: L.c("Panel membantu"), kelola: L.c("mengelola proses"), end: L.dur,
};
const OUTRO = T.end - 44;
const CHAT = { x: -420, y: 10 };
const PROC = { x: 420, y: -20 };

const msgs: Msg[] = [
  { t: T.jadwal - 6, from: "user", text: "/jadwal" },
  { t: T.proses + 30, from: "bot", text: "Agenda hari ini:\n10.00  Rapat tim\n15.00  Kirim laporan", typing: T.balasan - T.proses - 26 },
  { t: T.setiap - 14, from: "user", text: "/info" },
  { t: T.jejak + 4, from: "bot", text: "Asisten Bot siap membantu. Ketik /bantuan.", typing: 26 },
];
const logs: Line[] = [
  { t: 0, text: "[info] menunggu pesan…", kind: "dim" },
  { t: T.jadwal + 20, text: "[info] pesan masuk: /jadwal", kind: "in" },
  { t: T.proses, text: "[info] memproses perintah jadwal", kind: "info" },
  { t: T.balasan, text: "[ok]   balasan terkirim (140 ms)", kind: "ok" },
  { t: T.setiap + 22, text: "[info] pesan masuk: /info", kind: "in" },
  { t: T.jejak + 30, text: "[ok]   balasan terkirim (90 ms)", kind: "ok" },
  { t: T.pakai, text: "[info] notifikasi terjadwal dikirim ke 3 grup", kind: "info" },
];
const ramFn = series(11, 34, 3, [[(T.setiap + 22) / 6, 12, 3], [(T.pakai) / 6 + 2, 16, 4]]);

const cam = (f: number) =>
  rig(f, { x: 0, y: 0, z: 0 }, [
    { at: 0, to: { x: -200, z: -160, ry: 6 }, feel: GLIDE },
    { at: T.jadwal - 10, to: { x: -300, z: -300, ry: 8 }, feel: GLIDE },
    { at: T.aplikasi - 16, to: { x: 120, z: -120, ry: -4 }, feel: WHIP },
    { at: T.balasan - 30, to: { x: -200, z: -200, ry: 6 }, feel: WHIP },
    { at: T.botini - 16, to: { x: 280, z: -60, ry: -8, rx: 4 }, feel: GLIDE },
    { at: T.setiap - 20, to: { x: 0, z: -40, ry: 4, rx: 2 }, feel: WHIP },
    { at: T.pakai, to: { x: 120, ry: -4 }, feel: DRIFT },
    { at: T.tapi - 12, to: { x: 210, z: -220, ry: -10 }, feel: GLIDE },
    { at: T.panel - 14, to: { x: 300, z: -40, ry: 4 }, feel: GLIDE },
    { at: OUTRO, to: { x: 0, z: 0, ry: 0, rx: 0 }, feel: GLIDE },
  ]);

const UseCase: React.FC<{ f: number; at: number; icon: "CircleHelp" | "Bell" | "Users"; title: string }> = ({ f, at, icon, title }) => {
  const swing = icon === "Bell" ? Math.sin((f - at) * 0.35) * 16 * Math.exp(-Math.max(0, f - at) / 40) : 0;
  return (
    <Card w={360} h={200} tone="light" radius={24} shadowA={1.5}>
      <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(38,165,228,0.12)", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${swing}deg)` }}>
          <Icon name={icon} size={36} color={C.telegram} draw={clamp01((f - at + 6) / 18)} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 650, color: C.ink, letterSpacing: "-0.02em" }}>{title}</div>
      </div>
    </Card>
  );
};

export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 1, 6), f);
  const chatQ = spr(f, 0, { stiffness: 120, damping: 17 });
  const procQ = spr(f, T.aplikasi - 26, PANEL) * (1 - out(f, T.botini - 10, 12));
  const cardsOut = out(f, T.setiap - 26, 14);
  const consQ = spr(f, T.setiap - 22, PANEL);
  const flip = spr(f, T.mampu - 14, { stiffness: 130, damping: 17 }); // console card turns: back side = bot code
  const outro = out(f, OUTRO, 16);

  // message trips: chat -> process -> chat, and /info bubble -> console line
  const trip = (ff: number) => {
    const t = clamp01(spr(ff, T.aplikasi - 14, { stiffness: 90, damping: 16 }));
    const [x, y, z] = arc(t, [CHAT.x + 120, -180, 40], [0, -420, 300], [PROC.x - 60, -40, 20]);
    return { x, y, z };
  };
  const back = (ff: number) => {
    const t = clamp01(spr(ff, T.balasan - 34, { stiffness: 90, damping: 16 }));
    const [x, y, z] = arc(t, [PROC.x - 60, 20, 20], [0, 300, 260], [CHAT.x + 60, 0, 40]);
    return { x, y, z };
  };
  const toLog = (ff: number) => {
    const t = clamp01(spr(ff, T.setiap + 4, { stiffness: 100, damping: 18 }));
    const [x, y, z] = arc(t, [CHAT.x + 140, -40, 40], [0, -300, 260], [320, -60, 30]);
    return { x, y, z, t };
  };
  const { v: a, d: ad } = vel(trip, f);
  const { v: b, d: bd } = vel(back, f);
  const { v: g, d: gd } = vel(toLog, f);
  const chatX = lerp(900, CHAT.x, chatQ) - (f > T.tapi - 12 ? clamp01(spr(f, T.tapi - 12, PANEL)) * 260 : 0);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <DashedGrid f={f} ys={[880]} xs={[1720]} color="rgba(10,10,12,0.1)" march={1} />
      {/* the line from scene 5 retracts into the chat window */}
      <div style={{ position: "absolute", left: lerp(0, 380, clamp01(spr(f, 0, WHIP))), right: lerp(0, 1540, clamp01(spr(f, 0, WHIP))), top: 538, height: 4, background: C.telegram, borderRadius: 2,
        opacity: 1 - clamp01((f - 10) / 8), boxShadow: "0 0 18px rgba(38,165,228,0.8)" }} />
      <Stage cam={c} blur={[cd.x, cd.y]}>
        <Obj x={chatX} y={CHAT.y} w={500} h={760} ry={lerp(50, 14, chatQ) + (f > T.tapi ? 6 : 0)} s={1 - outro * 0.3} o={1 - outro}>
          <div style={{ boxShadow: softShadow(1.6), borderRadius: 26 }}>
            <ChatWindow f={f} platform="telegram" title="Asisten Bot" subtitle="bot · contoh fiktif" msgs={msgs} w={500} h={760} />
          </div>
        </Obj>

        {/* process + message trips */}
        <Flow f={f} d={`M ${CHAT.x + 120} -180 Q 0 -420 ${PROC.x - 60} -40`} reveal={clamp01((f - T.aplikasi + 14) / 24) * procQ} color={C.telegram} width={2.2} glowOn={false} />
        <Flow f={f} d={`M ${PROC.x - 60} 20 Q 0 300 ${CHAT.x + 60} 0`} reveal={clamp01((f - T.balasan + 34) / 24) * procQ} color={C.ok} width={2.2} glowOn={false} />
        <Obj x={a.x} y={a.y} z={a.z} w={130} h={50} o={f > T.aplikasi - 14 && f < T.aplikasi + 30 ? 1 : 0}>
          <MBlur dx={ad.x - cd.x} dy={ad.y}><div style={{ padding: "10px 18px", borderRadius: 16, background: "#e1f6cb", fontSize: 20, fontWeight: 600, color: C.ink, textAlign: "center", boxShadow: softShadow() }}>/jadwal</div></MBlur>
        </Obj>
        <Obj x={b.x} y={b.y} z={b.z} w={60} h={44} o={f > T.balasan - 34 && f < T.balasan + 8 ? 1 : 0}>
          <MBlur dx={bd.x - cd.x} dy={bd.y}><div style={{ width: 60, height: 44, borderRadius: 14, background: "#fff", border: `2px solid ${C.ok}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="Send" size={22} color={C.ok} /></div></MBlur>
        </Obj>
        <Obj x={lerp(PROC.x + 700, PROC.x, clamp01(procQ))} y={PROC.y} z={lerp(-600, 0, clamp01(procQ))} w={270} h={270} o={clamp01(procQ * 3)} ry={-12}>
          <Card w={270} h={270} tone="dark" radius={30}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, color: "#fff" }}>
              <div style={{ position: "relative", width: 96, height: 96, transform: `scale(${1 + 0.12 * Math.exp(-Math.max(0, f - T.aplikasi - 30) / 8) * (f > T.aplikasi + 30 ? 1 : 0)})` }}>
                <svg width={96} height={96} style={{ position: "absolute", inset: 0, transform: `rotate(${f * 7}deg)`, opacity: f > T.proses - 16 && f < T.balasan ? 1 : 0 }}>
                  <circle cx={48} cy={48} r={43} stroke={C.orange} strokeWidth={3.5} fill="none" strokeDasharray="70 200" strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 20 }}><Icon name="Bot" size={56} color="#fff" stroke={1.6} /></div>
              </div>
              <div style={{ fontSize: 21, fontWeight: 600 }}>asisten-bot</div>
              <SwapText f={f} items={[{ at: T.aplikasi, text: "menerima" }, { at: T.proses - 10, text: "memproses" }, { at: T.balasan - 8, text: "membalas" }]} size={16} weight={500} color={C.grayLight} style={{ fontFamily: MONO }} />
            </div>
          </Card>
        </Obj>

        {/* use cases: a diagonal stack that keeps drifting, new cards arrive from below */}
        {([[T.jawab, "CircleHelp", "Menjawab pertanyaan"], [T.notif, "Bell", "Mengirim notifikasi"], [T.admin, "Users", "Administrasi komunitas"]] as const).map(([at, ic, t], i) => {
          const fn = (ff: number) => {
            const q = clamp01(spr(ff, at - 12, { stiffness: 130, damping: 17 }));
            const driftUp = Math.max(0, ff - (at - 12)) * 0.55;
            const lo = out(ff, T.setiap - 26 + i * 3, 14);
            return { x: lerp(-100, 120 + i * 150, q) + driftUp * 0.7 + lo * 900, y: lerp(900, 170 - i * 170, q) - driftUp * 0.5, z: -i * 60 - lo * 400 };
          };
          const { v, d } = vel(fn, f);
          return (
            <Obj key={t} x={v.x + 200} y={v.y} z={v.z} w={360} h={200} o={clamp01((f - at + 12) / 6) * (1 - cardsOut)} rz={-4}>
              <MBlur dx={d.x - cd.x} dy={d.y}><UseCase f={f} at={at} icon={ic} title={t} /></MBlur>
            </Obj>
          );
        })}

        {/* /info bubble flies into the console and becomes a log row */}
        <Obj x={g.x} y={g.y} z={g.z} w={120} h={50} s={lerp(1, 0.4, clamp01((g.t - 0.7) * 3.3))} o={f > T.setiap + 4 && g.t < 0.98 ? 1 : 0}>
          <MBlur dx={gd.x - cd.x} dy={gd.y}><div style={{ padding: "10px 18px", borderRadius: 16, background: "#e1f6cb", fontSize: 20, fontWeight: 600, color: C.ink, textAlign: "center" }}>/info</div></MBlur>
        </Obj>
        {/* console card; its back side is the bot's code */}
        <Obj x={lerp(900, 330, clamp01(consQ))} y={-30} z={lerp(-500, 0, clamp01(consQ))} w={700} h={430} ry={lerp(-50, -10, clamp01(consQ)) + flip * 180} o={clamp01(consQ * 3) * (1 - outro)}
          style={{ transformStyle: "preserve-3d" }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
            <Card w={700} h={430} tone="dark" radius={20}>
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 19, fontWeight: 600 }}>
                  <Icon name="Terminal" size={22} color={C.coral} /> Console <div style={{ flex: 1 }} /><SimTag dark />
                </div>
                <ConsoleView f={f} lines={logs} w={664} h={220} size={16} />
                <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#8b929c", fontSize: 16, fontWeight: 600 }}>
                  <Icon name="MemoryStick" size={20} color={C.telegram} /> RAM
                  <svg width={540} height={80}>
                    <path d={Array.from({ length: 90 }).map((_, k) => `${k ? "L" : "M"}${k * 6},${74 - ramFn(f / 6 - (90 - k)) * 1.2}`).join(" ")} stroke={C.telegram} strokeWidth={2.5} fill="none" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <CodeCard f={f} at={T.mampu} w={700} h={430} title="asisten-bot/commands/jadwal.js" size={20}
              lines={[{ text: "bot.command('jadwal', async (ctx) => {", tone: "kw" }, { text: "  const agenda = await ambilAgenda();", tone: "plain" }, { text: "  await ctx.reply(formatAgenda(agenda));", tone: "plain" }, { text: "});", tone: "kw" }, { text: "// logika balasan ada di sini", tone: "cm" }]}
              hiLine={2} hiA={clamp01((f - T.kode + 6) / 10)} hiColor={C.telegram} />
          </div>
        </Obj>
        <Obj x={330} y={230} w={700} h={50} s={spr(f, T.kode - 8, POP) * (1 - outro)}>
          <div style={{ display: "flex", justifyContent: "center" }}><Label size={21} bg="rgba(38,165,228,0.12)" color="#1478a8"><Icon name="Code" size={18} color="#1478a8" /> Kode bot: logika balasan</Label></div>
        </Obj>
        <Obj x={lerp(1400, 860, clamp01(spr(f, T.panel - 16, PANEL)))} y={-60} z={-80} w={380} h={250} ry={-18} o={clamp01(spr(f, T.panel - 16, SNAP) * 2) * (1 - outro)}>
          <Card w={380} h={250} tone="dark" radius={20}>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 20, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}><BrandLogo brand="telegram" size={28} /><div style={{ fontSize: 20, fontWeight: 700 }}>asisten-bot</div></div>
              <StatusPill state="running" f={f} size={16} />
              <PowerButtons scale={0.76} />
            </div>
          </Card>
        </Obj>
        <Obj x={860} y={110} w={420} h={50} s={spr(f, T.kelola - 8, POP) * (1 - outro)}>
          <div style={{ display: "flex", justifyContent: "center" }}><Label size={20} bg="rgba(255,106,43,0.12)" color={C.ember}><Icon name="Server" size={18} color={C.ember} /> Panel: mengelola proses</Label></div>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 60 }}>
          <SwapText f={f} items={[
            { at: T.ikuti - 4, text: "Keseharian Asisten Bot" },
            { at: T.aplikasi - 8, text: "Terima · proses · balas" },
            { at: T.botini - 8, text: "Bot seperti ini bisa…" },
            { at: T.jejak - 8, text: "Jejak di console" },
            { at: T.pakai - 6, text: "Sumber daya ikut bergerak" },
            { at: T.mampu - 10, text: "Balasan berasal dari kode bot" },
            { at: T.panel - 8, text: "Panel mengelola prosesnya" },
          ]} size={34} style={{ opacity: 1 - out(f, OUTRO, 10) }} />
        </div>
      </AbsoluteFill>
      {/* hand-off bubble (scene 7 starts from it) */}
      {f > OUTRO + 8 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 360, transform: `scale(${lerp(0.3, 1.2, clamp01(spr(f, OUTRO + 8, { stiffness: 200, damping: 20 })))})`, opacity: clamp01((f - OUTRO - 8) / 5) }}>
            <div style={{ padding: "18px 24px", borderRadius: 26, borderBottomRightRadius: 8, background: C.telegram, color: "#fff", fontSize: 24, fontWeight: 600, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              Pesan baru masuk
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const sfx06 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o, "whip_low", 0.35, 1.2), s(o + 20, "impact_soft", 0.3, 1.1), s(o + T.ikuti - 4, "scramble", 0.2),
    s(o + T.jadwal - 10, "type_short", 0.3), s(o + T.jadwal - 6, "msg_out", 0.4), s(o + T.aplikasi - 26, "whip_air", 0.3), s(o + T.aplikasi - 14, "whip_fast", 0.3, 1.2),
    s(o + T.aplikasi + 28, "impact_glass", 0.3), s(o + T.proses - 10, "data_tick", 0.25), s(o + T.balasan - 34, "whip_fast", 0.3, 1.05), s(o + T.balasan, "msg_in", 0.4),
    s(o + T.botini - 10, "whip_air", 0.25, 1.2), s(o + T.jawab - 12, "panel_lift", 0.3, 1.2), s(o + T.jawab, "impact_card", 0.28),
    s(o + T.notif - 12, "panel_lift", 0.3, 1.3), s(o + T.notif, "impact_card", 0.28, 1.1), s(o + T.notif + 2, "click_glass", 0.22), s(o + T.admin - 12, "panel_lift", 0.3, 1.1), s(o + T.admin, "impact_card", 0.28, 0.95),
    s(o + T.setiap - 26, "whip_low", 0.32), s(o + T.setiap - 14, "msg_out", 0.3, 1.1), s(o + T.setiap + 4, "whip_fast", 0.28, 0.9), s(o + T.setiap + 22, "morph_down", 0.25), s(o + T.jejak + 30, "msg_in", 0.3),
    s(o + T.pakai, "data_tick", 0.25), s(o + T.mampu - 14, "flip", 0.4), s(o + T.kode - 8, "impact_glass", 0.25), s(o + T.panel - 16, "whip_air", 0.3), s(o + T.panel, "impact_card", 0.28),
    s(o + OUTRO, "whip_low", 0.3, 0.9), s(o + OUTRO + 8, "msg_out", 0.4, 0.92),
  ];
};
