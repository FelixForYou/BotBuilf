import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, copy, packageCards} from '../config';
import {easeInOut, tween, velocity} from '../anim';
import {BlurFilter, blurFromVelocity, filterFor} from '../components/MotionBlur';
import {PackageCardContent} from '../components/PackageCard';
import {Frame, Pill} from '../components/UI';

export const CARD_RECT = {left: 130, top: 500, width: 820, height: 900};
export const CARD_FIRST = 594;
export const CARD_STEP = 140;
export const MORPH: [number, number] = [996, 1030];

/** Kartu ke-i: masuk berputar dari kanan, keluar berputar ke kiri (carousel 3D). */
const cardState = (f: number, i: number, last: boolean) => {
	const s = CARD_FIRST + i * CARD_STEP;
	const p = tween(f, [s, s + 30], [0, 1]);
	const q = last ? 0 : tween(f, [s + CARD_STEP, s + CARD_STEP + 30], [0, 1], easeInOut);
	return {
		x: 460 * (1 - p) - 460 * q,
		rotY: 68 * (1 - p) - 68 * q,
		z: -320 * (1 - p) - 320 * q,
		opacity: Math.min(p, 1 - q),
	};
};

/** Denyut kecil bersama saat kartu terakhir berubah menjadi jendela order. */
export const morphScale = (f: number) => 1 - 0.035 * Math.sin(tween(f, MORPH, [0, 1], easeInOut) * Math.PI);

/** 10–17 detik: kartu paket bergantian. Kartu terakhir berubah menjadi jendela order. */
export const Scene3Packages: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame < 590 || frame > MORPH[1] + 4) return null;
	const total = packageCards.length;
	const eyebrow = Math.min(tween(frame, [600, 620], [0, 1]), tween(frame, [MORPH[0], MORPH[0] + 18], [1, 0]));
	const contentFade = tween(frame, [MORPH[0] + 2, MORPH[0] + 10], [1, 0]);
	const activeIdx = Math.max(0, Math.min(total - 1, Math.floor((frame - CARD_FIRST - 15) / CARD_STEP)));

	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					top: 268,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					opacity: eyebrow,
					transform: `translateY(${(1 - eyebrow) * -24}px)`,
				}}
			>
				<Pill icon="server" style={{fontSize: 34, padding: '18px 34px'}}>
					{copy.packages.eyebrow}
				</Pill>
			</div>

			<AbsoluteFill style={{perspective: 1700, perspectiveOrigin: '540px 950px'}}>
				{packageCards.map((card, i) => {
					const last = i === total - 1;
					const st = cardState(frame, i, last);
					if (st.opacity <= 0.001) return null;
					const v = velocity((f) => cardState(f, i, last).x, frame);
					const blur = blurFromVelocity(v, 0.16, 12);
					const id = `mb-card-${i}`;
					return (
						<div
							key={card.id}
							style={{
								position: 'absolute',
								...CARD_RECT,
								opacity: st.opacity,
								transform: `translateX(${st.x}px) translateZ(${st.z}px) rotateY(${st.rotY}deg) scale(${last ? morphScale(frame) : 1})`,
								filter: filterFor(id, blur),
							}}
						>
							<BlurFilter id={id} x={blur} />
							<Frame style={{inset: 0}}>
								<div style={{position: 'absolute', inset: 0, opacity: last ? contentFade : 1}}>
									<PackageCardContent card={card} index={i} total={total} t={frame - (CARD_FIRST + i * CARD_STEP)} />
								</div>
							</Frame>
						</div>
					);
				})}
			</AbsoluteFill>

			{/* indikator kartu */}
			<div style={{position: 'absolute', top: 1432, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, opacity: eyebrow}}>
				{packageCards.map((c, i) => (
					<div
						key={c.id}
						style={{
							width: i === activeIdx ? 54 : 16,
							height: 16,
							borderRadius: 8,
							background: i === activeIdx ? colors.cyan : 'rgba(79,139,255,0.35)',
						}}
					/>
				))}
			</div>
		</AbsoluteFill>
	);
};
