/**
 * Motion blur terarah yang ringan: filter SVG feGaussianBlur dengan stdDeviation
 * berbeda untuk sumbu X/Y. Nilai dihitung dari kecepatan elemen per frame, sehingga
 * blur hanya muncul saat gerakan cepat dan hilang saat elemen diam (tetap terbaca).
 */
export const BlurFilter: React.FC<{id: string; x: number; y?: number}> = ({id, x, y = 0}) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<filter id={id} x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur stdDeviation={`${Math.max(0, x).toFixed(2)} ${Math.max(0, y).toFixed(2)}`} />
		</filter>
	</svg>
);

/** px/frame -> stdDeviation, dibatasi agar tidak berlebihan. */
export const blurFromVelocity = (v: number, k = 0.22, max = 14) => Math.min(max, Math.abs(v) * k);

export const filterFor = (id: string, x: number, y = 0) => (x > 0.15 || y > 0.15 ? `url(#${id})` : 'none');
