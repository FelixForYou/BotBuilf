import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ServerUnit } from "../components/Box3D";
import { Camera } from "../components/Camera";
import { Backdrop, Card, Cursor, Dot, Icon, IconTile, Pill } from "../components/Primitives";
import { Headline, SectionLabel } from "../components/Type";
import { E, SPRING, keys, mix, prog, sp, tw } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C, F, SHADOW } from "../theme";
import { S2_BRIDGE } from "./S02Tools";

const PANEL = { x: 120, y: 280, w: 1680, h: 700 };
/** Rect awal = kartu "Server" Scene 02 di tengah layar (setelah zoom). */
const FROM = {
  w: S2_BRIDGE.w * S2_BRIDGE.endScale,
  h: S2_BRIDGE.h * S2_BRIDGE.endScale,
};

/** Jendela deployment — portal yang dimasuki kamera menuju Scene 04. */
export const S3_PORTAL = { x: 1010, y: 470, w: 700, h: 440 };
const PORTAL_C = { x: S3_PORTAL.x + S3_PORTAL.w / 2, y: S3_PORTAL.y + S3_PORTAL.h / 2 };
export const S3_ZOOM_END = 2.6;

const STEPS = [
  { en: "Product Selection", id: "Pilih paket", icon: "box" as const },
  { en: "Checkout", id: "Ringkasan pesanan", icon: "cart" as const },
  { en: "Payment", id: "Pembayaran", icon: "card" as const },
  { en: "Deployment", id: "Server aktif", icon: "server" as const },
];
const STEP_AT = [40, 150, 235, 320];

const PLANS = [
  { name: "Starter", price: "Rp 15rb", spec: "2 GB RAM · 1 vCPU" },
  { name: "Pro", price: "Rp 35rb", spec: "6 GB RAM · 3 vCPU" },
  { name: "Ultimate", price: "Rp 75rb", spec: "16 GB RAM · 6 vCPU" },
];

export const S03FelixPanel: React.FC = () => {
  const f = useCurrentFrame();
  const n = f - OVERLAP;

  // --------------------------------------------- morph dari kartu Scene 02
  const m = prog(f, 0, 34, E.inOut);
  const px = mix(960 - FROM.w / 2, PANEL.x, m);
  const py = mix(540 - FROM.h / 2, PANEL.y, m);
  const pw = mix(FROM.w, PANEL.w, m);
  const ph = mix(FROM.h, PANEL.h, m);
  const pr = mix(29, 30, m);
  const content = prog(f, 22, 42);
  const bridgeLabel = 1 - prog(f, 6, 20);

  // ------------------------------------- step aktif & progress garis
  const stepP = (i: number) => sp(n, STEP_AT[i], SPRING.smooth);
  const lineFill = keys(n, [
    [STEP_AT[0], 0],
    [STEP_AT[1], 1 / 3, E.inOut],
    [STEP_AT[2], 2 / 3, E.inOut],
    [STEP_AT[3], 1, E.inOut],
  ]);
  const current = n < STEP_AT[1] ? 0 : n < STEP_AT[2] ? 1 : n < STEP_AT[3] ? 2 : 3;

  // ---------------------------- kamera: drift halus lalu masuk lewat portal
  const zoom = keys(n, [
    [380, 1],
    [480, S3_ZOOM_END, E.in],
  ]);
  const toPortal = prog(n, 360, 440, E.inOut);
  const camX = mix(Math.sin(n / 70) * 8, PORTAL_C.x - 960, toPortal);
  const camY = mix(0, PORTAL_C.y - 540, toPortal);
  const camRx = mix(Math.sin(n / 90) * 1.5, 0, toPortal);

  /** kartu step: masuk dari kanan, keluar ke kiri (card transition) */
  const stage = (i: number, node: React.ReactNode) => {
    const inP = sp(n, STEP_AT[i] - 6, SPRING.smooth);
    const outP = i < 3 ? sp(n, STEP_AT[i + 1] - 8, SPRING.smooth) : 0;
    if (inP < 0.001 || outP > 0.999) return null;
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${(1 - inP) * 520 - outP * 520}px) scale(${1 - outP * 0.1 - (1 - inP) * 0.06}) rotateY(${(1 - inP) * -12 + outP * 12}deg)`,
          opacity: Math.min(inP * 1.6, 1) * (1 - outP),
          filter: `blur(${(1 - inP) * 6 + outP * 6}px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {node}
      </div>
    );
  };

  // ---------------------------------------------------- interaksi kursor
  const cursor = (() => {
    const pts: Array<[number, number, number]> = [
      [60, 1500, 1000],
      [92, 958, 735], // ke paket Pro
      [140, 1000, 760],
      [180, 1290, 650], // tombol bayar
      [230, 1250, 900],
      [300, 1700, 1040],
    ];
    const x = keys(n, pts.map(([t, xx]) => [t, xx, E.inOut] as [number, number, (t: number) => number]));
    const y = keys(n, pts.map(([t, , yy]) => [t, yy, E.inOut] as [number, number, (t: number) => number]));
    const press = (at: number) => prog(n, at, at + 6) * (1 - prog(n, at + 6, at + 22));
    return { x, y, press: Math.max(press(100), press(192)), o: prog(n, 55, 70) * (1 - prog(n, 290, 310)) };
  })();

  const proSelected = prog(n, 102, 116);
  const payPressed = prog(n, 192, 200) * (1 - prog(n, 200, 214));
  const qrScan = prog(n, 245, 300, E.inOut);
  const paid = sp(n, 296, SPRING.pop);
  const deploySteps = ["Membuat container", "Memasang egg & dependensi", "Konfigurasi jaringan", "Server dijalankan"];

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: prog(f, 18, 40) }}>
        <Backdrop dots={0.45} offsetY={-n * 0.25} />
      </AbsoluteFill>
      <Camera s={zoom} x={camX} y={camY} rx={camRx} ox={PORTAL_C.x} oy={PORTAL_C.y} perspective={2200}>
        {/* judul */}
        <div style={{ position: "absolute", left: PANEL.x, top: 96, opacity: content }}>
          <SectionLabel index="03" title="FELIX PANEL" f={n} delay={0} exitAt={400} />
          <div style={{ marginTop: 22 }}>
            <Headline parts={[["From Order to", "sans"], ["Deployment.", "serif"]]} f={n} delay={12} size={74} exitAt={398} />
          </div>
        </div>
        <div style={{ position: "absolute", right: PANEL.x, top: 186, width: 420, fontFamily: F.ui, fontSize: 19, lineHeight: 1.45, color: C.charcoalSoft, textAlign: "right", opacity: prog(n, 40, 70) * (1 - prog(n, 395, 415)) }}>
          Sistem pemesanan panel otomatis — dari memilih paket hingga server menyala.
        </div>

        {/* panel utama (hasil morph kartu) */}
        <div
          style={{
            position: "absolute",
            left: px,
            top: py,
            width: pw,
            height: ph,
            borderRadius: pr,
            background: C.white,
            border: `1px solid ${C.line}`,
            boxShadow: SHADOW.float,
            overflow: "hidden",
            transformStyle: "preserve-3d",
          }}
        >
          {/* sisa isi kartu "Server" yang memudar saat morph */}
          <div style={{ position: "absolute", left: 30, top: 26, opacity: bridgeLabel, fontFamily: F.ui }}>
            <div style={{ fontSize: 26, color: C.muted }}>Server</div>
            <div style={{ fontFamily: F.sans, fontSize: 74, fontWeight: 600, letterSpacing: "-0.04em", color: C.charcoal }}>248</div>
          </div>

          <div style={{ position: "absolute", left: 0, top: 0, width: PANEL.w, height: PANEL.h, opacity: content }}>
            {/* stepper */}
            <div style={{ position: "absolute", left: 70, right: 70, top: 34, height: 70 }}>
              <div style={{ position: "absolute", left: 26, right: 26, top: 25, height: 3, background: C.softGray, borderRadius: 3 }} />
              <div style={{ position: "absolute", left: 26, top: 25, height: 3, width: `calc((100% - 52px) * ${lineFill})`, background: C.terracotta, borderRadius: 3 }} />
              {STEPS.map((s, i) => {
                const p = stepP(i);
                const done = i < current;
                const on = i === current;
                const left = `calc(${(i / 3) * 100}% - ${(i / 3) * 52}px)`;
                return (
                  <div key={s.en} style={{ position: "absolute", left, top: 0, display: "flex", flexDirection: "column", alignItems: i === 0 ? "flex-start" : i === 3 ? "flex-end" : "center", width: 52, transform: i === 0 ? undefined : i === 3 ? "translateX(0)" : undefined }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        display: "grid",
                        placeItems: "center",
                        background: done || on ? C.terracotta : C.white,
                        border: `2px solid ${done || on ? C.terracotta : C.line}`,
                        transform: `scale(${1 + (on ? 0.08 : 0) * p})`,
                        boxShadow: on ? `0 0 0 ${8 * p}px rgba(204,120,92,0.15)` : undefined,
                      }}
                    >
                      <Icon name={done ? "check" : s.icon} size={24} color={done || on ? C.white : C.muted} stroke={2} />
                    </div>
                    <div style={{ position: "absolute", top: 62, whiteSpace: "nowrap", textAlign: "center", left: i === 0 ? 0 : undefined, right: i === 3 ? 0 : undefined }}>
                      <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 19, color: on || done ? C.charcoal : C.muted }}>{s.en}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 14, color: C.muted, marginTop: 2 }}>{s.id}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* panggung kartu step (koordinat relatif panel) */}
            <div style={{ position: "absolute", left: 0, top: 170, width: PANEL.w, height: PANEL.h - 170, perspective: 1600 }}>
              {stage(
                0,
                <div style={{ display: "flex", justifyContent: "center", gap: 28, paddingTop: 40 }}>
                  {PLANS.map((p, i) => {
                    const e = sp(n, STEP_AT[0] + i * 6, SPRING.pop);
                    const sel = i === 1 ? proSelected : 0;
                    return (
                      <div
                        key={p.name}
                        style={{
                          width: 380,
                          padding: "30px 30px",
                          borderRadius: 22,
                          background: sel > 0.5 ? C.charcoal : C.warmWhite,
                          color: sel > 0.5 ? C.white : C.charcoal,
                          border: `1.5px solid ${sel > 0.01 ? C.terracotta : C.line}`,
                          boxShadow: sel > 0.01 ? SHADOW.float : SHADOW.soft,
                          transform: `translateY(${(1 - e) * 60 - sel * 14}px) scale(${1 + sel * 0.03})`,
                          opacity: Math.min(1, e * 1.5),
                          fontFamily: F.ui,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 28 }}>{p.name}</span>
                          {i === 1 ? <Pill bg={C.terracotta} color={C.white}>Populer</Pill> : null}
                        </div>
                        <div style={{ fontFamily: F.serif, fontSize: 64, marginTop: 18, letterSpacing: "-0.01em" }}>
                          {p.price}
                          <span style={{ fontFamily: F.ui, fontSize: 18, opacity: 0.6 }}> /bulan</span>
                        </div>
                        <div style={{ fontSize: 18, opacity: 0.7, marginTop: 8 }}>{p.spec}</div>
                        <div style={{ marginTop: 24, height: 52, borderRadius: 14, display: "grid", placeItems: "center", fontWeight: 600, fontSize: 18, background: sel > 0.5 ? C.terracotta : C.white, color: sel > 0.5 ? C.white : C.charcoal, border: `1px solid ${sel > 0.5 ? C.terracotta : C.line}` }}>
                          {sel > 0.5 ? "Dipilih ✓" : "Pilih paket"}
                        </div>
                      </div>
                    );
                  })}
                </div>,
              )}
              {stage(
                1,
                <div style={{ display: "flex", justifyContent: "center", gap: 28, paddingTop: 30 }}>
                  <Card style={{ width: 640, padding: "28px 34px", fontFamily: F.ui, background: C.warmWhite }}>
                    <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 26, color: C.charcoal }}>Ringkasan Pesanan</div>
                    {[
                      ["Paket Pro · 1 bulan", "Rp 35.000"],
                      ["Lokasi node", "Jakarta-01"],
                      ["Egg", "Minecraft Paper"],
                      ["Diskon kode FELIX", "− Rp 5.000"],
                    ].map(([a, b], i) => (
                      <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", borderBottom: `1px solid ${C.line}`, fontSize: 19, color: C.charcoalSoft, opacity: prog(n, STEP_AT[1] + i * 5, STEP_AT[1] + 14 + i * 5) }}>
                        <span>{a}</span>
                        <span style={{ color: i === 3 ? C.terracotta : C.charcoal, fontWeight: 500 }}>{b}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 18, fontFamily: F.sans, fontSize: 26, fontWeight: 600, color: C.charcoal }}>
                      <span>Total</span>
                      <span>Rp 30.000</span>
                    </div>
                  </Card>
                  <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 18, paddingTop: 10 }}>
                    <Card style={{ padding: "22px 24px", fontFamily: F.ui }}>
                      <div style={{ fontSize: 16, color: C.muted }}>Metode</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontSize: 20, fontWeight: 600, color: C.charcoal }}>
                        <IconTile name="card" size={40} /> QRIS / E-Wallet
                      </div>
                    </Card>
                    <div
                      style={{
                        height: 74,
                        borderRadius: 18,
                        background: C.terracotta,
                        color: C.white,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        fontFamily: F.sans,
                        fontWeight: 600,
                        fontSize: 22,
                        transform: `scale(${1 - payPressed * 0.05})`,
                        boxShadow: `0 ${14 - payPressed * 10}px 30px -10px rgba(204,120,92,0.6)`,
                      }}
                    >
                      Bayar Sekarang <Icon name="arrow" size={22} color={C.white} stroke={2.2} />
                    </div>
                  </div>
                </div>,
              )}
              {stage(
                2,
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 60, paddingTop: 30 }}>
                  <div style={{ position: "relative", width: 380, height: 380, borderRadius: 28, background: C.white, border: `1px solid ${C.line}`, boxShadow: SHADOW.card, padding: 34 }}>
                    <svg width={312} height={312} viewBox="0 0 25 25" shapeRendering="crispEdges">
                      {Array.from({ length: 25 * 25 }).map((_, k) => {
                        const x = k % 25;
                        const y = Math.floor(k / 25);
                        const finder = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7 && (x === cx || x === cx + 6 || y === cy || y === cy + 6 || (x >= cx + 2 && x <= cx + 4 && y >= cy + 2 && y <= cy + 4));
                        const inFinderZone = (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
                        const on = inFinderZone ? finder(0, 0) || finder(18, 0) || finder(0, 18) : (x * 7 + y * 13 + x * y) % 5 < 2;
                        const appear = prog(n, STEP_AT[2] + (x + y) * 0.6, STEP_AT[2] + 8 + (x + y) * 0.6);
                        return on ? <rect key={k} x={x} y={y} width={1} height={1} fill={C.charcoal} opacity={appear} /> : null;
                      })}
                    </svg>
                    <div style={{ position: "absolute", left: 24, right: 24, top: 34 + qrScan * 300, height: 3, background: C.terracotta, boxShadow: `0 0 18px ${C.terracotta}`, opacity: qrScan > 0 && qrScan < 1 ? 1 : 0 }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: "rgba(255,255,255,0.86)", display: "grid", placeItems: "center", opacity: paid }}>
                      <div style={{ width: 120, height: 120, borderRadius: 60, background: C.green, display: "grid", placeItems: "center", transform: `scale(${paid})` }}>
                        <Icon name="check" size={64} color={C.white} stroke={3} />
                      </div>
                    </div>
                  </div>
                  <div style={{ width: 520, fontFamily: F.ui }}>
                    <div style={{ fontFamily: F.serif, fontSize: 64, color: C.charcoal, lineHeight: 1 }}>Rp 30.000</div>
                    <div style={{ marginTop: 18, fontSize: 21, color: C.charcoalSoft, display: "flex", alignItems: "center", gap: 12 }}>
                      <Dot color={paid > 0.5 ? C.green : C.gold} pulse={(n % 40) / 40} />
                      {paid > 0.5 ? "Pembayaran berhasil diverifikasi" : "Menunggu pembayaran…"}
                    </div>
                    <div style={{ marginTop: 26, height: 8, borderRadius: 8, background: C.softGray, overflow: "hidden" }}>
                      <div style={{ width: `${qrScan * 100}%`, height: "100%", background: paid > 0.5 ? C.green : C.terracotta }} />
                    </div>
                    <div style={{ marginTop: 16, fontFamily: F.mono, fontSize: 15, color: C.muted }}>INV/2026/10/FX-0{Math.round(tw(n, STEP_AT[2], STEP_AT[2] + 40, 100, 248))}</div>
                  </div>
                </div>,
              )}
              {stage(
                3,
                <div style={{ position: "absolute", inset: 0 }}>
                  <div style={{ position: "absolute", left: 120, top: 40, width: 640, fontFamily: F.ui }}>
                    <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: C.charcoal, letterSpacing: "-0.02em" }}>Deploy otomatis</div>
                    <div style={{ fontFamily: F.mono, fontSize: 16, color: C.muted, marginTop: 6 }}>mc-survival-pro · node Jakarta-01</div>
                    <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                      {deploySteps.map((s, i) => {
                        const t0 = STEP_AT[3] + 6 + i * 16;
                        const done = prog(n, t0 + 12, t0 + 16);
                        const runP = prog(n, t0, t0 + 14);
                        return (
                          <div key={s} style={{ display: "flex", alignItems: "center", gap: 16, opacity: 0.35 + runP * 0.65, transform: `translateX(${(1 - runP) * 18}px)` }}>
                            <div style={{ width: 34, height: 34, borderRadius: 17, display: "grid", placeItems: "center", background: done > 0.5 ? C.green : C.softGray }}>
                              {done > 0.5 ? (
                                <Icon name="check" size={20} color={C.white} stroke={2.6} />
                              ) : (
                                <span style={{ width: 14, height: 14, borderRadius: 7, border: `2.5px solid ${C.terracotta}`, borderTopColor: "transparent", transform: `rotate(${n * 12}deg)`, opacity: runP }} />
                              )}
                            </div>
                            <span style={{ fontSize: 21, color: C.charcoal }}>{s}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 32 }}>
                      <Pill color={C.green} bg="#E7F1EA" style={{ fontSize: 18, padding: "8px 16px", opacity: prog(n, STEP_AT[3] + 72, STEP_AT[3] + 84) }}>
                        <Dot size={9} pulse={(n % 45) / 45} /> Online · 42 ms
                      </Pill>
                    </div>
                  </div>
                </div>,
              )}
            </div>
          </div>
        </div>

        {/* portal deployment: jendela 3D tempat server muncul (di luar overflow panel agar 3D utuh) */}
        {n > STEP_AT[3] - 12 ? (
          <Portal n={n} />
        ) : null}

        <Cursor x={cursor.x} y={cursor.y} press={cursor.press} style={{ opacity: cursor.o }} />
      </Camera>
    </AbsoluteFill>
  );
};

const Portal: React.FC<{ n: number }> = ({ n }) => {
  const e = sp(n, STEP_AT[3] - 4, SPRING.smooth);
  const rise = sp(n, STEP_AT[3] + 30, SPRING.pop);
  const r = S3_PORTAL;
  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        borderRadius: 26,
        background: C.softGray,
        border: `1px solid ${C.line}`,
        overflow: "hidden",
        opacity: Math.min(1, e * 1.5),
        transform: `translateX(${(1 - e) * 400}px) scale(${0.94 + 0.06 * e})`,
        perspective: 1200,
      }}
    >
      {/* lantai grid isometrik — sama dengan dunia Scene 04 (match cut) */}
      <div
        style={{
          position: "absolute",
          left: -400,
          top: 120,
          width: 1500,
          height: 900,
          transform: "rotateX(60deg) rotateZ(45deg)",
          backgroundImage: `linear-gradient(${C.line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.line} 1.5px, transparent 1.5px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: `${n * 0.6}px 0`,
        }}
      />
      <div style={{ position: "absolute", left: r.w / 2, top: r.h * 0.78, transformStyle: "preserve-3d", transform: `rotateX(-18deg) rotateY(${-32 + n * 0.12}deg)` }}>
        {/* bayangan kontak */}
        <div style={{ position: "absolute", left: -150, top: -40, width: 300, height: 80, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(38,37,34,0.35), transparent)", transform: `rotateX(90deg) scale(${0.5 + rise * 0.5})`, opacity: rise }} />
        <ServerUnit w={200} h={260} d={150} leds={tw(n, STEP_AT[3] + 40, STEP_AT[3] + 90, 0, 1)} t={n} style={{ transform: `translateY(${(1 - rise) * -260}px) scale(${0.6 + rise * 0.4})`, opacity: Math.min(1, rise * 2) }} />
      </div>
      <div style={{ position: "absolute", left: 24, top: 20, fontFamily: F.mono, fontSize: 15, color: C.charcoalSoft, display: "flex", gap: 10, alignItems: "center" }}>
        <Icon name="server" size={18} color={C.terracotta} /> live preview · node Jakarta-01
      </div>
    </div>
  );
};
