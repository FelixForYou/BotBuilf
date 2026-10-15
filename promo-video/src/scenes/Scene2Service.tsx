import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, copy, fonts} from '../config';
import {easeIn, easeInOut, tween, velocity} from '../anim';
import {Dashboard} from '../components/Dashboard';
import {BlurFilter, blurFromVelocity, filterFor} from '../components/MotionBlur';
import {ServerBlade} from '../components/Server3D';
import {RevealText, words} from '../components/UI';

export const DASH_T0 = 230; // frame global saat dashboard mulai muncul dari layar server
export const BLADE: [number, number] = [566, 622];

/** 4–10 detik: perkenalan + mockup dashboard. Keluar lewat blade server 3D yang melintas (momen 3D #2). */
export const Scene2Service: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame < 220 || frame > 630) return null;

	const emerge = tween(frame, [222, 266], [0, 1]);
	const exit = tween(frame, [574, 612], [0, 1], easeInOut);
	const float = Math.sin((frame - 260) / 45) * 2.2;

	const headOut = tween(frame, [568, 596], [0, 1], easeIn);

	// blade: melintas dari kanan ke kiri, sangat dekat dengan kamera
	const bladeX = (f: number) => tween(f, BLADE, [1500, -1500], easeInOut);
	const bladeBlur = blurFromVelocity(velocity(bladeX, frame), 0.06, 8);

	return (
		<AbsoluteFill>
			<BlurFilter id="mb-blade" x={bladeBlur} />

			{/* judul */}
			<div
				style={{
					position: 'absolute',
					top: 222,
					left: 130,
					width: 820,
					opacity: 1 - headOut,
					transform: `translateY(${-headOut * 60}px)`,
				}}
			>
				<RevealText lines={words(copy.service.headline, copy.service.accent)} frame={frame} start={246} size={68} stagger={5} />
				<div
					style={{
						marginTop: 18,
						fontFamily: fonts.display,
						fontWeight: 500,
						fontSize: 34,
						lineHeight: 1.35,
						color: colors.inkSoft,
						textAlign: 'center',
						opacity: tween(frame, [272, 292], [0, 1]),
						transform: `translateY(${tween(frame, [272, 296], [20, 0])}px)`,
					}}
				>
					{copy.service.subline.map((l) => (
						<div key={l}>{l}</div>
					))}
				</div>
			</div>

			{/* dashboard */}
			<AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '540px 1000px'}}>
				<div
					style={{
						position: 'absolute',
						left: 130,
						top: 548,
						width: 820,
						height: 940,
						opacity: emerge * (1 - tween(frame, [588, 612], [0, 1])),
						filter: emerge < 1 ? `blur(${(1 - emerge) * 14}px)` : 'none',
						transformOrigin: '50% 40%',
						transform: `translateZ(${-520 * exit}px) translateX(${-120 * exit}px) rotateY(${22 * exit}deg) rotateX(${(1 - emerge) * 22 + float * 0.6}deg) scale(${0.5 + 0.5 * emerge})`,
					}}
				>
					<Dashboard t={frame - DASH_T0} />
				</div>
			</AbsoluteFill>

			{/* blade server melintas dekat kamera */}
			{frame >= BLADE[0] && frame <= BLADE[1] ? (
				<AbsoluteFill style={{filter: filterFor('mb-blade', bladeBlur)}}>
					<AbsoluteFill style={{perspective: 1100, perspectiveOrigin: '540px 960px'}}>
						<div
							style={{
								position: 'absolute',
								left: 540 - 500,
								top: 960 - 100,
								transformStyle: 'preserve-3d',
								transform: `translateX(${bladeX(frame)}px) translateZ(380px) rotateZ(-8deg) rotateX(16deg) rotateY(-30deg)`,
							}}
						>
							<ServerBlade frame={frame} />
						</div>
					</AbsoluteFill>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};
