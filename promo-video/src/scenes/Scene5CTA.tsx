import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand, colors, copy, fonts} from '../config';
import {pop, tween} from '../anim';
import {ContactCard} from '../components/ContactCard';
import {LogoCube} from '../components/LogoCube';
import {RevealText, words} from '../components/UI';

export const CTA_START = 1410;
export const CONTACT_AT = 1488;

/** 24–30 detik: kubus logo 3D (momen 3D #3), nama brand, ajakan, dan kontak (ditahan > 3 detik). */
export const Scene5CTA: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame < CTA_START) return null;

	// Kubus logo terbang dari kedalaman sambil berputar, lalu "mengambang"
	const arrive = tween(frame, [CTA_START, 1492], [0, 1]);
	const idle = Math.max(0, frame - 1492);
	const cubeZ = -1800 * (1 - arrive);
	const rotY = -300 * (1 - arrive) + 16 * Math.sin(idle / 42);
	const rotX = 70 * (1 - arrive) - 12 + 5 * Math.sin(idle / 55);
	// denyut kecil mengikuti ketukan (30 frame = 1 ketukan @120 BPM)
	const beat = frame >= 1440 ? Math.exp(-((frame - 1440) % 30) / 7) : 0;

	const name = brand.name.split('');

	return (
		<AbsoluteFill>
			{/* cincin cahaya di belakang kubus */}
			<div
				style={{
					position: 'absolute',
					left: 540 - 230,
					top: 440 - 230,
					width: 460,
					height: 460,
					borderRadius: '50%',
					border: `3px solid rgba(79,209,255,${0.25 + 0.35 * beat})`,
					boxShadow: `0 0 ${60 + 50 * beat}px rgba(31,107,255,0.5), inset 0 0 60px rgba(31,107,255,0.35)`,
					opacity: arrive,
					transform: `scale(${0.6 + 0.4 * arrive + 0.03 * beat})`,
				}}
			/>
			<AbsoluteFill style={{perspective: 1000, perspectiveOrigin: '540px 440px'}}>
				<div
					style={{
						position: 'absolute',
						left: 540 - 100,
						top: 440 - 100,
						transformStyle: 'preserve-3d',
						opacity: tween(frame, [CTA_START, CTA_START + 14], [0, 1]),
						transform: `translateZ(${cubeZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
					}}
				>
					<LogoCube size={200} />
				</div>
			</AbsoluteFill>

			{/* nama brand */}
			<div
				style={{
					position: 'absolute',
					top: 612,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: fonts.display,
					fontWeight: 800,
					fontSize: 96,
					letterSpacing: '0.03em',
					lineHeight: 1.1,
					whiteSpace: 'nowrap',
					color: colors.white,
					textShadow: `0 0 40px rgba(31,107,255,${0.5 + 0.4 * beat})`,
				}}
			>
				{name.map((ch, i) => {
					const p = pop(frame, fps, 1440 + i * 2, 13, 0.6);
					return (
						<span key={i} style={{display: 'inline-block', opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 60}px) scale(${0.7 + 0.3 * p})`}}>
							{ch}
						</span>
					);
				})}
			</div>
			<div
				style={{
					position: 'absolute',
					top: 728,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: fonts.display,
					fontWeight: 700,
					fontSize: 28,
					letterSpacing: '0.18em',
					color: colors.cyan,
					textTransform: 'uppercase',
					opacity: tween(frame, [1462, 1480], [0, 1]),
				}}
			>
				{brand.tagline}
			</div>

			{/* ajakan */}
			<div style={{position: 'absolute', top: 800, left: 130, width: 820}}>
				<RevealText lines={words(copy.cta.headline, copy.cta.accent)} frame={frame} start={1462} size={62} stagger={4} />
				<div
					style={{
						marginTop: 14,
						textAlign: 'center',
						fontFamily: fonts.display,
						fontWeight: 500,
						fontSize: 36,
						color: colors.inkSoft,
						opacity: tween(frame, [1480, 1498], [0, 1]),
						transform: `translateY(${tween(frame, [1480, 1500], [20, 0])}px)`,
					}}
				>
					{copy.cta.subline}
				</div>
			</div>

			{/* kontak — muncul ~24,8 s dan ditahan sampai akhir (> 3 detik) */}
			<div
				style={{
					position: 'absolute',
					top: 1040,
					left: 130,
					opacity: tween(frame, [CONTACT_AT, CONTACT_AT + 14], [0, 1]),
					transform: `translateY(${tween(frame, [CONTACT_AT, CONTACT_AT + 22], [50, 0])}px)`,
				}}
			>
				<ContactCard t={frame - CONTACT_AT} />
			</div>
		</AbsoluteFill>
	);
};
