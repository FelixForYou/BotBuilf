import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Icon } from "../components/Icons";
import { Cursor, Eyebrow, Pill } from "../components/Ui";
import { C, FONT, MONO, PAD } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

export const S8Closing: React.FC = () => {
  const f = useCurrentFrame();
  const head = beat("s8", "head");
  const strike = prog(f, beat("s8", "strike"), 12);
  const swap = Math.min(1, spr(f, beat("s8", "swap"), 12, 160));
  const legal = beat("s8", "legal");
  const dark = beat("s8", "dark");
  const fin = beat("s8", "final");
  const click = beat("s8", "click");
  const toDark = prog(f, dark, 24, easeInOut);
  const fs = Math.min(1, spr(f, fin, 14, 120));
  const saved = f >= click + 2;

  return (
    <AbsoluteFill>
      {/* light part */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - toDark }}>
        <div style={{ position: "absolute", left: PAD, top: 150, width: 940 }}>
          <Eyebrow text="07 · KESIMPULAN" start={head} />
          <div style={{ marginTop: 26, fontFamily: FONT, fontWeight: 800, fontSize: 110, lineHeight: 1.06, letterSpacing: -5, color: C.ink, opacity: prog(f, head, 16) }}>
            Alat buat
            <br />
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ opacity: 1 - swap, display: "inline-block", transform: `translateY(${-swap * 30}px)` }}>
                <Pill text="ngehack" color={C.red} size={110} p={prog(f, head + 8, 14)} strike={strike} />
              </span>
              <span style={{ position: "absolute", left: 0, top: 0, opacity: swap, transform: `translateY(${(1 - swap) * 30}px)`, whiteSpace: "nowrap" }}>
                <Pill text="melindungi." color={C.blue} size={110} p={swap} />
              </span>
            </span>
          </div>
        </div>
        <div style={{ position: "absolute", left: PAD, top: 640, width: 940 }}>
          {[
            ["Legal", "l0"],
            ["Berizin", "l1"],
            ["Bertanggung jawab", "l2"],
          ].map(([t, k]) => {
            const s = Math.min(1, spr(f, beat("s8", k), 12, 170));
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 22, height: 120, padding: "0 30px", marginBottom: 16, borderRadius: 22, background: C.greenSoft, opacity: s, transform: `translateX(${(1 - s) * 50}px)` }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={34} color="#fff" stroke={3} />
                </div>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 48, color: C.ink, letterSpacing: -1.5 }}>{t}</span>
              </div>
            );
          })}
          <div style={{ fontFamily: FONT, fontSize: 30, color: C.muted, fontWeight: 600, marginTop: 10, opacity: prog(f, legal + 30, 20) }}>Uji hanya sistem milikmu atau yang memberi izin.</div>
        </div>
      </div>

      {/* dark end card (like the reference outro) */}
      <div style={{ position: "absolute", inset: 0, opacity: toDark, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 560 }}>
        <div style={{ transform: `scale(${0.8 + 0.2 * fs})`, opacity: fs }}>
          <Img src={staticFile("img/kali-logo.svg")} style={{ width: 320, height: 181, filter: "drop-shadow(0 0 40px rgba(54,123,240,0.6))" }} />
        </div>
        <div style={{ marginTop: 60, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 88, lineHeight: 1.08, letterSpacing: -3.5 }}>
          <div style={{ color: "#fff", opacity: prog(f, fin + 6, 18), transform: `translateY(${(1 - prog(f, fin + 6, 18)) * 24}px)` }}>Understand Security.</div>
          <div style={{ color: "#5b8cff", opacity: prog(f, fin + 18, 18), transform: `translateY(${(1 - prog(f, fin + 18, 18)) * 24}px)` }}>Build Better Protection.</div>
        </div>
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 12, padding: "16px 34px", borderRadius: 999, background: saved ? "rgba(255,255,255,0.12)" : C.blue, color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 32, opacity: prog(f, fin + 34, 18), transform: `scale(${f >= click && f < click + 8 ? 0.92 : 1})`, boxShadow: saved ? undefined : `0 16px 40px ${C.blue}66` }}>
          <Icon name={saved ? "check" : "book"} size={32} color="#fff" stroke={2.6} />
          {saved ? "Tersimpan" : "Simpan buat belajar"}
        </div>
        <div style={{ marginTop: 24, fontFamily: MONO, fontSize: 22, color: "rgba(255,255,255,0.5)", opacity: prog(f, click + 20, 20) }}>sumber: kali.org · offsec.com</div>
      </div>
      <Cursor path={[{ at: beat("s8", "cur"), x: 760, y: 1300 }, { at: click - 2, x: 600, y: 1105 }, { at: click + 50, x: 700, y: 1260 }]} clicks={[click]} hideAfter={click + 60} />
    </AbsoluteFill>
  );
};
