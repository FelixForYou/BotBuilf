import React from "react";
import * as L from "lucide";

type IconNode = [string, Record<string, string | number>][];

/**
 * Single icon family (Lucide, ISC licence) rendered as real SVG elements so every
 * part can be animated: `draw` (0..1) strokes each element on in sequence.
 */
export const Icon: React.FC<{
  name: keyof typeof L;
  size?: number;
  color?: string;
  stroke?: number;
  draw?: number;
  style?: React.CSSProperties;
  fill?: string;
}> = ({ name, size = 48, color = "currentColor", stroke = 1.75, draw = 1, style, fill = "none" }) => {
  const node = L[name] as unknown as IconNode;
  if (!Array.isArray(node)) throw new Error(`icon ${String(name)} missing`);
  const n = node.length;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", overflow: "visible", ...style }}>
      {node.map(([tag, attrs], i) => {
        // staggered per-element draw progress
        const local = Math.max(0, Math.min(1, draw * (n * 0.6 + 1) - i * 0.6));
        const props: Record<string, unknown> = { ...attrs, key: i, pathLength: 1 };
        if (draw < 1) {
          props.strokeDasharray = 1;
          props.strokeDashoffset = 1 - local;
        }
        return React.createElement(tag, props);
      })}
    </svg>
  );
};
