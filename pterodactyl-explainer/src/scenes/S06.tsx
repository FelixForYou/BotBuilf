import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, softShadow } from "../lib/theme";
import { easeBack, easeIO, easeOut, kf, life, mix, p } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { Card, DashedGrid, Flow, Label, Obj, SimTag, Stage, Words } from "../components/Primitives";
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

const msgs: Msg[] = [
  { t: T.jadwal - 4, from: "user", text: "/jadwal" },
  { t: T.aplikasi + 10, from: "bot", text: "Agenda hari ini:\n10.00  Rapat tim\n15.00  Kirim laporan", typing: T.balasan - T.aplikasi - 10 },
  { t: T.setiap - 10, from: "user", text: "/info" },
  { t: T.setiap + 40, from: "bot", text: "Asisten Bot siap membantu. Ketik /bantuan.", typing: 34 },
];

const logs: Line[] = [
  { t: 0, text: "[info] menunggu pesan…", kind: "dim" },
  { t: T.jadwal + 20, text: "[info] pesan masuk: /jadwal", kind: "in" },
  { t: T.proses, text: "[info] memproses perintah jadwal", kind: "info" },
  { t: T.balasan, text: "[ok]   balasan terkirim (140 ms)", kind: "ok" },
  { t: T.setiap, text: "[info] pesan masuk: /info", kind: "in" },
  { t: T.setiap + 50, text: "[ok]   balasan terkirim (90 ms)", kind: "ok" },
  { t: T.pakai, text: "[info] notifikasi terjadwal dikirim ke 3 grup", kind: "info" },
];
const ramFn = series(11, 34, 3, [[T.jadwal / 6 + 4, 10, 3], [T.setiap / 6 + 4, 9, 3], [T.pakai / 6 + 6, 14, 4]]);

const UseCase: React.FC<{ f: number; at: number; icon: "CircleHelp" | "Bell" | "Users"; title: string; out: number }> = ({ f, at, icon, title, out }) => {
  const q = life(f, at - 10, 34, out, 30, easeOut);
  const swing = icon === "Bell" ? Math.sin((f - at) * 0.25) * 14 * Math.exp(-Math.max(0, f - at) / 50) : 0;
  return (
    <div style={{ opacity: q, transform: `translateY(${(1 - q) * 40}px) scale(${mix(0.9, 1, q)})` }}>
      <Card w={330} h={190} tone="light" radius={22}>
        <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ width: 62, height: 62, borderRadius: 18, background: "rgba(38,165,228,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${swing}deg)` }}>
            <Icon name={icon} size={34} color={C.telegram} draw={p(f, at - 4, at + 30)} />
          </div>
          <div style={{ fontSize: 25, fontWeight: 650, color: C.ink, letterSpacing: "-0.02em" }}>{title}</div>
        </div>
      </Card>
    </div>
  );
};

export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const chatIn = p(f, 0, 70, easeOut);
  const chatX = kf(f, [0, T.botini - 20, T.botini + 20, T.setiap - 20, T.setiap + 10, T.tapi - 20, T.tapi + 20], [-260, -260, -560, -560, -420, -420, -700]);
  const chatRy = kf(f, [0, T.seorang, T.botini, T.setiap, T.tapi], [26, 12, 18, 10, 24]);
  const procIn = p(f, T.aplikasi - 30, T.aplikasi + 10, easeOut) * (1 - p(f, T.botini - 10, T.botini + 20));
  const toProc = p(f, T.aplikasi - 10, T.aplikasi + 30, easeIO);
  const back = p(f, T.balasan - 30, T.balasan + 4, easeIO);
  const spin = f * 6;
  const camZ = kf(f, [0, T.seorang, T.botini, T.setiap, T.tapi, T.end - 70, T.end], [-60, -200, -140, -170, -130, -120, 300]);
  const camRy = kf(f, [0, T.aplikasi, T.botini, T.setiap, T.tapi, T.end], [-4, 3, -2, 3, -3, 0]);
  const outro = p(f, T.end - 80, T.end - 20, easeIO);

  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      <DashedGrid f={f} ys={[880]} xs={[1700]} color="rgba(10,10,12,0.1)" o={0.8} />
      <Stage cam={{ z: camZ, ry: camRy, rx: 3 }}>
        {/* chat window */}
        <Obj x={chatX} y={20} w={520} h={780} ry={chatRy} o={chatIn * (1 - outro)} s={mix(0.9, 1, chatIn)}>
          <div style={{ boxShadow: softShadow(1.5), borderRadius: 26 }}>
            <ChatWindow f={f} platform="telegram" title="Asisten Bot" subtitle="bot · contoh fiktif" msgs={msgs} w={520} h={780} />
          </div>
        </Obj>

        {/* message to app process and back */}
        <Flow f={f} d="M -20 -80 C 120 -160 260 -160 380 -60" reveal={toProc * procIn} color={C.telegram} pulses={2} pulseSpeed={0.012} width={2.5} />
        <Flow f={f} d="M 380 40 C 260 140 120 140 -20 60" reveal={back * procIn} color={C.ok} pulses={2} pulseSpeed={0.012} width={2.5} />
        <Obj x={520} y={-10} w={260} h={260} o={procIn} s={mix(0.8, 1, procIn)}>
          <Card w={260} h={260} tone="dark" radius={30}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, color: "#fff" }}>
              <div style={{ position: "relative", width: 90, height: 90 }}>
                <svg width={90} height={90} style={{ position: "absolute", inset: 0, transform: `rotate(${spin}deg)`, opacity: kf(f, [T.proses - 20, T.proses, T.balasan - 10, T.balasan + 10], [0, 1, 1, 0]) }}>
                  <circle cx={45} cy={45} r={40} stroke={C.orange} strokeWidth={3} fill="none" strokeDasharray="60 200" strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 18 }}><Icon name="Bot" size={54} color="#fff" stroke={1.6} /></div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>asisten-bot</div>
              <div style={{ fontSize: 15, color: C.grayLight, fontFamily: MONO }}>{f < T.proses - 10 ? "menerima…" : f < T.balasan ? "memproses…" : "membalas"}</div>
            </div>
          </Card>
        </Obj>
        <Obj x={520} y={-200} w={420} h={50} o={procIn}>
          <Words f={f} text="Terima · proses · balas" at={T.aplikasi} times={[T.aplikasi, T.proses - 10, T.proses, T.balasan - 10, T.balasan]} size={26} color={C.gray} weight={500} />
        </Obj>

        {/* use cases */}
        <Obj x={300} y={-180} w={330} h={190}><UseCase f={f} at={T.jawab} icon="CircleHelp" title="Menjawab pertanyaan" out={T.setiap - 20} /></Obj>
        <Obj x={300} y={50} w={330} h={190}><UseCase f={f} at={T.notif} icon="Bell" title="Mengirim notifikasi" out={T.setiap - 14} /></Obj>
        <Obj x={300} y={280} w={330} h={190}><UseCase f={f} at={T.admin} icon="Users" title="Administrasi komunitas" out={T.setiap - 8} /></Obj>

        {/* activity leaves traces in the console + resources */}
        <Obj x={260} y={-60} w={700} h={420} o={life(f, T.setiap - 30, 30, T.tapi - 10, 30)} ry={-10} s={mix(0.92, 1, p(f, T.setiap - 30, T.setiap + 20, easeOut))}>
          <Card w={700} h={420} tone="dark" radius={20}>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 19, fontWeight: 600 }}>
                <Icon name="Terminal" size={22} color={C.coral} /> Console <div style={{ flex: 1 }} /><SimTag dark />
              </div>
              <ConsoleView f={f} lines={logs} w={664} h={210} size={16} />
              <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#8b929c", fontSize: 16, fontWeight: 600 }}>
                <Icon name="MemoryStick" size={20} color={C.telegram} /> RAM
                <svg width={540} height={80}>
                  <path d={Array.from({ length: 90 }).map((_, k) => `${k ? "L" : "M"}${k * 6},${74 - ramFn(f / 6 - (90 - k)) * 1.2}`).join(" ")} stroke={C.telegram} strokeWidth={2.5} fill="none" />
                </svg>
              </div>
            </div>
          </Card>
        </Obj>

        {/* code = logic ; panel = process */}
        <Obj x={-90} y={-40} w={620} h={330} o={life(f, T.mampu - 20, 30, T.end - 60, 30)} ry={8}>
          <CodeCard f={f} at={T.mampu - 16} w={620} title="asisten-bot/commands/jadwal.js" size={19}
            lines={[{ text: "bot.command('jadwal', async (ctx) => {", tone: "kw" }, { text: "  const agenda = await ambilAgenda();", tone: "plain" }, { text: "  await ctx.reply(formatAgenda(agenda));", tone: "plain" }, { text: "});", tone: "kw" }]}
            hiLine={2} hiA={p(f, T.kode - 10, T.kode + 20)} hiColor={C.telegram} />
        </Obj>
        <Obj x={-90} y={170} w={620} h={50} o={life(f, T.kode - 10, 24, T.end - 60, 30)}>
          <div style={{ display: "flex", justifyContent: "center" }}><Label size={20} bg="rgba(38,165,228,0.12)" color="#1478a8"><Icon name="Code" size={18} color="#1478a8" /> Kode bot: logika balasan</Label></div>
        </Obj>
        <Obj x={520} y={-40} w={400} h={250} o={life(f, T.panel - 20, 30, T.end - 60, 30)} ry={-10}>
          <Card w={400} h={250} tone="dark" radius={20}>
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 20, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <BrandLogo brand="telegram" size={28} /><div style={{ fontSize: 20, fontWeight: 700 }}>asisten-bot</div>
              </div>
              <StatusPill state="running" f={f} size={16} />
              <PowerButtons scale={0.8} />
            </div>
          </Card>
        </Obj>
        <Obj x={520} y={170} w={420} h={50} o={life(f, T.kelola - 10, 24, T.end - 60, 30)}>
          <div style={{ display: "flex", justifyContent: "center" }}><Label size={20} bg="rgba(255,106,43,0.12)" color={C.ember}><Icon name="Server" size={18} color={C.ember} /> Panel: mengelola proses</Label></div>
        </Obj>

        {/* hand-off bubble to the WhatsApp scene */}
        <Obj x={0} y={0} w={360} h={70} o={p(f, T.end - 70, T.end - 30)} s={mix(0.8, 1.2, p(f, T.end - 70, T.end, easeOut))}>
          <div style={{ padding: "18px 24px", borderRadius: 26, borderBottomRightRadius: 8, background: C.telegram, color: "#fff", fontSize: 24, fontWeight: 600, textAlign: "center", boxShadow: softShadow(1.4) }}>
            Pesan baru masuk
          </div>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 70 }}>
          <Words f={f} text="Keseharian Asisten Bot" at={T.ikuti} times={[T.ikuti + 10, T.asisten, T.asisten + 14]} size={34} out={T.seorang + 40} accent={[1, 2]} accentColor={C.telegram} />
        </div>
        <div style={{ position: "absolute", top: 70 }}>
          <Words f={f} text="Jejak di console. Sumber daya ikut bergerak." at={T.jejak} times={[T.jejak, T.jejak + 10, T.console, T.pakai, T.pakai + 14, T.gerak - 14, T.gerak]} size={32} out={T.tapi - 10} accent={[2]} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx06 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o + 4, "panel_slide", 0.4, 1.05), s(o + 60, "settle_light", 0.3), s(o + T.jadwal - 8, "type_short", 0.35), s(o + T.jadwal - 4, "msg_out", 0.45),
    s(o + T.aplikasi - 12, "data_flow", 0.35), s(o + T.proses - 10, "data_tick", 0.3), s(o + T.balasan - 30, "data_flow", 0.3, 1.15), s(o + T.balasan, "msg_in", 0.45),
    s(o + T.botini - 20, "panel_pass", 0.3, 1.1), s(o + T.jawab - 10, "settle_light", 0.3, 1.1), s(o + T.notif - 10, "settle_light", 0.3, 1.25), s(o + T.notif + 2, "click_glass", 0.25),
    s(o + T.admin - 10, "settle_light", 0.3, 0.95), s(o + T.setiap - 30, "panel_slide", 0.35, 0.9), s(o + T.setiap - 10, "msg_out", 0.35, 1.05),
    s(o + T.setiap + 40, "msg_in", 0.35, 0.97), s(o + T.pakai, "data_tick", 0.25), s(o + T.mampu - 20, "panel_lift", 0.35, 1.1), s(o + T.kode - 10, "click_soft", 0.3),
    s(o + T.panel - 20, "panel_slide", 0.3, 1.2), s(o + T.end - 70, "msg_out", 0.35, 0.92),
  ];
};
