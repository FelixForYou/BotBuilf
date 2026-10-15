import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors, fonts, scenes} from '../config';
import {rand} from '../anim';

const glyphs = ['{ }', '</>', 'npm', 'py', '=>', '$_', '01', 'GB', '[ ]', '#!'];

/** Latar global yang berjalan terus sepanjang video (menjaga kesinambungan antar adegan). */
export const Background: React.FC = () => {
	const frame = useCurrentFrame();
	// Pergeseran "kamera" halus sepanjang video
	const drift = interpolate(frame, [0, 1800], [0, -260]);
	const glowY = interpolate(
		frame,
		[0, scenes.service.from, scenes.packages.from, scenes.flow.from, scenes.cta.from, 1800],
		[620, 900, 960, 760, 520, 500],
	);
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${colors.navyDeep} 0%, ${colors.navy} 55%, #081232 100%)`}}>
			{/* lantai grid berperspektif */}
			<div style={{position: 'absolute', inset: 0, perspective: 900, perspectiveOrigin: '50% 30%', overflow: 'hidden'}}>
				<div
					style={{
						position: 'absolute',
						left: -1200,
						right: -1200,
						top: 1180,
						height: 2400,
						transform: 'rotateX(74deg)',
						transformOrigin: '50% 0%',
						backgroundImage: `linear-gradient(rgba(61,139,255,0.28) 2px, transparent 2px), linear-gradient(90deg, rgba(61,139,255,0.28) 2px, transparent 2px)`,
						backgroundSize: '120px 120px',
						backgroundPosition: `0px ${(frame * 2.2) % 120}px`,
						maskImage: 'linear-gradient(180deg, transparent 0%, black 25%, black 60%, transparent 100%)',
						WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 25%, black 60%, transparent 100%)',
					}}
				/>
			</div>
			{/* pendar utama */}
			<div
				style={{
					position: 'absolute',
					left: 540 - 700,
					top: glowY - 700,
					width: 1400,
					height: 1400,
					background: 'radial-gradient(circle, rgba(31,107,255,0.30) 0%, rgba(31,107,255,0.08) 40%, transparent 70%)',
				}}
			/>
			{/* glyph kode melayang */}
			{glyphs.map((g, i) => {
				const x = 60 + rand(i + 1) * 960;
				const baseY = rand(i + 11) * 2000;
				const speed = 0.25 + rand(i + 21) * 0.35;
				const y = ((baseY - frame * speed + drift * 0.3) % 2100 + 2100) % 2100 - 100;
				return (
					<div
						key={g + i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							fontFamily: fonts.mono,
							fontSize: 26 + rand(i + 31) * 20,
							color: colors.electricBright,
							opacity: 0.1 + rand(i + 41) * 0.08,
						}}
					>
						{g}
					</div>
				);
			})}
			{/* vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(2,5,16,0.75) 100%)'}} />
		</AbsoluteFill>
	);
};
