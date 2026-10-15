import {Easing, interpolate, spring} from 'remotion';

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

/** interpolate dengan clamp + easing bawaan easeOut. */
export const tween = (
	frame: number,
	[from, to]: [number, number],
	[a, b]: [number, number],
	easing: (t: number) => number = easeOut,
) => interpolate(frame, [from, to], [a, b], {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Spring yang mulai pada frame `start`. */
export const pop = (frame: number, fps: number, start: number, damping = 16, mass = 0.7) =>
	spring({frame: frame - start, fps, config: {damping, mass, stiffness: 140}});

/** Masuk lalu keluar: 0 -> 1 -> 0. */
export const inOut = (frame: number, inStart: number, inEnd: number, outStart: number, outEnd: number) =>
	Math.min(tween(frame, [inStart, inEnd], [0, 1]), tween(frame, [outStart, outEnd], [1, 0], easeIn));

/** Kecepatan (px/frame) suatu fungsi posisi — dipakai untuk motion blur secukupnya. */
export const velocity = (fn: (f: number) => number, frame: number) => fn(frame + 0.5) - fn(frame - 0.5);

/** Pseudo-random deterministik dari seed. */
export const rand = (seed: number) => {
	const x = Math.sin(seed * 12.9898) * 43758.5453;
	return x - Math.floor(x);
};
