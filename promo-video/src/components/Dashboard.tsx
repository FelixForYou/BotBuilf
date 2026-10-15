import {brand, colors, dashboardDemo, fonts} from '../config';
import {tween} from '../anim';
import {Icon} from './Icon';
import {LogoMark} from './Logo';
import {Bar, Frame} from './UI';

export const DASHBOARD_W = 820;
export const DASHBOARD_H = 940;

const fmtMb = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${Math.round(mb)} MB`);

/** Waktu (frame lokal) munculnya tiap baris konsol — dipakai juga untuk SFX ketikan. */
export const DASH_CONSOLE_AT = [118, 136, 154, 172];

/** Mockup dashboard panel. `t` = frame lokal sejak dashboard muncul. */
export const Dashboard: React.FC<{t: number}> = ({t}) => {
	const main = dashboardDemo.servers[0];
	const grow = tween(t, [50, 110], [0, 1]);
	const cpu = main.cpu * grow;
	const ram = main.ramUsedMb * grow;
	const ring = 2 * Math.PI * 52;
	const appear = (s: number) => ({
		opacity: tween(t, [s, s + 16], [0, 1]),
		transform: `translateY(${tween(t, [s, s + 22], [24, 0])}px)`,
	});
	const card = {
		borderRadius: 24,
		background: 'rgba(5,10,31,0.45)',
		border: '2px solid rgba(79,139,255,0.25)',
		boxSizing: 'border-box' as const,
	};
	return (
		<Frame style={{left: 0, top: 0, width: DASHBOARD_W, height: DASHBOARD_H, padding: 28}}>
			{/* header */}
			<div style={{display: 'flex', alignItems: 'center', gap: 16, height: 72, ...appear(4)}}>
				<LogoMark size={56} glow={0.3} />
				<div style={{fontFamily: fonts.display, fontWeight: 800, fontSize: 30, color: colors.white, letterSpacing: '0.04em'}}>
					{brand.name}
				</div>
				<div style={{flex: 1}} />
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						padding: '10px 20px',
						borderRadius: 999,
						background: 'rgba(31,107,255,0.2)',
						color: colors.ink,
						fontFamily: fonts.display,
						fontWeight: 700,
						fontSize: 24,
					}}
				>
					<Icon name="dashboard" size={26} color={colors.cyan} />
					{dashboardDemo.title}
				</div>
			</div>

			{/* statistik */}
			<div style={{display: 'flex', gap: 20, marginTop: 20, height: 170}}>
				<div style={{...card, flex: 1, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px', ...appear(20)}}>
					<svg width={124} height={124} viewBox="0 0 124 124">
						<circle cx={62} cy={62} r={52} stroke="rgba(79,139,255,0.2)" strokeWidth={12} fill="none" />
						<circle
							cx={62}
							cy={62}
							r={52}
							stroke={colors.cyan}
							strokeWidth={12}
							fill="none"
							strokeLinecap="round"
							strokeDasharray={ring}
							strokeDashoffset={ring * (1 - cpu / 100)}
							transform="rotate(-90 62 62)"
						/>
						<text x={62} y={72} textAnchor="middle" fontFamily={fonts.display} fontWeight={800} fontSize={30} fill={colors.white}>
							{Math.round(cpu)}%
						</text>
					</svg>
					<div>
						<div style={{display: 'flex', alignItems: 'center', gap: 10, color: colors.inkSoft, fontFamily: fonts.display, fontWeight: 700, fontSize: 26}}>
							<Icon name="cpu" size={28} color={colors.cyan} /> CPU
						</div>
						<div style={{color: colors.inkMute, fontFamily: fonts.mono, fontSize: 20, marginTop: 8}}>{main.name}</div>
					</div>
				</div>
				<div style={{...card, flex: 1, padding: '26px 26px', ...appear(30)}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 10, color: colors.inkSoft, fontFamily: fonts.display, fontWeight: 700, fontSize: 26}}>
						<Icon name="memory" size={28} color={colors.cyan} /> RAM
					</div>
					<div style={{fontFamily: fonts.display, fontWeight: 800, fontSize: 38, color: colors.white, marginTop: 10, whiteSpace: 'nowrap'}}>
						{fmtMb(ram)}
						<span style={{fontSize: 24, color: colors.inkMute, fontWeight: 700}}> / {fmtMb(main.ramLimitMb)}</span>
					</div>
					<div style={{marginTop: 14}}>
						<Bar value={ram / main.ramLimitMb} />
					</div>
				</div>
			</div>

			{/* daftar server */}
			<div style={{marginTop: 22, color: colors.inkSoft, fontFamily: fonts.display, fontWeight: 700, fontSize: 24, ...appear(40)}}>
				Daftar server
			</div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12}}>
				{dashboardDemo.servers.map((s, i) => (
					<div
						key={s.name}
						style={{
							...card,
							height: 86,
							display: 'flex',
							alignItems: 'center',
							gap: 18,
							padding: '0 24px',
							background: i === 0 ? 'rgba(31,107,255,0.18)' : card.background,
							borderColor: i === 0 ? 'rgba(79,209,255,0.6)' : 'rgba(79,139,255,0.25)',
							...appear(50 + i * 12),
						}}
					>
						<div
							style={{
								width: 16,
								height: 16,
								borderRadius: 8,
								background: s.online ? colors.success : colors.inkMute,
								boxShadow: s.online ? `0 0 12px ${colors.success}` : 'none',
							}}
						/>
						<div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 26, color: colors.white, width: 230, whiteSpace: 'nowrap'}}>
							{s.name}
						</div>
						<div
							style={{
								fontFamily: fonts.display,
								fontWeight: 700,
								fontSize: 20,
								color: colors.cyan,
								padding: '6px 12px',
								borderRadius: 10,
								background: 'rgba(79,209,255,0.12)',
								whiteSpace: 'nowrap',
							}}
						>
							{s.runtime}
						</div>
						<div style={{flex: 1}} />
						<div style={{width: 170}}>
							<div style={{fontFamily: fonts.mono, fontSize: 18, color: colors.inkSoft, textAlign: 'right', marginBottom: 8, whiteSpace: 'nowrap'}}>
								{s.online ? `${fmtMb(s.ramUsedMb * grow)} / ${fmtMb(s.ramLimitMb)}` : 'offline'}
							</div>
							<Bar value={(s.ramUsedMb * grow) / s.ramLimitMb} height={10} />
						</div>
					</div>
				))}
			</div>

			{/* konsol */}
			<div
				style={{
					...card,
					marginTop: 20,
					height: 262,
					background: '#040818',
					overflow: 'hidden',
					...appear(96),
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						padding: '14px 22px',
						borderBottom: '2px solid rgba(79,139,255,0.2)',
						color: colors.inkSoft,
						fontFamily: fonts.display,
						fontWeight: 700,
						fontSize: 22,
					}}
				>
					<Icon name="terminal" size={26} color={colors.cyan} /> Konsol — {main.name}
				</div>
				<div style={{padding: '14px 22px', fontFamily: fonts.mono, fontSize: 23, lineHeight: '40px'}}>
					{dashboardDemo.console.map((line, i) => {
						const s = DASH_CONSOLE_AT[i] ?? 999;
						if (t < s) return null;
						const n = Math.floor(tween(t, [s, s + 12], [0, line.length], (x) => x));
						return (
							<div
								key={line}
								style={{whiteSpace: 'nowrap', color: i === 0 ? colors.warning : line.startsWith('[bot]') ? colors.success : colors.ink}}
							>
								{line.slice(0, n)}
							</div>
						);
					})}
				</div>
			</div>
		</Frame>
	);
};
