import {Composition} from 'remotion';
import {video} from './config';
import {Promo} from './Promo';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="FelixiorityPromo"
			component={Promo}
			durationInFrames={video.durationInFrames}
			fps={video.fps}
			width={video.width}
			height={video.height}
		/>
	);
};
