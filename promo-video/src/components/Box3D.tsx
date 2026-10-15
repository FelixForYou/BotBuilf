import type {CSSProperties, ReactNode} from 'react';

type Face = {style?: CSSProperties; children?: ReactNode};

/** Balok CSS 3D sederhana (front/back/left/right/top/bottom). */
export const Box3D: React.FC<{
	w: number;
	h: number;
	d: number;
	front?: Face;
	back?: Face;
	left?: Face;
	right?: Face;
	top?: Face;
	bottom?: Face;
	base?: CSSProperties;
	style?: CSSProperties;
}> = ({w, h, d, front, back, left, right, top, bottom, base, style}) => {
	const face = (f: Face | undefined, s: CSSProperties) => (
		<div style={{position: 'absolute', overflow: 'hidden', backfaceVisibility: 'hidden', ...base, ...s, ...f?.style}}>{f?.children}</div>
	);
	return (
		<div style={{position: 'relative', width: w, height: h, transformStyle: 'preserve-3d', ...style}}>
			{face(back, {width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)`})}
			{face(left, {width: d, height: h, left: (w - d) / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)`})}
			{face(right, {width: d, height: h, left: (w - d) / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)`})}
			{face(top, {width: w, height: d, top: (h - d) / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)`})}
			{face(bottom, {width: w, height: d, top: (h - d) / 2, transform: `rotateX(-90deg) translateZ(${h / 2}px)`})}
			{face(front, {width: w, height: h, transform: `translateZ(${d / 2}px)`})}
		</div>
	);
};
