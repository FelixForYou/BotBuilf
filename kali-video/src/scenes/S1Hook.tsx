import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CommandBar, Cursor, Eyebrow, Pill, Select } from "../components/Ui";
import { C, FONT, MONO, PAD, SHADOW } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const bubble = beat("s1", "bubble");
  const hl = beat("s1", "hl");
  const click = beat("s1", "click");
  const head = beat("s1", "head");
  const swap = beat("s1", "swap");

  const bs = spr(f, bubble, 13, 150);
  const hlP = prog(f, hl, 30);
  // after the reply click the comment shrinks into a small chip at the top
  const toTop = prog(f, click + 4, 30, easeInOut);
  const hp = spr(f, head, 14, 140);
  const pillA = prog(f, head + 6, 16);
  const strike = prog(f, swap - 14, 12);
  const swapP = spr(f, swap, 12, 160);

  return (
    <AbsoluteFill>
      {/* comment bubble */}
      <div
        style={{
          position: "absolute",
          left: interpolate(toTop, [0, 1], [PAD + 30, PAD]),
          top: interpolate(toTop, [0, 1], [640, 150]),
          width: interpolate(toTop, [0, 1], [880, 640]),
          padding: interpolate(toTop, [0, 1], [34, 18]),
          background: "#fff",
          borderRadius: 28,
          border: `1.5px solid ${C.line}`,
          boxShadow: SHADOW,
          opacity: Math.min(1, bs),
          transform: `scale(${0.85 + 0.15 * Math.min(1, bs)}) rotate(${(1 - Math.min(1, bs)) * -3}deg)`,
          transformOrigin: "0% 100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: interpolate(toTop, [0, 1], [54, 38]), height: interpolate(toTop, [0, 1], [54, 38]), borderRadius: 30, background: C.blueSoft, color: C.blue, fontFamily: FONT, fontWeight: 800, fontSize: interpolate(toTop, [0, 1], [24, 18]), display: "flex", alignItems: "center", justifyContent: "center" }}>P</div>
          <div style={{ fontFamily: FONT, fontSize: interpolate(toTop, [0, 1], [24, 18]), color: C.muted }}>Balas komentar @penonton</div>
        </div>
        <div style={{ position: "relative", marginTop: interpolate(toTop, [0, 1], [18, 10]), fontFamily: FONT, fontWeight: 700, fontSize: interpolate(toTop, [0, 1], [50, 30]), lineHeight: 1.2, color: C.ink, letterSpacing: -1 }}>
          <span style={{ background: `linear-gradient(90deg, ${C.blueSoft} ${hlP * 100}%, transparent ${hlP * 100}%)`, borderRadius: 8 }}>Bang, Kali Linux itu sebenernya buat apa sih?</span>
        </div>
        {/* reply button */}
        <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", opacity: 1 - toTop, height: interpolate(toTop, [0, 1], [56, 0]) }}>
          <div style={{ padding: "12px 26px", borderRadius: 999, background: f >= click ? C.blue : C.ink, color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 24, transform: `scale(${f >= click && f < click + 8 ? 0.92 : 1})` }}>Balas</div>
        </div>
      </div>

      {/* hook headline */}
      <div style={{ position: "absolute", left: PAD, top: 560, width: 940, opacity: Math.min(1, hp), transform: `translateY(${(1 - Math.min(1, hp)) * 40}px)` }}>
        <Eyebrow text="VIDEO EDUKASI · KALI LINUX" start={head} />
        <div style={{ marginTop: 24, fontFamily: FONT, fontWeight: 800, fontSize: 120, lineHeight: 1.05, letterSpacing: -5, color: C.ink }}>
          Katanya
          <br />
          buat{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ opacity: 1 - Math.min(1, swapP), display: "inline-block", transform: `translateY(${Math.min(1, swapP) * -30}px)` }}>
              <Pill text="hacker?" color={C.red} size={120} p={pillA} strike={strike} />
            </span>
            <span style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, swapP), transform: `translateY(${(1 - Math.min(1, swapP)) * 30}px)`, whiteSpace: "nowrap" }}>
              <Pill text="keamanan." color={C.blue} size={120} p={Math.min(1, swapP)} />
            </span>
          </span>
        </div>
        <div style={{ marginTop: 80, fontFamily: FONT, fontSize: 40, color: C.muted, fontWeight: 600, opacity: prog(f, swap + 20, 20) }}>Aku jelasin, simpel aja.</div>
      </div>
      <Select x={330} y={728} w={695} h={160} start={beat("s1", "sel")} />

      <div style={{ position: "absolute", left: PAD, top: 1300, fontFamily: MONO, fontSize: 20, color: C.faint, letterSpacing: 2, opacity: prog(f, swap + 30, 20) }}>APA ITU · SEJARAH · FUNGSI · TOOLS · PENGGUNA</div>

      <CommandBar />
      <Cursor
        path={[
          { at: beat("s1", "cursor"), x: 700, y: 1100 },
          { at: click - 2, x: PAD + 30 + 880 - 110, y: 640 + 34 + 54 + 18 + 120 + 22 + 20 },
          { at: click + 40, x: 900, y: 1250 },
        ]}
        clicks={[click]}
        hideAfter={click + 50}
      />
    </AbsoluteFill>
  );
};
