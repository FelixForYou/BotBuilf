import React from "react";
import { AbsoluteFill } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { C, F } from "./theme";
import { expoInOut, mix } from "./anim";

/** Tirai biru seperti transisi halaman situs: naik menutup, label muncul, lalu tirai terangkat. */
type Props = { label: string };

const Curtain: React.FC<TransitionPresentationComponentProps<Props>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const p = presentationProgress;
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ opacity: p < 0.5 ? 1 : 0, transform: `translateY(${mix(expoInOut(Math.min(1, p * 2)), 0, -80)}px)` }}>{children}</AbsoluteFill>;
  }
  const inP = expoInOut(Math.min(1, p * 2)); // 0→0.5: tirai naik menutup
  const outP = expoInOut(Math.max(0, p * 2 - 1)); // 0.5→1: tirai terangkat
  const labelP = Math.sin(Math.min(1, Math.max(0, (p - 0.2) / 0.6)) * Math.PI);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p >= 0.5 ? 1 : 0, transform: `translateY(${mix(outP, 80, 0)}px)` }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          background: C.blue,
          color: C.bone,
          display: "grid",
          placeItems: "center",
          clipPath: `inset(${(1 - inP) * 100}% 0 ${outP * 100}% 0)`,
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontFamily: F.sans, fontSize: 170, fontWeight: 750, letterSpacing: "-0.04em", textTransform: "uppercase", lineHeight: 1, transform: `translateY(${mix(labelP, 100, 0)}%)` }}>
            {passedProps.label}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 60, fontFamily: F.mono, fontSize: 20, opacity: labelP, letterSpacing: "0.04em", textTransform: "uppercase" }}>Felixiority</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const curtain = (label: string): TransitionPresentation<Props> => ({ component: Curtain, props: { label } });
