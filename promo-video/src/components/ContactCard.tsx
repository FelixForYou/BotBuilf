import {colors, contact, fonts} from '../config';
import {tween} from '../anim';
import {Icon, type IconName} from './Icon';
import {Frame} from './UI';

const rows: Array<{icon: IconName; label: string; value: string}> = [
	{icon: 'telegram', label: 'Telegram', value: contact.telegram},
	{icon: 'whatsapp', label: 'WhatsApp', value: contact.whatsapp},
];

/** Kartu kontak. Isi diambil dari config.contact. */
export const ContactCard: React.FC<{t: number}> = ({t}) => (
	<Frame style={{position: 'relative', width: 820, padding: '34px 40px'}}>
		<div style={{fontFamily: fonts.display, fontWeight: 800, fontSize: 26, letterSpacing: '0.14em', color: colors.cyan, textTransform: 'uppercase'}}>
			{contact.label}
		</div>
		{rows.map((r, i) => {
			const s = 8 + i * 8;
			return (
				<div
					key={r.label}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 26,
						marginTop: i === 0 ? 24 : 18,
						padding: '20px 24px',
						borderRadius: 26,
						background: 'rgba(5,10,31,0.5)',
						border: '2px solid rgba(79,139,255,0.3)',
						opacity: tween(t, [s, s + 14], [0, 1]),
						transform: `translateY(${tween(t, [s, s + 20], [30, 0])}px)`,
					}}
				>
					<div
						style={{
							width: 84,
							height: 84,
							borderRadius: 24,
							flexShrink: 0,
							background: `linear-gradient(140deg, ${colors.electricBright}, ${colors.electric})`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Icon name={r.icon} size={44} color={colors.white} />
					</div>
					<div style={{minWidth: 0}}>
						<div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 24, color: colors.inkSoft}}>{r.label}</div>
						<div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 36, color: colors.white, whiteSpace: 'nowrap', marginTop: 4}}>{r.value}</div>
					</div>
				</div>
			);
		})}
	</Frame>
);
