import {colors, fonts} from '../config';
import {tween} from '../anim';
import {Icon, type IconName} from './Icon';

const icons: IconName[] = ['package', 'confirm', 'key'];

/** Indikator langkah: Pilih paket -> Konfirmasi pesanan -> Terima akses panel. */
export const Stepper: React.FC<{steps: string[]; frame: number; activeAt: number[]}> = ({steps, frame, activeAt}) => {
	const width = 820;
	const col = width / steps.length;
	return (
		<div style={{position: 'relative', width, height: 200}}>
			{steps.slice(0, -1).map((_, i) => {
				const fill = tween(frame, [activeAt[i + 1] - 14, activeAt[i + 1]], [0, 1]);
				return (
					<div
						key={i}
						style={{position: 'absolute', left: col * i + col / 2 + 52, top: 42, width: col - 104, height: 6, borderRadius: 3, background: 'rgba(79,139,255,0.22)'}}
					>
						<div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 3, background: colors.cyan}} />
						<div style={{position: 'absolute', right: -14, top: -13, color: fill > 0.98 ? colors.cyan : 'rgba(79,139,255,0.4)'}}>
							<Icon name="arrow" size={32} />
						</div>
					</div>
				);
			})}
			{steps.map((s, i) => {
				const on = tween(frame, [activeAt[i], activeAt[i] + 12], [0, 1]);
				const done = i < steps.length - 1 && frame >= activeAt[i + 1];
				return (
					<div key={s} style={{position: 'absolute', left: col * i, top: 0, width: col, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
						<div
							style={{
								width: 90,
								height: 90,
								borderRadius: 45,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								background: on > 0.5 ? `linear-gradient(140deg, ${colors.electricBright}, ${colors.electric})` : 'rgba(10,20,51,0.9)',
								border: `3px solid ${on > 0.5 ? colors.cyan : 'rgba(79,139,255,0.35)'}`,
								boxShadow: on > 0.5 ? `0 0 ${30 * on}px rgba(61,139,255,0.7)` : 'none',
								transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, on) * Math.PI)})`,
							}}
						>
							<Icon name={done ? 'check' : icons[i]} size={42} color={on > 0.5 ? colors.white : colors.inkMute} />
						</div>
						<div
							style={{
								marginTop: 16,
								width: col - 16,
								textAlign: 'center',
								fontFamily: fonts.display,
								fontWeight: 800,
								fontSize: 27,
								lineHeight: 1.2,
								color: on > 0.5 ? colors.white : colors.inkMute,
							}}
						>
							{s}
						</div>
					</div>
				);
			})}
		</div>
	);
};
