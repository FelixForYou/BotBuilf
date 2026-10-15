import {colors, fonts, packageCards, runtimes} from '../config';
import {tween} from '../anim';
import {Icon, type IconName} from './Icon';
import {Placeholder} from './UI';

export type PackageCardData = (typeof packageCards)[number];

/** Isi kartu paket (bingkai disediakan oleh <Frame/>). `t` = frame lokal sejak kartu tampil. */
export const PackageCardContent: React.FC<{card: PackageCardData; index: number; total: number; t: number}> = ({
	card,
	index,
	total,
	t,
}) => {
	const bigGradient = {
		background: `linear-gradient(90deg, ${colors.white} 0%, ${colors.cyan} 100%)`,
		WebkitBackgroundClip: 'text' as const,
		backgroundClip: 'text' as const,
		color: 'transparent',
	};
	return (
		<div style={{position: 'absolute', inset: 0, padding: 56, display: 'flex', flexDirection: 'column'}}>
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
				<div
					style={{
						width: 104,
						height: 104,
						borderRadius: 28,
						background: `linear-gradient(140deg, ${colors.electricBright}, ${colors.electric})`,
						boxShadow: '0 0 40px rgba(31,107,255,0.55)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Icon name={card.icon as IconName} size={58} color={colors.white} />
				</div>
				<div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 28, color: colors.inkMute}}>
					{String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
				</div>
			</div>

			<div style={{fontFamily: fonts.display, fontWeight: 800, fontSize: 50, lineHeight: 1.15, color: colors.white, marginTop: 44}}>
				{card.title}
			</div>

			{card.id === 'runtime' ? (
				<div style={{display: 'flex', flexDirection: 'column', gap: 26, marginTop: 48}}>
					{runtimes.map((r, i) => {
						const s = 10 + i * 10;
						const n = Math.floor(tween(t, [s + 10, s + 34], [0, r.command.length], (x) => x));
						return (
							<div
								key={r.name}
								style={{
									borderRadius: 28,
									border: '2px solid rgba(79,139,255,0.35)',
									background: 'rgba(5,10,31,0.5)',
									padding: '24px 32px',
									opacity: tween(t, [s, s + 14], [0, 1]),
									transform: `translateX(${tween(t, [s, s + 20], [60, 0])}px)`,
								}}
							>
								<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
									<Icon name={i === 0 ? 'node' : 'code'} size={48} color={colors.cyan} />
									<div style={{fontFamily: fonts.display, fontWeight: 800, fontSize: 46, color: colors.white}}>{r.name}</div>
								</div>
								<div
									style={{
										marginTop: 16,
										fontFamily: fonts.mono,
										fontSize: 32,
										color: colors.ink,
										background: '#040818',
										borderRadius: 16,
										padding: '12px 22px',
										whiteSpace: 'nowrap',
									}}
								>
									<span style={{color: colors.success}}>$ </span>
									{r.command.slice(0, n)}
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							marginTop: 34,
							fontFamily: fonts.display,
							fontWeight: 800,
							fontSize: card.id === 'unlimited' ? 124 : 140,
							lineHeight: 1.05,
							whiteSpace: 'nowrap',
						}}
					>
						<span style={bigGradient}>{card.big}</span>
					</div>

					{card.chips.length > 0 ? (
						<div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 40}}>
							{card.chips.map((c, i) => {
								const lit = t >= 14 + i * 5;
								return (
									<div
										key={c}
										style={{
											height: 70,
											borderRadius: 18,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontFamily: fonts.display,
											fontWeight: 800,
											fontSize: 26,
											whiteSpace: 'nowrap',
											color: lit ? colors.white : colors.inkMute,
											background: lit ? 'rgba(31,107,255,0.45)' : 'rgba(5,10,31,0.45)',
											border: `2px solid ${lit ? colors.electricBright : 'rgba(79,139,255,0.2)'}`,
										}}
									>
										{c}
									</div>
								);
							})}
						</div>
					) : null}

					{card.id === 'unlimited' ? (
						<svg width={708} height={150} viewBox="0 0 708 150" style={{marginTop: 20}}>
							<path
								d="M354 75 C 300 10, 200 10, 200 75 C 200 140, 300 140, 354 75 C 408 10, 508 10, 508 75 C 508 140, 408 140, 354 75 Z"
								fill="none"
								stroke={colors.cyan}
								strokeWidth={10}
								strokeLinecap="round"
								pathLength={1}
								strokeDasharray="1"
								strokeDashoffset={tween(t, [6, 60], [1, 0])}
								style={{filter: `drop-shadow(0 0 12px ${colors.electricBright})`}}
							/>
						</svg>
					) : null}

					<div style={{flex: 1}} />
					{card.note ? (
						<div style={{fontFamily: fonts.display, fontWeight: 500, fontSize: 28, lineHeight: 1.4, color: colors.inkSoft, marginBottom: 22}}>
							{card.note.split(':')[0]}:
							<div style={{marginTop: 8}}>
								<Placeholder size={24}>{card.note.split(':').slice(1).join(':').trim()}</Placeholder>
							</div>
						</div>
					) : null}
					{card.price ? (
						<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
							<div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 30, color: colors.inkSoft}}>{card.priceLabel}</div>
							<Placeholder>{card.price}</Placeholder>
						</div>
					) : null}
				</>
			)}
		</div>
	);
};
