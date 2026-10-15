import {interpolate} from 'remotion';
import {colors} from '../config';
import {easeInOut, tween} from '../anim';

export type CursorKey = {f: number; x: number; y: number};

/** Posisi kursor dari keyframe, dengan easing in-out + sedikit lengkung agar terasa natural. */
export const cursorAt = (frame: number, keys: CursorKey[]) => {
	if (frame <= keys[0].f) return {x: keys[0].x, y: keys[0].y};
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i];
		const b = keys[i + 1];
		if (frame <= b.f) {
			const p = interpolate(frame, [a.f, b.f], [0, 1], {easing: easeInOut});
			const arc = Math.sin(p * Math.PI) * Math.min(60, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
			return {x: a.x + (b.x - a.x) * p + arc, y: a.y + (b.y - a.y) * p - arc * 0.5};
		}
	}
	const last = keys[keys.length - 1];
	return {x: last.x, y: last.y};
};

/** Kursor panah + efek tekan & riak saat klik. */
export const Cursor: React.FC<{frame: number; x: number; y: number; clicks: number[]; opacity?: number}> = ({
	frame,
	x,
	y,
	clicks,
	opacity = 1,
}) => {
	const recent = clicks.filter((c) => frame >= c - 4 && frame < c + 26);
	const press = clicks.reduce((m, c) => Math.max(m, frame >= c - 4 && frame < c + 8 ? 1 - Math.abs(frame - c) / 8 : 0), 0);
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity, pointerEvents: 'none'}}>
			{recent.map((c) => {
				const p = tween(frame, [c, c + 24], [0, 1]);
				return (
					<div
						key={c}
						style={{
							position: 'absolute',
							left: -60 * p,
							top: -60 * p,
							width: 120 * p,
							height: 120 * p,
							borderRadius: '50%',
							border: `4px solid ${colors.cyan}`,
							opacity: 1 - p,
						}}
					/>
				);
			})}
			<svg
				width={64}
				height={64}
				viewBox="0 0 24 24"
				style={{
					position: 'absolute',
					left: -6,
					top: -4,
					transform: `scale(${1 - press * 0.15})`,
					transformOrigin: '6px 4px',
					filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))',
				}}
			>
				<path d="M4 2.5 L4 19.5 L8.6 15.3 L11.6 21.6 L14.6 20.2 L11.6 14 L17.6 14 Z" fill={colors.white} stroke={colors.navyDeep} strokeWidth={1.4} strokeLinejoin="round" />
			</svg>
		</div>
	);
};
