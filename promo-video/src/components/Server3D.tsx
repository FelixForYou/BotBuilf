import type {CSSProperties} from 'react';
import {colors, fonts} from '../config';
import {Box3D} from './Box3D';
import {LogoMark} from './Logo';

const metal: CSSProperties = {
	background: 'linear-gradient(180deg, #13245a 0%, #0b1638 100%)',
	border: '2px solid #2a4592',
	boxSizing: 'border-box',
};

const Led: React.FC<{on: boolean; color?: string}> = ({on, color = colors.success}) => (
	<div
		style={{
			width: 12,
			height: 12,
			borderRadius: 6,
			background: on ? color : '#1b2c63',
			boxShadow: on ? `0 0 10px ${color}` : 'none',
		}}
	/>
);

/** Satu unit rak: ventilasi + LED berkedip deterministik. */
const RackUnit: React.FC<{frame: number; seed: number; h: number}> = ({frame, seed, h}) => (
	<div
		style={{
			height: h,
			margin: '0 18px',
			borderRadius: 10,
			background: 'linear-gradient(180deg, #0e1c4a, #0a1538)',
			border: '2px solid #233b80',
			display: 'flex',
			alignItems: 'center',
			padding: '0 18px',
			gap: 12,
			boxSizing: 'border-box',
		}}
	>
		<Led on={Math.floor((frame + seed * 7) / 9) % 3 !== 0} />
		<Led on={Math.floor((frame + seed * 13) / 5) % 2 === 0} color={colors.cyan} />
		<div style={{flex: 1, display: 'flex', gap: 6, justifyContent: 'flex-end'}}>
			{new Array(10).fill(0).map((_, i) => (
				<div key={i} style={{width: 6, height: h * 0.5, borderRadius: 3, background: '#1c2f6c'}} />
			))}
		</div>
	</div>
);

/** Rak server 3D dengan layar bercahaya di tengah (tujuan dolly kamera). */
export const ServerRack: React.FC<{frame: number; screenGlow: number}> = ({frame, screenGlow}) => {
	const w = 380;
	const h = 500;
	const d = 300;
	return (
		<Box3D
			w={w}
			h={h}
			d={d}
			base={metal}
			top={{style: {background: 'linear-gradient(180deg,#1b3378,#10225a)'}}}
			left={{style: {background: 'linear-gradient(90deg,#0a1435,#13265f)'}}}
			right={{style: {background: 'linear-gradient(90deg,#13265f,#0a1435)'}}}
			front={{
				style: {borderRadius: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14},
				children: (
					<>
						<RackUnit frame={frame} seed={1} h={62} />
						<RackUnit frame={frame} seed={2} h={62} />
						<div
							style={{
								height: 120,
								margin: '0 18px',
								borderRadius: 12,
								background: `linear-gradient(135deg, #0b2a7a, ${colors.electric})`,
								border: `2px solid ${colors.electricBright}`,
								boxShadow: `0 0 ${20 + 50 * screenGlow}px rgba(61,139,255,${0.5 + 0.5 * screenGlow})`,
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								padding: '0 20px',
								boxSizing: 'border-box',
							}}
						>
							<LogoMark size={64} glow={0.2} />
							<div style={{fontFamily: fonts.mono, fontSize: 22, color: colors.white, lineHeight: 1.4}}>
								panel: siap
								<br />
								<span style={{color: colors.cyan}}>pterodactyl</span>
							</div>
						</div>
						<RackUnit frame={frame} seed={3} h={62} />
						<RackUnit frame={frame} seed={4} h={62} />
					</>
				),
			}}
		/>
	);
};

/** Blade server tipis yang melintas dekat kamera sebagai transisi. */
export const ServerBlade: React.FC<{frame: number}> = ({frame}) => (
	<Box3D
		w={1000}
		h={200}
		d={640}
		base={metal}
		top={{style: {background: `linear-gradient(90deg, ${colors.electric}, #2a5fd8 50%, ${colors.cyan})`}}}
		bottom={{style: {background: '#081232'}}}
		left={{style: {background: '#0c1a46'}}}
		front={{
			style: {display: 'flex', alignItems: 'center', gap: 22, padding: '0 40px', borderRadius: 8, background: 'linear-gradient(180deg,#2350c4,#14307e)', border: `3px solid ${colors.cyan}`},
			children: (
				<>
					<Led on color={colors.success} />
					<Led on={Math.floor(frame / 4) % 2 === 0} color={colors.cyan} />
					<div style={{flex: 1, display: 'flex', gap: 10, justifyContent: 'center'}}>
						{new Array(22).fill(0).map((_, i) => (
							<div key={i} style={{width: 10, height: 110, borderRadius: 5, background: '#1c2f6c'}} />
						))}
					</div>
					<div style={{width: 160, height: 90, borderRadius: 10, background: colors.electric, boxShadow: `0 0 30px ${colors.electric}`}} />
				</>
			),
		}}
	/>
);
