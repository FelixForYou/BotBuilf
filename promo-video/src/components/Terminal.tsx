import {colors, copy, fonts} from '../config';
import {tween} from '../anim';
import {Frame, WindowBar} from './UI';

export const TYPE_START = 10;
export const TYPE_FRAMES_PER_CHAR = 1.5;
export const typeEnd = () => TYPE_START + copy.intro.terminalCommand.length * TYPE_FRAMES_PER_CHAR;

/** Terminal yang mengetik perintah lalu menampilkan output baris per baris. */
export const Terminal: React.FC<{frame: number}> = ({frame}) => {
	const cmd = copy.intro.terminalCommand;
	const chars = Math.floor(tween(frame, [TYPE_START, typeEnd()], [0, cmd.length], (t) => t));
	const outStart = typeEnd() + 6;
	const caretOn = Math.floor(frame / 16) % 2 === 0;
	const lastVisible = copy.intro.terminalOutput.filter((_, i) => frame >= outStart + i * 9).length;
	return (
		<Frame style={{left: 0, top: 0, width: 820, height: 400}}>
			<WindowBar title={copy.intro.terminalTitle} />
			<div style={{padding: '30px 38px', fontFamily: fonts.mono, fontSize: 30, lineHeight: '50px', color: colors.ink}}>
				<div style={{whiteSpace: 'nowrap'}}>
					<span style={{color: colors.success}}>$ </span>
					{cmd.slice(0, chars)}
					{lastVisible === 0 && caretOn ? <span style={{color: colors.cyan}}>▍</span> : null}
				</div>
				{copy.intro.terminalOutput.map((line, i) => {
					const s = outStart + i * 9;
					if (frame < s) return null;
					const isLast = i === copy.intro.terminalOutput.length - 1;
					return (
						<div
							key={line}
							style={{
								whiteSpace: 'nowrap',
								opacity: tween(frame, [s, s + 6], [0, 1]),
								color: line.startsWith('[bot]') ? colors.cyan : colors.inkSoft,
							}}
						>
							{line}
							{isLast && caretOn ? <span style={{color: colors.white}}> ▍</span> : null}
						</div>
					);
				})}
			</div>
		</Frame>
	);
};
