import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, copy} from '../config';
import {easeIn, easeInOut, pop, tween, velocity} from '../anim';
import {BrandChip} from '../components/Logo';
import {BlurFilter, blurFromVelocity, filterFor} from '../components/MotionBlur';
import {ServerRack} from '../components/Server3D';
import {Terminal} from '../components/Terminal';
import {RevealText, words} from '../components/UI';

export const HEADLINE_START = 66;
const DOLLY: [number, number] = [186, 240];

/** 0–4 detik: terminal -> pertanyaan -> kamera mendekati rak server (momen 3D #1). */
export const Scene1Intro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame > 250) return null;

	// Nama brand muncul di detik pertama
	const chip = pop(frame, fps, 6);
	const chipOut = tween(frame, [112, 134], [0, 1], easeIn);

	// Terminal: masuk, lalu miring menjauh saat server muncul
	const termIn = tween(frame, [0, 16], [0, 1]);
	const termOut = tween(frame, [126, 162], [0, 1], easeInOut);

	// Headline keluar ke bawah dengan motion blur
	const headY = (f: number) => tween(f, [DOLLY[0], DOLLY[0] + 30], [0, 420], easeIn);
	const headBlur = blurFromVelocity(velocity(headY, frame), 0.35);

	// Rak server: datang dari kedalaman, lalu kamera dolly ke layar
	const rackIn = tween(frame, [118, 176], [0, 1]);
	const dolly = tween(frame, [DOLLY[0], DOLLY[1]], [0, 1], easeIn);
	const rackZ = -1100 * (1 - rackIn) + 920 * dolly;
	const rackY = 590 + 370 * tween(frame, [DOLLY[0], DOLLY[1] - 10], [0, 1], easeInOut);
	const rotY = tween(frame, [118, DOLLY[0]], [-46, -24]) + 24 * tween(frame, [DOLLY[0], DOLLY[1] - 8], [0, 1], easeInOut);
	const rotX = tween(frame, [118, DOLLY[0]], [-14, -8]) + 8 * tween(frame, [DOLLY[0], DOLLY[1] - 8], [0, 1], easeInOut);
	const rackOpacity = Math.min(tween(frame, [118, 140], [0, 1]), tween(frame, [234, 246], [1, 0]));

	const flash = Math.min(tween(frame, [216, 234], [0, 1]), tween(frame, [234, 250], [1, 0]));

	return (
		<AbsoluteFill>
			<BlurFilter id="mb-head" x={0} y={headBlur} />

			{/* rak server 3D */}
			<AbsoluteFill style={{perspective: 1200, perspectiveOrigin: '540px 960px'}}>
				<div
					style={{
						position: 'absolute',
						left: 540 - 190,
						top: rackY - 250,
						scale: '0.86',
						transformStyle: 'preserve-3d',
						transform: `translateZ(${rackZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
						opacity: rackOpacity,
					}}
				>
					<ServerRack frame={frame} screenGlow={dolly} />
				</div>
			</AbsoluteFill>

			{/* terminal */}
			<AbsoluteFill style={{perspective: 1400, perspectiveOrigin: '540px 560px'}}>
				<div
					style={{
						position: 'absolute',
						left: 130,
						top: 360,
						width: 820,
						height: 400,
						opacity: termIn * (1 - termOut),
						transformOrigin: '50% 100%',
						transform: `translateY(${(1 - termIn) * 40 - termOut * 120}px) scale(${0.94 + 0.06 * termIn - 0.12 * termOut}) rotateX(${termOut * 38}deg)`,
					}}
				>
					<Terminal frame={frame} />
				</div>
			</AbsoluteFill>

			{/* brand */}
			<div
				style={{
					position: 'absolute',
					top: 236,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					opacity: chip * (1 - chipOut),
					transform: `translateY(${(1 - chip) * -30 - chipOut * 40}px) scale(${0.9 + 0.1 * chip})`,
				}}
			>
				<BrandChip size={40} />
			</div>

			{/* pertanyaan besar */}
			<div
				style={{
					position: 'absolute',
					top: 870,
					left: 130,
					width: 820,
					transform: `translateY(${headY(frame)}px)`,
					opacity: tween(frame, [DOLLY[0] + 6, DOLLY[0] + 30], [1, 0]),
					filter: filterFor('mb-head', 0, headBlur),
				}}
			>
				<RevealText
					lines={words(copy.intro.headline, copy.intro.accent)}
					frame={frame}
					start={HEADLINE_START}
					stagger={4}
					size={78}
				/>
			</div>

			{/* kilatan saat masuk ke layar server */}
			<AbsoluteFill
				style={{
					opacity: flash,
					background: `radial-gradient(circle at 50% 50%, ${colors.white} 0%, ${colors.electricBright} 30%, rgba(31,107,255,0.5) 60%, transparent 85%)`,
				}}
			/>
		</AbsoluteFill>
	);
};
