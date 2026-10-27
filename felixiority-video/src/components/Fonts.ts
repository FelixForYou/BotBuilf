import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/** Semua font dimuat dari folder public/fonts (tanpa layanan eksternal). */
export const fontsReady = Promise.all([
  loadFont({family: 'Geist', url: staticFile('fonts/Geist.woff2'), weight: '100 900'}),
  loadFont({family: 'Geist Mono', url: staticFile('fonts/GeistMono.woff2'), weight: '100 900'}),
  loadFont({family: 'Instrument Serif', url: staticFile('fonts/InstrumentSerif.woff2'), weight: '400', style: 'normal'}),
  loadFont({family: 'Instrument Serif', url: staticFile('fonts/InstrumentSerif-Italic.woff2'), weight: '400', style: 'italic'}),
]);
