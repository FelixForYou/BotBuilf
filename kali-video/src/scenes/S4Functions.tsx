import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, prog, spr } from "../timing";

const FUNCS: { icon: IconName; title: string; sub: string }[] = [
  { icon: "target", title: "Penetration Testing", sub: "menguji keamanan sistem dengan izin" },
  { icon: "network", title: "Network Security", sub: "menganalisis & mengaudit jaringan" },
  { icon: "globe", title: "Web Application Security", sub: "mengenali potensi celah aplikasi web" },
  { icon: "fingerprint", title: "Digital Forensics", sub: "membantu analisis bukti digital" },
  { icon: "list", title: "Vulnerability Assessment", sub: "menemukan & menilai kelemahan" },
  { icon: "wifi", title: "Wireless Security Testing", sub: "menguji keamanan jaringan WiFi" },
];

/* ---- Illustrations, each drawn for its function. `t` = frames since its start ---- */
const IlluPentest: React.FC<{ t: number }> = ({ t }) => {
  const stamp = spr(t, 40, 10, 180);
  return (
    <svg width={760} height={560} viewBox="0 0 760 560">
      {[180, 130, 80, 30].map((r, i) => (
        <circle key={r} cx={300} cy={280} r={r * prog(t, i * 4, 24)} fill="none" stroke={i % 2 ? C.cyan : C.kali} strokeWidth={4} opacity={0.8} />
      ))}
      <line x1={300} y1={60} x2={300} y2={500} stroke={C.kali} strokeOpacity={0.4} />
      <line x1={80} y1={280} x2={520} y2={280} stroke={C.kali} strokeOpacity={0.4} />
      {/* permission document */}
      <g transform={`translate(520 120) rotate(6)`} opacity={prog(t, 10, 20)}>
        <rect width={200} height={260} rx={12} fill={C.panelSolid} stroke={C.muted} strokeWidth={2} />
        {[40, 75, 110, 145].map((y) => (
          <rect key={y} x={24} y={y} width={150} height={10} rx={5} fill={C.dim} />
        ))}
        <text x={24} y={30} fill={C.text} fontFamily={MONO} fontSize={18}>SURAT IZIN</text>
        <g transform={`translate(100 210) scale(${stamp}) rotate(-12)`} opacity={Math.min(1, stamp)}>
          <rect x={-80} y={-28} width={160} height={56} rx={8} fill="none" stroke={C.green} strokeWidth={5} />
          <text x={0} y={11} textAnchor="middle" fill={C.green} fontFamily={MONO} fontSize={30} fontWeight={700}>DIIZINKAN</text>
        </g>
      </g>
    </svg>
  );
};

const NET = [
  [120, 280], [300, 140], [300, 420], [480, 280], [640, 140], [640, 420], [480, 80], [480, 480],
];
const NET_E = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [1, 6], [2, 7], [4, 6], [5, 7]];
const IlluNetwork: React.FC<{ t: number }> = ({ t }) => (
  <svg width={760} height={560} viewBox="0 0 760 560">
    {NET_E.map(([a, b], k) => {
      const p = prog(t, k * 2, 20);
      const [x1, y1] = NET[a];
      const [x2, y2] = NET[b];
      const pk = ((t - k * 5) % 40) / 40;
      return (
        <g key={k}>
          <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={C.kali} strokeWidth={3} opacity={0.7} />
          {t > 30 ? <circle cx={x1 + (x2 - x1) * pk} cy={y1 + (y2 - y1) * pk} r={6} fill={C.cyan} /> : null}
        </g>
      );
    })}
    {NET.map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`} opacity={prog(t, i * 3, 14)}>
        <rect x={-34} y={-26} width={68} height={52} rx={10} fill={C.panelSolid} stroke={i === 3 ? C.cyan : C.kali} strokeWidth={3} />
        <circle r={6} fill={i === 3 ? C.cyan : C.kali} />
      </g>
    ))}
    {/* audit scan ring sweeping */}
    <circle cx={480} cy={280} r={40 + ((t * 3) % 260)} fill="none" stroke={C.cyan} strokeWidth={3} opacity={Math.max(0, 1 - ((t * 3) % 260) / 260)} />
  </svg>
);

const IlluWeb: React.FC<{ t: number }> = ({ t }) => {
  const scanY = 150 + ((t * 4) % 300);
  const flag = spr(t, 50, 12, 160);
  return (
    <svg width={760} height={560} viewBox="0 0 760 560">
      <rect x={60} y={60} width={640} height={440} rx={18} fill={C.panelSolid} stroke={C.kali} strokeWidth={3} opacity={prog(t, 0, 16)} />
      <rect x={60} y={60} width={640} height={52} rx={18} fill="#14223f" />
      <rect x={140} y={74} width={420} height={24} rx={12} fill={C.bg} />
      <text x={156} y={92} fill={C.muted} fontFamily={MONO} fontSize={16}>https://lab.local/login</text>
      {[150, 190, 230, 300, 340, 380, 420].map((y, i) => (
        <rect key={y} x={100} y={y} width={(i * 97) % 300 + 200} height={16} rx={8} fill={i === 4 ? C.orange : C.dim} opacity={prog(t, 6 + i * 3, 14) * (i === 4 && t > 50 ? 1 : 0.7)} />
      ))}
      <rect x={60} y={scanY} width={640} height={3} fill={C.cyan} opacity={0.8} />
      <g transform={`translate(${380 + Math.sin(t / 15) * 120} ${330 + Math.cos(t / 18) * 60})`}>
        <circle r={60} fill={`${C.cyan}22`} stroke={C.cyan} strokeWidth={6} />
        <line x1={42} y1={42} x2={95} y2={95} stroke={C.cyan} strokeWidth={12} strokeLinecap="round" />
      </g>
      <g transform={`translate(560 330) scale(${flag})`} opacity={Math.min(1, flag)}>
        <rect x={-10} y={-26} width={180} height={52} rx={10} fill={`${C.orange}22`} stroke={C.orange} strokeWidth={3} />
        <text x={80} y={9} textAnchor="middle" fill={C.orange} fontFamily={MONO} fontSize={22}>potensi celah</text>
      </g>
    </svg>
  );
};

const IlluForensics: React.FC<{ t: number }> = ({ t }) => (
  <svg width={760} height={560} viewBox="0 0 760 560">
    <g transform="translate(90 130)" opacity={prog(t, 0, 16)}>
      <rect width={260} height={300} rx={20} fill={C.panelSolid} stroke={C.kali} strokeWidth={3} />
      <circle cx={130} cy={130} r={80} fill="none" stroke={C.kali} strokeWidth={3} />
      <circle cx={130} cy={130} r={14} fill={C.kali} />
      <line x1={130} y1={130} x2={190} y2={210} stroke={C.cyan} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 4} 130 130)`} />
      <text x={130} y={270} textAnchor="middle" fill={C.muted} fontFamily={MONO} fontSize={20}>disk image</text>
    </g>
    {/* evidence timeline tags */}
    {["10:02 file dibuat", "10:07 login", "10:09 file diubah", "10:12 koneksi"].map((s, i) => {
      const p = prog(t, 14 + i * 10, 16);
      return (
        <g key={s} transform={`translate(${420 + (1 - p) * 40} ${150 + i * 80})`} opacity={p}>
          <rect width={300} height={56} rx={10} fill={C.panelSolid} stroke={i === 2 ? C.cyan : C.dim} strokeWidth={2} />
          <circle cx={26} cy={28} r={7} fill={i === 2 ? C.cyan : C.muted} />
          <text x={46} y={36} fill={C.text} fontFamily={MONO} fontSize={21}>{s}</text>
        </g>
      );
    })}
    <line x1={350} y1={280} x2={420} y2={150 + 2 * 80 + 28} stroke={C.cyan} strokeWidth={2} strokeDasharray="6 6" opacity={prog(t, 40, 14)} />
  </svg>
);

const IlluVuln: React.FC<{ t: number }> = ({ t }) => {
  const rows = [
    { l: "Software usang", sev: "TINGGI", c: C.red, w: 0.9 },
    { l: "Password lemah", sev: "SEDANG", c: C.orange, w: 0.62 },
    { l: "Port tak terpakai terbuka", sev: "SEDANG", c: C.orange, w: 0.55 },
    { l: "Header keamanan hilang", sev: "RENDAH", c: C.yellow, w: 0.3 },
  ];
  return (
    <svg width={760} height={560} viewBox="0 0 760 560">
      <text x={60} y={80} fill={C.cyan} fontFamily={MONO} fontSize={22} letterSpacing={4}>LAPORAN TEMUAN (CONTOH)</text>
      {rows.map((r, i) => {
        const p = prog(t, 6 + i * 10, 20);
        return (
          <g key={r.l} transform={`translate(60 ${120 + i * 100})`} opacity={p}>
            <rect width={640} height={80} rx={14} fill={C.panelSolid} stroke={C.dim} />
            <text x={24} y={34} fill={C.text} fontFamily={FONT} fontSize={26}>{r.l}</text>
            <rect x={24} y={50} width={420} height={10} rx={5} fill={C.dim} opacity={0.5} />
            <rect x={24} y={50} width={420 * r.w * p} height={10} rx={5} fill={r.c} />
            <rect x={480} y={20} width={136} height={40} rx={8} fill={`${r.c}22`} stroke={r.c} />
            <text x={548} y={47} textAnchor="middle" fill={r.c} fontFamily={MONO} fontSize={20} fontWeight={700}>{r.sev}</text>
          </g>
        );
      })}
    </svg>
  );
};

const IlluWifi: React.FC<{ t: number }> = ({ t }) => (
  <svg width={760} height={560} viewBox="0 0 760 560">
    <g transform="translate(380 380)">
      {[1, 2, 3, 4].map((k) => {
        const ph = ((t / 30 + k * 0.25) % 1);
        return <path key={k} d={`M ${-k * 60} ${-k * 20} A ${k * 70} ${k * 70} 0 0 1 ${k * 60} ${-k * 20}`} fill="none" stroke={C.cyan} strokeWidth={10} strokeLinecap="round" opacity={0.25 + 0.75 * (1 - ph)} transform={`translate(0 ${-k * 30})`} />;
      })}
      <circle r={20} fill={C.cyan} />
      <rect x={-130} y={40} width={260} height={70} rx={14} fill={C.panelSolid} stroke={C.kali} strokeWidth={3} />
      <text x={0} y={85} textAnchor="middle" fill={C.text} fontFamily={MONO} fontSize={24}>WiFi-Lab · WPA2</text>
    </g>
    <g transform={`translate(600 140) scale(${spr(t, 40, 12, 160)})`}>
      <circle r={50} fill={`${C.green}22`} stroke={C.green} strokeWidth={4} />
      <path d="M -16 -2 v-10 a 16 16 0 0 1 32 0 v10 M -24 -2 h48 v32 h-48 z" fill="none" stroke={C.green} strokeWidth={5} strokeLinejoin="round" />
    </g>
  </svg>
);

const ILLU = [IlluPentest, IlluNetwork, IlluWeb, IlluForensics, IlluVuln, IlluWifi];

export const S4Functions: React.FC = () => {
  const f = useCurrentFrame();
  const starts = [1, 2, 3, 4, 5, 6].map((i) => beat("s4", `f${i}`));
  const active = starts.reduce((acc, s, i) => (f >= s ? i : acc), -1);
  const q = prog(f, 0, 24);
  const qOut = prog(f, starts[0] - 10, 20);

  return (
    <AbsoluteFill>
      {/* intro question */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", fontFamily: FONT, fontSize: 110, fontWeight: 700, color: C.text, opacity: q * (1 - qOut), transform: `scale(${1 + qOut * 0.2})`, filter: `blur(${qOut * 12}px)` }}>
        Apa saja <span style={{ color: C.kali }}>fungsinya?</span>
      </div>

      {/* list */}
      <div style={{ position: "absolute", left: 120, top: 170, width: 760, opacity: qOut }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.cyan, marginBottom: 22 }}>FUNGSI UTAMA KALI LINUX</div>
        {FUNCS.map((fn, i) => {
          const seen = f >= starts[i];
          const isAct = active === i;
          const p = prog(f, starts[i], 20);
          return (
            <div
              key={fn.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                height: 104,
                padding: "0 24px",
                marginBottom: 10,
                borderRadius: 16,
                background: isAct ? `${C.kali}26` : "transparent",
                border: `1.5px solid ${isAct ? C.kali : seen ? C.dim : "#16213a"}`,
                opacity: seen ? (isAct ? 1 : 0.55) : 0.18,
                transform: `translateX(${isAct ? 16 * p : 0}px)`,
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: isAct ? C.kali : `${C.kali}22` }}>
                <Icon name={fn.icon} size={38} color={isAct ? C.text : C.cyan} />
              </div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 700, color: C.text }}>{fn.title}</div>
                <div style={{ fontFamily: FONT, fontSize: 23, color: C.muted, opacity: isAct ? 1 : 0.8 }}>{fn.sub}</div>
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: MONO, fontSize: 24, color: isAct ? C.cyan : C.dim }}>0{i + 1}</span>
            </div>
          );
        })}
      </div>

      {/* illustration stage */}
      {active >= 0 ? (
        <div style={{ position: "absolute", left: 960, top: 190, width: 840, height: 640, borderRadius: 26, background: "rgba(6,11,24,0.6)", border: `1.5px solid ${C.kali}55`, overflow: "hidden" }}>
          {ILLU.map((Ill, i) => {
            const t = f - starts[i];
            const vis = active === i;
            if (!vis && !(active === i + 1 && t < starts[i + 1] - starts[i] + 16)) return null;
            const inP = prog(f, starts[i], 22);
            const outP = active > i ? prog(f, starts[i + 1], 16) : 0;
            return (
              <div key={i} style={{ position: "absolute", left: 40, top: 40, opacity: inP * (1 - outP), transform: `translateY(${(1 - inP) * 40 - outP * 40}px) scale(${0.94 + 0.06 * inP})`, filter: `blur(${(1 - inP) * 6 + outP * 6}px)` }}>
                <Ill t={t} />
              </div>
            );
          })}
          {/* corner label */}
          <div style={{ position: "absolute", left: 30, bottom: 22, fontFamily: MONO, fontSize: 20, color: C.dim }}>ilustrasi konsep</div>
          <div style={{ position: "absolute", right: 30, top: 22, fontFamily: MONO, fontSize: 22, color: C.cyan }}>{interpolate(active, [0, 5], [1, 6]).toFixed(0)} / 6</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
