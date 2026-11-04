import './ui/style.css';
import { Game } from './game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
let game: Game;
try {
  game = new Game(canvas);
  (window as unknown as { __wotw: unknown }).__wotw = game; // dipakai uji otomatis (e2e)
  game.boot().catch((e) => showError(e));
} catch (e) {
  showError(e);
}

function showError(e: unknown) {
  console.error(e);
  const s = document.getElementById('screens')!;
  s.innerHTML = `<div class="screen dim"><div class="panel"><h2>Tidak dapat memulai</h2><p>Perangkat atau browser ini mungkin tidak mendukung WebGL. Coba Chrome/Firefox terbaru.</p><p style="font-size:12px">${String(e)}</p></div></div>`;
}
