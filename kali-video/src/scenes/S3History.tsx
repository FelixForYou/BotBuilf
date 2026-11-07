import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CommandBar, Eyebrow, Headline, Select } from "../components/Ui";
import { C, FONT, MONO, PAD, SHADOW } from "../theme";
import { beat, prog, spr } from "../timing";

// kali.org/docs/introduction/kali-linux-history (major releases)
const ITEMS = [
  { key: "t0", year: "2004", name: "Whoppix", sub: "berbasis Knoppix", kali: false, big: false },
  { key: "t1", year: "2005", name: "WHAX", sub: "berbasis Slax", kali: false, big: false },
  { key: "t2", year: "2006", name: "BackTrack", sub: "WHAX + Auditor Security Collection", kali: false, big: true },
  { key: "t3", year: "2010", name: "BackTrack 4", sub: "pindah ke Ubuntu", kali: false, big: false },
  { key: "t4", year: "13 Mar 2013", name: "Kali Linux 1.0", sub: "dibangun ulang di atas Debian", kali: true, big: true },
  { key: "t5", year: "2015", name: "Kali Linux 2.0", sub: "Debian 8", kali: true, big: false },
  { key: "t6", year: "2016", name: "Kali Rolling", sub: "rolling release · update terus", kali: true, big: true },
];
const ROW = 118;
const TOP = 440;

export const S3History: React.FC = () => {
  const f = useCurrentFrame();
  const send = beat("s3", "send");
  const times = ITEMS.map((it) => beat("s3", it.key));
  const lastIdx = times.reduce((a, t, i) => (f >= t ? i : a), -1);
  const railH = lastIdx < 0 ? 0 : lastIdx * ROW + 40;
  const railP = prog(f, times[Math.max(0, lastIdx)], 20);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 150, width: 940 }}>
        <Eyebrow text="02 · SEJARAH" start={send} />
        <div style={{ marginTop: 22 }}>
          <Headline words={["Dari", "BackTrack", "ke", { t: "Kali.", accent: "blue" }]} start={send + 4} lineBreakAfter={[1]} />
        </div>
      </div>

      {/* rail */}
      <div style={{ position: "absolute", left: PAD + 20, top: TOP + 30, width: 4, height: 6 * ROW, background: C.line, borderRadius: 2 }} />
      <div style={{ position: "absolute", left: PAD + 20, top: TOP + 30, width: 4, height: Math.max(0, railH - 40 + 40 * railP), background: C.blue, borderRadius: 2 }} />

      {ITEMS.map((it, i) => {
        const s = Math.min(1, spr(f, times[i], 14, 150));
        const y = TOP + i * ROW;
        const active = lastIdx === i;
        return (
          <div key={it.key} style={{ position: "absolute", left: PAD, top: y, width: 940, height: 100, opacity: s, transform: `translateX(${(1 - s) * 30}px)` }}>
            <div style={{ position: "absolute", left: 22 - (it.big ? 13 : 9), top: 30 - (it.big ? 13 : 9) + 2, width: it.big ? 26 : 18, height: it.big ? 26 : 18, borderRadius: 13, background: it.kali ? C.blue : "#fff", border: `3px solid ${it.kali ? C.blue : C.faint}`, boxShadow: active ? `0 0 0 8px ${C.blueSoft}` : undefined }} />
            <div
              style={{
                position: "absolute",
                left: 70,
                top: 0,
                right: 0,
                height: 100,
                borderRadius: 20,
                background: active ? "#fff" : "transparent",
                border: `1.5px solid ${active ? C.line : "transparent"}`,
                boxShadow: active ? SHADOW : undefined,
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "0 26px",
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 24, color: it.kali ? C.blue : C.muted, width: 190, fontWeight: 700 }}>{it.year}</span>
              <div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: it.big ? 40 : 34, color: C.ink, letterSpacing: -1 }}>{it.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 22, color: C.muted }}>{it.sub}</div>
              </div>
            </div>
          </div>
        );
      })}
      <Select x={PAD + 62} y={TOP + 2 * ROW - 8} w={870} h={116} start={times[2] + 4} end={times[3]} />
      <Select x={PAD + 62} y={TOP + 4 * ROW - 8} w={870} h={116} start={times[4] + 4} end={times[5]} label="lahirnya Kali" />
      <Select x={PAD + 62} y={TOP + 6 * ROW - 8} w={870} h={116} start={times[6] + 4} label="sampai sekarang" />
      <div style={{ position: "absolute", right: PAD, top: TOP + 7 * ROW + 10, fontFamily: MONO, fontSize: 18, color: C.faint, opacity: prog(f, times[6] + 20, 20) }}>sumber: kali.org · Kali Linux History</div>

      <CommandBar query="sejarahnya gimana?" typeAt={beat("s3", "type")} sendAt={send} />
    </AbsoluteFill>
  );
};
