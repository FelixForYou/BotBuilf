import {Img, staticFile} from 'remotion';
import {brand, colors, fonts} from '../config';

/** Logo bawaan (monogram) atau gambar dari config.brand.logoSrc. */
export const LogoMark: React.FC<{size: number; glow?: number}> = ({size, glow = 0.6}) => {
	if (brand.logoSrc) {
		return <Img src={staticFile(brand.logoSrc)} style={{width: size, height: size, objectFit: 'contain'}} />;
	}
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: size * 0.26,
				background: `linear-gradient(140deg, ${colors.electricBright} 0%, ${colors.electric} 55%, #1240b8 100%)`,
				boxShadow: `0 0 ${size * 0.6}px rgba(31,107,255,${glow}), inset 0 2px 0 rgba(255,255,255,0.35)`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: colors.white,
				fontFamily: fonts.display,
				fontWeight: 800,
				fontSize: size * 0.58,
				lineHeight: 1,
				flexShrink: 0,
			}}
		>
			{brand.monogram}
		</div>
	);
};

export const BrandChip: React.FC<{size?: number}> = ({size = 40}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: size * 0.4}}>
		<LogoMark size={size * 1.5} glow={0.45} />
		<div
			style={{
				fontFamily: fonts.display,
				fontWeight: 800,
				fontSize: size,
				letterSpacing: '0.06em',
				color: colors.white,
				lineHeight: 1,
			}}
		>
			{brand.name}
		</div>
	</div>
);
