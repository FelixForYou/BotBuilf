import {colors} from '../config';
import {Box3D} from './Box3D';
import {Icon, type IconName} from './Icon';
import {LogoMark} from './Logo';

const faceStyle = {
	borderRadius: 34,
	background: `linear-gradient(140deg, #183a9c 0%, ${colors.electric} 60%, ${colors.electricBright} 100%)`,
	border: `3px solid ${colors.cyan}`,
	boxSizing: 'border-box' as const,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
};

const IconFace = ({name}: {name: IconName}) => <Icon name={name} size={96} color={colors.white} />;

/** Kubus logo 3D untuk adegan penutup. */
export const LogoCube: React.FC<{size: number}> = ({size}) => (
	<Box3D
		w={size}
		h={size}
		d={size}
		base={faceStyle}
		front={{style: {background: 'transparent', border: 'none'}, children: <LogoMark size={size} glow={0.4} />}}
		right={{children: <IconFace name="server" />}}
		back={{children: <IconFace name="terminal" />}}
		left={{children: <IconFace name="code" />}}
		top={{children: <IconFace name="cpu" />}}
		bottom={{children: <IconFace name="memory" />}}
	/>
);
