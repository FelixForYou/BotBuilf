import React, {useId} from 'react';

/**
 * Motion blur directional murah: SVG feGaussianBlur dengan stdDeviation "x y".
 * Berikan kecepatan (px/frame); blur ≈ 0.5 × kecepatan, sehingga terasa seperti
 * shutter 180° pada kamera sinematik.
 */
export const MotionBlur: React.FC<{
  vx?: number;
  vy?: number;
  shutter?: number;
  max?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({vx = 0, vy = 0, shutter = 0.5, max = 40, style, children}) => {
  const id = useId().replace(/:/g, '');
  const bx = Math.min(max, Math.abs(vx) * shutter);
  const by = Math.min(max, Math.abs(vy) * shutter);
  const on = bx > 0.35 || by > 0.35;
  return (
    <div style={{...style, filter: on ? `url(#mb${id})` : undefined}}>
      {on ? (
        <svg width="0" height="0" style={{position: 'absolute'}}>
          <filter id={`mb${id}`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};
