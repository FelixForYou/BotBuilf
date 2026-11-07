import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CommandBar, Headline, Pill, Select } from "../components/Ui";
import { C, FONT, MONO, PAD } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

/** Opening: just the question, then the hook. */
export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const q = beat("s1", "q");
  const head = beat("s1", "head");
  const swap = beat("s1", "swap");

  // the question moves up and shrinks when the hook arrives
  const up = prog(f, head - 8, 26, easeInOut);
  const hp = Math.min(1, spr(f, head, 14, 140));
  const pillA = prog(f, head + 6, 16);
  const strike = prog(f, swap - 14, 12);
  const swapP = Math.min(1, spr(f, swap, 12, 160));

  return (
    <AbsoluteFill>
      {/* the question */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: interpolate(up, [0, 1], [560, 160]),
          width: 940,
          transform: `scale(${interpolate(up, [0, 1], [1, 0.5])})`,
          transformOrigin: "0 0",
          opacity: interpolate(up, [0, 1], [1, 0.55]),
        }}
      >
        <Headline words={["Kali", "Linux", "itu", "buat", { t: "apa", accent: "blue" }, { t: "sih?", accent: "blue" }]} start={q} size={124} stagger={4} lineBreakAfter={[2]} />
      </div>

      {/* the hook */}
      <div style={{ position: "absolute", left: PAD, top: 560, width: 940, opacity: hp, transform: `translateY(${(1 - hp) * 50}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, lineHeight: 1.05, letterSpacing: -5, color: C.ink }}>
          Katanya
          <br />
          buat{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ opacity: 1 - swapP, display: "inline-block", transform: `translateY(${swapP * -30}px)` }}>
              <Pill text="hacker?" color={C.red} size={120} p={pillA} strike={strike} />
            </span>
            <span style={{ position: "absolute", left: 0, top: 0, opacity: swapP, transform: `translateY(${(1 - swapP) * 30}px)`, whiteSpace: "nowrap" }}>
              <Pill text="keamanan." color={C.blue} size={120} p={swapP} />
            </span>
          </span>
        </div>
        <div style={{ marginTop: 80, fontFamily: FONT, fontSize: 40, color: C.muted, fontWeight: 600, opacity: prog(f, swap + 20, 20) }}>Aku jelasin, simpel aja.</div>
      </div>
      <Select x={330} y={676} w={695} h={152} start={beat("s1", "sel")} />

      <div style={{ position: "absolute", left: PAD, top: 1300, fontFamily: MONO, fontSize: 20, color: C.faint, letterSpacing: 2, opacity: prog(f, swap + 30, 20) }}>APA ITU · SEJARAH · FUNGSI · TOOLS · PENGGUNA</div>

      <CommandBar />
    </AbsoluteFill>
  );
};
