import type {CSSProperties, ReactNode} from 'react';
import {colors, fonts} from '../config';
import {tween} from '../anim';
import {Icon, type IconName} from './Icon';

/** Bingkai jendela/kartu bersama — dipakai kartu paket DAN jendela order agar bisa "berubah wujud". */
export const Frame: React.FC<{style?: CSSProperties; children?: ReactNode}> = ({style, children}) => (
	<div
		style={{
			position: 'absolute',
			borderRadius: 40,
			background: `linear-gradient(160deg, rgba(23,44,110,0.96) 0%, rgba(12,24,64,0.97) 60%, rgba(9,18,50,0.98) 100%)`,
			border: `2px solid rgba(79,139,255,0.45)`,
			boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 60px rgba(31,107,255,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
			overflow: 'hidden',
			boxSizing: 'border-box',
			...style,
		}}
	>
		{children}
	</div>
);

export const WindowBar: React.FC<{title: string; height?: number}> = ({title, height = 72}) => (
	<div
		style={{
			height,
			display: 'flex',
			alignItems: 'center',
			gap: 12,
			padding: '0 30px',
			borderBottom: '2px solid rgba(79,139,255,0.25)',
			background: 'rgba(5,10,31,0.45)',
		}}
	>
		{['#ff5f6d', '#ffb547', '#2fd58a'].map((c) => (
			<div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.85}} />
		))}
		<div
			style={{
				marginLeft: 14,
				fontFamily: fonts.mono,
				fontSize: 24,
				color: colors.inkSoft,
				whiteSpace: 'nowrap',
			}}
		>
			{title}
		</div>
	</div>
);

/** Kalimat besar yang muncul per kata dari balik mask. */
export const RevealText: React.FC<{
	lines: Array<Array<{text: string; accent?: boolean}>>;
	frame: number;
	start: number;
	stagger?: number;
	size: number;
	lineHeight?: number;
	color?: string;
	weight?: number;
	align?: CSSProperties['textAlign'];
}> = ({lines, frame, start, stagger = 4, size, lineHeight = 1.14, color = colors.white, weight = 800, align = 'center'}) => {
	let idx = 0;
	return (
		<div style={{fontFamily: fonts.display, fontWeight: weight, fontSize: size, lineHeight, color, textAlign: align}}>
			{lines.map((line, li) => (
				<div key={li} style={{display: 'block', whiteSpace: 'nowrap'}}>
					{line.map((w, wi) => {
						const s = start + idx++ * stagger;
						const p = tween(frame, [s, s + 18], [0, 1]);
						return (
							<span
								key={wi}
								style={{
									display: 'inline-block',
									overflow: 'hidden',
									verticalAlign: 'top',
									paddingBottom: size * 0.08,
									marginRight: wi < line.length - 1 ? size * 0.26 : 0,
								}}
							>
								<span
									style={{
										display: 'inline-block',
										transform: `translateY(${(1 - p) * 110}%)`,
										opacity: p,
										...(w.accent
											? {
													background: `linear-gradient(90deg, ${colors.cyan}, ${colors.electricBright})`,
													WebkitBackgroundClip: 'text',
													backgroundClip: 'text',
													color: 'transparent',
												}
											: {}),
									}}
								>
									{w.text}
								</span>
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};

/** Ubah string jadi baris kata; kata yang ada di `accent` diberi gradasi. */
export const words = (lines: string[], accent: string[] = []) =>
	lines.map((l) => l.split(' ').map((t) => ({text: t, accent: accent.some((a) => t.startsWith(a))})));

export const Pill: React.FC<{icon?: IconName; children: ReactNode; style?: CSSProperties}> = ({icon, children, style}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 14,
			padding: '14px 28px',
			borderRadius: 999,
			background: 'rgba(31,107,255,0.16)',
			border: '2px solid rgba(79,139,255,0.5)',
			color: colors.ink,
			fontFamily: fonts.display,
			fontWeight: 700,
			fontSize: 30,
			whiteSpace: 'nowrap',
			...style,
		}}
	>
		{icon ? <Icon name={icon} size={32} color={colors.cyan} /> : null}
		{children}
	</div>
);

/** Kotak placeholder bergaris putus-putus untuk data yang belum tersedia (harga, ketentuan). */
export const Placeholder: React.FC<{children: ReactNode; size?: number}> = ({children, size = 28}) => (
	<span
		style={{
			display: 'inline-block',
			padding: '8px 16px',
			borderRadius: 12,
			border: `2px dashed ${colors.warning}`,
			color: colors.warning,
			fontFamily: fonts.mono,
			fontWeight: 700,
			fontSize: size,
			lineHeight: 1.3,
			background: 'rgba(255,181,71,0.08)',
		}}
	>
		{children}
	</span>
);

export const Bar: React.FC<{value: number; height?: number; color?: string}> = ({value, height = 14, color = colors.electricBright}) => (
	<div style={{height, borderRadius: height, background: 'rgba(79,139,255,0.18)', overflow: 'hidden'}}>
		<div
			style={{
				width: `${Math.max(0, Math.min(1, value)) * 100}%`,
				height: '100%',
				borderRadius: height,
				background: `linear-gradient(90deg, ${color}, ${colors.cyan})`,
			}}
		/>
	</div>
);
