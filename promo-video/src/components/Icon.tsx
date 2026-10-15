import {
	ArrowRight,
	Check,
	Code2,
	Cpu,
	Hexagon,
	Infinity as InfinityIcon,
	KeyRound,
	LayoutDashboard,
	MemoryStick,
	MessageCircle,
	Package,
	Send,
	Server,
	SquareTerminal,
	ClipboardCheck,
	type LucideIcon,
} from 'lucide-react';

// Satu set ikon SVG garis (stroke) yang konsisten untuk seluruh video.
const map = {
	arrow: ArrowRight,
	check: Check,
	code: Code2,
	cpu: Cpu,
	node: Hexagon,
	infinity: InfinityIcon,
	key: KeyRound,
	dashboard: LayoutDashboard,
	memory: MemoryStick,
	whatsapp: MessageCircle,
	package: Package,
	telegram: Send,
	server: Server,
	terminal: SquareTerminal,
	confirm: ClipboardCheck,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof map;

export const Icon: React.FC<{name: IconName; size?: number; color?: string; strokeWidth?: number}> = ({
	name,
	size = 32,
	color = 'currentColor',
	strokeWidth = 2.2,
}) => {
	const C = map[name];
	return <C size={size} color={color} strokeWidth={strokeWidth} absoluteStrokeWidth={false} />;
};
