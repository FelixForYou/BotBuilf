import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop, Card, Cursor, Dot, Icon, IconTile } from "../components/Primitives";
import { Headline, MaskWords, SectionLabel } from "../components/Type";
import { E, SPRING, keys, mix, prog, sp, tw } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C, F, SHADOW } from "../theme";

const CHAT = { x: 700, y: 110, w: 540, h: 860 };
const HEADER_H = 86;
const VIEW_H = CHAT.h - HEADER_H - 90;

type Msg = { at: number; h: number; from: "user" | "bot"; node: (n: number) => React.ReactNode };

const Btn: React.FC<{ label: string; icon?: React.ComponentProps<typeof Icon>["name"]; press?: number; on?: boolean }> = ({ label, icon, press = 0, on }) => (
  <div
    style={{
      flex: 1,
      height: 44,
      borderRadius: 12,
      background: on ? C.terracotta : C.warmWhite,
      color: on ? C.white : C.charcoal,
      border: `1px solid ${on ? C.terracotta : C.line}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: F.ui,
      fontSize: 15,
      fontWeight: 600,
      transform: `scale(${1 - press * 0.06})`,
    }}
  >
    {icon ? <Icon name={icon} size={17} color={on ? C.white : C.terracotta} stroke={2} /> : null}
    {label}
  </div>
);

const press = (n: number, at: number) => prog(n, at, at + 5) * (1 - prog(n, at + 5, at + 18));

const MESSAGES: Msg[] = [
  { at: 24, h: 52, from: "user", node: () => <span style={{ fontFamily: F.mono }}>/start</span> },
  {
    at: 44,
    h: 176,
    from: "bot",
    node: (n) => (
      <div>
        <div>
          Halo, <b>Felix</b>! Mau melakukan apa hari ini?
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Btn label="Order Panel" icon="cart" press={press(n, 92)} on={n > 96} />
          <Btn label="Status Server" icon="pulse" press={press(n, 256)} on={n > 260} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn label="Notifikasi" icon="bell" />
          <Btn label="Pengaturan" icon="grid" />
        </div>
      </div>
    ),
  },
  {
    at: 112,
    h: 124,
    from: "bot",
    node: (n) => (
      <div>
        <div>Pilih paket panel:</div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Btn label="Starter" />
          <Btn label="Pro" press={press(n, 150)} on={n > 154} />
          <Btn label="Ultimate" />
        </div>
      </div>
    ),
  },
  {
    at: 180,
    h: 150,
    from: "bot",
    node: (n) => {
      const p = tw(n, 186, 246, 0, 1, E.inOut);
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="check" size={18} color={C.green} stroke={2.6} /> Pesanan <b>#FX-248</b> dibuat
          </div>
          <div style={{ fontSize: 15, color: C.muted, marginTop: 6 }}>{p < 1 ? "Server sedang di-deploy…" : "mc-survival-pro sudah online"}</div>
          <div style={{ height: 8, borderRadius: 8, background: C.softGray, marginTop: 14, overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: p < 1 ? C.terracotta : C.green }} />
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: C.muted, marginTop: 8 }}>{Math.round(p * 100)}% · node Jakarta-01</div>
        </div>
      );
    },
  },
  { at: 268, h: 52, from: "user", node: () => <span>Status Server</span> },
  {
    at: 282,
    h: 170,
    from: "bot",
    node: (n) => (
      <div>
        <div style={{ fontWeight: 600 }}>Monitoring · 3 server</div>
        {[
          ["mc-survival-pro", 42],
          ["bot-discord-ai", 68],
          ["web-felixpanel", 23],
        ].map(([name, v], i) => (
          <div key={name as string} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 14 }}>
            <Dot size={8} />
            <span style={{ fontFamily: F.mono, width: 150 }}>{name}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 6, background: C.softGray }}>
              <div style={{ height: "100%", borderRadius: 6, width: `${(v as number) * tw(n, 290 + i * 5, 320 + i * 5, 0, 1) + Math.sin(n / 9 + i) * 3}%`, background: C.terracotta }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

const NOTIFS = [
  { at: 250, title: "Server online", body: "mc-survival-pro aktif di Jakarta-01", icon: "server" as const },
  { at: 318, title: "Peringatan CPU", body: "node-02 menyentuh 85% — auto-scale", icon: "pulse" as const },
  { at: 360, title: "Backup selesai", body: "12 server dicadangkan otomatis", icon: "box" as const },
];

const NODES = [
  { x: 1560, y: 330, label: "node-01" },
  { x: 1660, y: 560, label: "node-02" },
  { x: 1560, y: 790, label: "node-03" },
];

export const S05Telegram: React.FC = () => {
  const f = useCurrentFrame();
  const n = f - OVERLAP;

  // tinggi konten yang terlihat -> scroll halus
  const gap = 14;
  let y = 0;
  const layout = MESSAGES.map((m) => {
    const top = y;
    y += m.h + gap;
    return { ...m, top };
  });
  const visibleBottom = layout.reduce((acc, m) => acc + (sp(n, m.at, SPRING.smooth) * (m.h + gap)), 0);
  const scroll = Math.max(0, visibleBottom - VIEW_H + 10);

  const typing = (at: number) => prog(n, at - 18, at - 12) * (1 - prog(n, at - 2, at + 2));
  const typingVisible = Math.max(typing(44), typing(112), typing(180), typing(282));

  // kamera: chat sedikit ber-rotasi 3D (premium float)
  const ry = keys(n, [
    [-30, 18],
    [60, 8, E.out],
    [400, 4, E.inOut],
  ]);
  const flyOut = prog(n, 428, 470, E.in);

  // kursor (tap tombol inline)
  const cx = keys(n, [
    [70, 1150],
    [90, 860, E.inOut],
    [130, 1000],
    [148, 960, E.inOut],
    [234, 1120],
    [254, 1040, E.inOut],
    [300, 1300],
  ]);
  // posisi tombol mengikuti scroll: hitung dari layout
  const btnY = (msgIndex: number, rowOffset: number) => CHAT.y + HEADER_H + 20 + layout[msgIndex].top - scroll + rowOffset;
  const cursorY = n < 120 ? mix(980, btnY(1, 70), prog(n, 70, 90, E.inOut)) : n < 200 ? btnY(2, 64) + (1 - prog(n, 125, 148, E.inOut)) * 120 : mix(mix(btnY(2, 64), btnY(1, 70), prog(n, 234, 254, E.inOut)), 1000, prog(n, 270, 300, E.inOut));
  const cursorO = prog(n, 66, 78) * (1 - prog(n, 280, 296));
  const cursorPress = Math.max(press(n, 92), press(n, 150), press(n, 256));

  return (
    <AbsoluteFill>
      <Backdrop dots={0.5} offsetX={n * 0.2} />

      {/* aliran data: chat -> node server */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {NODES.map((nd, i) => {
          const d = `M${CHAT.x + CHAT.w + 10},${540 + (i - 1) * 60} C${1350},${540 + (i - 1) * 60} ${1380},${nd.y} ${nd.x - 70},${nd.y}`;
          const draw = prog(n, 40 + i * 8, 100 + i * 8, E.inOut);
          return (
            <g key={i}>
              <path d={d} stroke={C.line} strokeWidth={2} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} />
              <path d={d} stroke={C.terracotta} strokeWidth={2.5} fill="none" pathLength={1} strokeDasharray="0.06 0.94" strokeDashoffset={-((n * 0.012 + i * 0.3) % 1)} opacity={prog(n, 190, 210) * (1 - flyOut)} strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      {NODES.map((nd, i) => {
        const e = sp(n, 60 + i * 8, SPRING.pop);
        const live = prog(n, 236 + i * 10, 248 + i * 10);
        return (
          <div key={nd.label} style={{ position: "absolute", left: nd.x - 70, top: nd.y - 44, transform: `scale(${e})`, opacity: 1 - flyOut }}>
            <Card style={{ width: 180, height: 88, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", border: `1.5px solid ${live > 0.5 ? C.terracotta : C.line}` }}>
              <IconTile name="server" size={44} bg={live > 0.5 ? C.terracotta : C.terracottaSoft} color={live > 0.5 ? C.white : C.terracottaDeep} />
              <div style={{ fontFamily: F.ui }}>
                <div style={{ fontFamily: F.mono, fontSize: 16, color: C.charcoal }}>{nd.label}</div>
                <div style={{ fontSize: 13, color: live > 0.5 ? C.green : C.muted, display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Dot size={7} color={live > 0.5 ? C.green : C.muted} pulse={live > 0.5 ? ((n + i * 9) % 40) / 40 : 0} /> {live > 0.5 ? "sinkron" : "idle"}
                </div>
              </div>
            </Card>
          </div>
        );
      })}

      {/* jendela chat */}
      <AbsoluteFill style={{ perspective: 2400 }}>
        <div
          style={{
            position: "absolute",
            left: CHAT.x,
            top: CHAT.y,
            width: CHAT.w,
            height: CHAT.h,
            transform: `rotateY(${ry}deg) translateZ(${(1 - sp(n, -26, SPRING.smooth)) * -300}px)`,
            borderRadius: 34,
            background: C.white,
            border: `1px solid ${C.line}`,
            boxShadow: SHADOW.float,
            overflow: "hidden",
          }}
        >
          <div style={{ height: HEADER_H, display: "flex", alignItems: "center", gap: 14, padding: "0 24px", borderBottom: `1px solid ${C.line}`, background: C.warmWhite }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: C.terracotta, display: "grid", placeItems: "center" }}>
              <Icon name="send" size={24} color={C.white} stroke={2} />
            </div>
            <div style={{ fontFamily: F.ui }}>
              <div style={{ fontWeight: 600, fontSize: 19, color: C.charcoal }}>Felixiority Bot</div>
              <div style={{ fontSize: 14, color: typingVisible > 0.5 ? C.terracotta : C.muted }}>{typingVisible > 0.5 ? "mengetik…" : "bot · online"}</div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: HEADER_H, height: VIEW_H + 20, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 20, right: 20, top: 20, transform: `translateY(${-scroll}px)` }}>
              {layout.map((m, i) => {
                const e = sp(n, m.at, SPRING.pop);
                if (e < 0.001) return null;
                const user = m.from === "user";
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: m.top,
                      left: user ? undefined : 0,
                      right: user ? 0 : undefined,
                      maxWidth: user ? 300 : 430,
                      width: user ? undefined : 430,
                      padding: "14px 18px",
                      borderRadius: 20,
                      borderBottomRightRadius: user ? 6 : 20,
                      borderBottomLeftRadius: user ? 20 : 6,
                      background: user ? C.charcoal : C.softGray,
                      color: user ? C.white : C.charcoal,
                      fontFamily: F.ui,
                      fontSize: 17,
                      lineHeight: 1.4,
                      transformOrigin: user ? "right bottom" : "left bottom",
                      transform: `translateY(${(1 - e) * 24}px) scale(${0.85 + 0.15 * e})`,
                      opacity: Math.min(1, e * 1.5),
                    }}
                  >
                    {m.node(n)}
                  </div>
                );
              })}
              {/* indikator mengetik */}
              <div style={{ position: "absolute", top: visibleBottom, left: 0, padding: "12px 16px", borderRadius: 18, background: C.softGray, display: "flex", gap: 6, opacity: typingVisible, transform: `scale(${0.8 + typingVisible * 0.2})`, transformOrigin: "left top" }}>
                {[0, 1, 2].map((k) => (
                  <span key={k} style={{ width: 8, height: 8, borderRadius: 4, background: C.muted, transform: `translateY(${Math.sin(n / 4 - k) * 3}px)` }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 54, borderRadius: 27, background: C.warmWhite, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 22px", fontFamily: F.ui, fontSize: 16, color: C.muted, justifyContent: "space-between" }}>
            Tulis pesan…
            <Icon name="send" size={20} color={C.terracotta} />
          </div>
        </div>
      </AbsoluteFill>

      {/* notifikasi pop-up */}
      <div style={{ position: "absolute", right: 60, top: 60, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
        {NOTIFS.map((nt) => {
          const e = sp(n, nt.at, SPRING.pop);
          const out = prog(n, nt.at + 70, nt.at + 84, E.in);
          if (e < 0.001 || out >= 1) return null;
          return (
            <div key={nt.title} style={{ transform: `translateX(${(1 - e) * 120 + out * 80}px) scale(${0.92 + 0.08 * e})`, opacity: Math.min(1, e * 1.5) * (1 - out), height: 76 * (1 - out) + 0.01, marginBottom: -12 * out }}>
              <Card float radius={18} style={{ width: 380, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
                <IconTile name={nt.icon} size={46} />
                <div style={{ fontFamily: F.ui }}>
                  <div style={{ fontWeight: 600, fontSize: 17, color: C.charcoal }}>{nt.title}</div>
                  <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>{nt.body}</div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* teks */}
      <div style={{ position: "absolute", left: 110, top: 300, width: 540 }}>
        <SectionLabel index="05" title="TELEGRAM AUTOMATION" f={n} delay={6} exitAt={410} />
        <div style={{ marginTop: 26 }}>
          <Headline parts={[["Automation", "sans"], ["That Works.", "serif"]]} f={n} delay={18} size={84} exitAt={408} />
        </div>
        <div style={{ marginTop: 24, fontFamily: F.ui, fontSize: 21, lineHeight: 1.45, color: C.charcoalSoft }}>
          <MaskWords text="Pesan, bayar, pantau, dan terima notifikasi server — langsung dari Telegram." f={n} delay={70} stagger={2} exitAt={412} />
        </div>
      </div>

      <Cursor x={cx} y={cursorY} press={cursorPress} style={{ opacity: cursorO }} />

      {/* objek transisi: bubble melesat ke kamera, menutup frame */}
      {flyOut > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 960 - 200,
            top: 540 - 60,
            width: 400,
            height: 120,
            borderRadius: 26,
            background: C.white,
            boxShadow: SHADOW.float,
            transform: `translate(${mix(-90, 0, flyOut)}px, ${mix(260, 0, flyOut)}px) scale(${mix(0.6, 14, flyOut ** 1.4)})`,
            filter: `blur(${flyOut * 4}px)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
