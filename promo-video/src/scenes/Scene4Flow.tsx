import type {ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, copy, fonts, orderDemo, runtimes} from '../config';
import {easeIn, easeInOut, tween, velocity} from '../anim';
import {Cursor, cursorAt, type CursorKey} from '../components/Cursor';
import {Icon} from '../components/Icon';
import {BlurFilter, blurFromVelocity, filterFor} from '../components/MotionBlur';
import {Stepper} from '../components/Stepper';
import {Frame, Placeholder, WindowBar} from '../components/UI';
import {CARD_RECT, MORPH, morphScale} from './Scene3Packages';

// Jadwal interaksi (frame global) — dipakai juga oleh audio.
export const STEP_AT = [1024, 1150, 1282];
export const CLICKS = [1092, 1138, 1244, 1334];
export const CONSOLE_AT = [1346, 1364, 1382];
export const EXIT: [number, number] = [1404, 1458];

const R = CARD_RECT;
// Koordinat absolut tombol yang diklik (lihat tata letak di bawah)
const OPT = {x: R.left + 48 + 176, y: R.top + 352};
const MAIN_BTN = {x: R.left + 410, y: R.top + 762};
const CONSOLE_BTN = {x: R.left + 621, y: R.top + 262};

const keys: CursorKey[] = [
	{f: 1036, x: 920, y: 1560},
	{f: 1084, x: OPT.x, y: OPT.y},
	{f: 1096, x: OPT.x, y: OPT.y},
	{f: 1130, x: MAIN_BTN.x, y: MAIN_BTN.y},
	{f: 1166, x: MAIN_BTN.x + 10, y: MAIN_BTN.y + 4},
	{f: 1200, x: 640, y: R.top + 540},
	{f: 1236, x: MAIN_BTN.x, y: MAIN_BTN.y},
	{f: 1262, x: MAIN_BTN.x, y: MAIN_BTN.y},
	{f: 1300, x: 640, y: R.top + 560},
	{f: 1328, x: CONSOLE_BTN.x, y: CONSOLE_BTN.y},
	{f: 1340, x: CONSOLE_BTN.x, y: CONSOLE_BTN.y},
	{f: 1384, x: 860, y: R.top + 760},
];

const btnBase = {
	borderRadius: 24,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 14,
	fontFamily: fonts.display,
	fontWeight: 800,
	whiteSpace: 'nowrap' as const,
	boxSizing: 'border-box' as const,
};

const pressScale = (frame: number, at: number) => 1 - 0.06 * Math.max(0, 1 - Math.abs(frame - at) / 6);

/** Panel konten satu langkah, geser masuk/keluar secara horizontal. */
const StepPane: React.FC<{frame: number; inAt: number; outAt?: number; children: ReactNode}> = ({frame, inAt, outAt, children}) => {
	const p = tween(frame, [inAt, inAt + 22], [0, 1]);
	const q = outAt === undefined ? 0 : tween(frame, [outAt, outAt + 18], [0, 1], easeIn);
	if (p <= 0 || q >= 1) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: 48,
				right: 48,
				top: 112,
				bottom: 48,
				opacity: Math.min(p, 1 - q),
				transform: `translateX(${(1 - p) * 90 - q * 90}px)`,
			}}
		>
			{children}
		</div>
	);
};

const Title: React.FC<{children: ReactNode}> = ({children}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: fonts.display, fontWeight: 800, fontSize: 40, color: colors.white, height: 56}}>
		{children}
	</div>
);

/** 17–24 detik: simulasi order dengan kursor. Kartu paket telah berubah menjadi jendela ini. */
export const Scene4Flow: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame < MORPH[0] || frame > EXIT[1] + 2) return null;

	const winIn = tween(frame, [MORPH[0], MORPH[0] + 8], [0, 1]);
	const stepperIn = Math.min(tween(frame, [MORPH[0] + 8, MORPH[0] + 30], [0, 1]), tween(frame, [EXIT[0], EXIT[0] + 14], [1, 0]));

	// keluar: jendela berputar menjauh (pintu 3D)
	const ex = tween(frame, EXIT, [0, 1], easeInOut);
	const exitX = (f: number) => -380 * tween(f, EXIT, [0, 1], easeInOut);
	const exitBlur = blurFromVelocity(velocity(exitX, frame), 0.18, 10);
	const exitOpacity = tween(frame, [EXIT[0] + 6, EXIT[0] + 30], [1, 0]);

	const cur = cursorAt(frame, keys);
	const cursorOpacity = Math.min(tween(frame, [1036, 1048], [0, 1]), tween(frame, [1392, 1406], [1, 0]));

	const sel = frame >= CLICKS[0];
	const sent = frame >= CLICKS[2] + 4;
	const consoleOpen = tween(frame, [CLICKS[3] + 2, CLICKS[3] + 18], [0, 1]);

	return (
		<AbsoluteFill>
			<BlurFilter id="mb-flow" x={exitBlur} />
			<AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '540px 900px', filter: filterFor('mb-flow', exitBlur)}}>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						opacity: exitOpacity,
						transformOrigin: '50% 50%',
						transform: `translateX(${exitX(frame)}px) translateZ(${-700 * ex}px) rotateY(${-62 * ex}deg)`,
					}}
				>
					{/* stepper */}
					<div
						style={{
							position: 'absolute',
							left: 130,
							top: 238,
							opacity: stepperIn,
							transform: `translateY(${(1 - stepperIn) * -30}px)`,
						}}
					>
						<Stepper steps={copy.flow.steps} frame={frame} activeAt={STEP_AT} />
					</div>

					{/* jendela order — rect identik dengan kartu paket */}
					<div style={{position: 'absolute', ...R, opacity: winIn, transform: `scale(${morphScale(frame)})`}}>
						<Frame style={{inset: 0}}>
							<div style={{opacity: tween(frame, [MORPH[0] + 4, MORPH[0] + 16], [0, 1])}}>
								<WindowBar title={orderDemo.windowTitle} />
							</div>

							{/* Langkah 1: pilih paket */}
							<StepPane frame={frame} inAt={MORPH[0] + 4} outAt={1146}>
								<Title>
									<Icon name="memory" size={44} color={colors.cyan} /> Pilih RAM
								</Title>
								<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 22}}>
									{orderDemo.options.map((o, i) => {
										const isSel = sel && i === orderDemo.selectedIndex;
										const hover = !sel && i === orderDemo.selectedIndex && frame > 1076;
										return (
											<div
												key={o}
												style={{
													...btnBase,
													height: 96,
													fontSize: 34,
													gridColumn: i === orderDemo.options.length - 1 && orderDemo.options.length % 2 === 1 ? 'span 2' : undefined,
													color: isSel ? colors.white : colors.ink,
													background: isSel ? `linear-gradient(140deg, ${colors.electricBright}, ${colors.electric})` : 'rgba(5,10,31,0.5)',
													border: `3px solid ${isSel ? colors.cyan : hover ? colors.electricBright : 'rgba(79,139,255,0.3)'}`,
													boxShadow: isSel ? '0 0 36px rgba(61,139,255,0.6)' : 'none',
													transform: `scale(${i === orderDemo.selectedIndex ? pressScale(frame, CLICKS[0]) : 1})`,
												}}
											>
												{o === 'Unlimited' ? <Icon name="infinity" size={36} /> : null}
												{o}
												{isSel ? <Icon name="check" size={34} /> : null}
											</div>
										);
									})}
								</div>
								<div
									style={{
										...btnBase,
										position: 'absolute',
										left: 0,
										right: 0,
										top: 600,
										height: 96,
										fontSize: 36,
										color: colors.white,
										background: sel ? colors.electric : 'rgba(31,107,255,0.3)',
										transform: `scale(${pressScale(frame, CLICKS[1])})`,
									}}
								>
									{copy.flow.nextButton} <Icon name="arrow" size={36} />
								</div>
							</StepPane>

							{/* Langkah 2: konfirmasi */}
							<StepPane frame={frame} inAt={1156} outAt={1274}>
								<Title>
									<Icon name="confirm" size={44} color={colors.cyan} /> Ringkasan pesanan
								</Title>
								<div style={{marginTop: 26}}>
									{orderDemo.summary.map((row) => (
										<div
											key={row.label}
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												height: 100,
												borderBottom: '2px solid rgba(79,139,255,0.2)',
												fontFamily: fonts.display,
												fontSize: 32,
											}}
										>
											<span style={{color: colors.inkSoft, fontWeight: 700}}>{row.label}</span>
											{row.value.startsWith('[') ? (
												<Placeholder size={28}>{row.value}</Placeholder>
											) : (
												<span style={{color: colors.white, fontWeight: 800}}>{row.value}</span>
											)}
										</div>
									))}
								</div>
								<div
									style={{
										...btnBase,
										position: 'absolute',
										left: 0,
										right: 0,
										top: 600,
										height: 96,
										fontSize: 34,
										color: colors.white,
										background: sent ? colors.success : colors.electric,
										transform: `scale(${pressScale(frame, CLICKS[2])})`,
									}}
								>
									{sent ? <Icon name="check" size={36} /> : null}
									{sent ? copy.flow.sentLabel : copy.flow.confirmButton}
								</div>
							</StepPane>

							{/* Langkah 3: akses panel + konsol */}
							<StepPane frame={frame} inAt={1284}>
								<Title>
									<Icon name="key" size={44} color={colors.success} /> {copy.flow.accessTitle}
								</Title>
								<div
									style={{
										marginTop: 22,
										height: 140,
										borderRadius: 26,
										background: 'rgba(31,107,255,0.16)',
										border: '2px solid rgba(79,209,255,0.5)',
										display: 'flex',
										alignItems: 'center',
										padding: '0 26px',
										gap: 18,
										boxSizing: 'border-box',
									}}
								>
									<Icon name="server" size={44} color={colors.cyan} />
									<div>
										<div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 30, color: colors.white}}>{orderDemo.serverName}</div>
										<div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 22, color: colors.inkSoft, marginTop: 4}}>
											{orderDemo.summary[0].value} · {runtimes[0].name}
										</div>
									</div>
									<div style={{flex: 1}} />
									<div
										style={{
											...btnBase,
											width: 250,
											height: 76,
											fontSize: 26,
											color: colors.white,
											background: consoleOpen > 0 ? colors.electricBright : colors.electric,
											transform: `scale(${pressScale(frame, CLICKS[3])})`,
										}}
									>
										<Icon name="terminal" size={30} /> {copy.flow.consoleButton}
									</div>
								</div>
								<div
									style={{
										marginTop: 26,
										height: 470 * consoleOpen,
										borderRadius: 26,
										background: '#040818',
										border: '2px solid rgba(79,139,255,0.3)',
										overflow: 'hidden',
										opacity: Math.min(1, consoleOpen * 2),
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 10,
											padding: '16px 24px',
											borderBottom: '2px solid rgba(79,139,255,0.2)',
											fontFamily: fonts.display,
											fontWeight: 700,
											fontSize: 24,
											color: colors.inkSoft,
										}}
									>
										<Icon name="terminal" size={28} color={colors.cyan} /> Konsol — {orderDemo.serverName}
									</div>
									<div style={{padding: '18px 24px', fontFamily: fonts.mono, fontSize: 26, lineHeight: '46px'}}>
										{orderDemo.console.map((line, i) => {
											const s = CONSOLE_AT[i];
											if (frame < s) return null;
											const n = Math.floor(tween(frame, [s, s + 12], [0, line.length], (x) => x));
											return (
												<div key={line} style={{whiteSpace: 'nowrap', color: i === 0 ? colors.warning : i === 2 ? colors.success : colors.ink}}>
													{line.slice(0, n)}
													{i === 2 && n === line.length && Math.floor(frame / 16) % 2 === 0 ? ' ▍' : ''}
												</div>
											);
										})}
									</div>
								</div>
							</StepPane>
						</Frame>
					</div>

					<Cursor frame={frame} x={cur.x} y={cur.y} clicks={CLICKS} opacity={cursorOpacity} />
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
