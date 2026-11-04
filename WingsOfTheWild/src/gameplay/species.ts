// Jenis burung yang bisa dibuka, masing-masing dengan karakter berbeda.
export interface Species {
  id: string; name: string; desc: string;
  speed: number; agility: number; stamina: number; glide: number; dive: number;
  size: number; wing: number; tail: number; forkTail: boolean;
  colors: { body: string; wing: string; belly: string; beak: string };
  unlock: { type: 'start' | 'level' | 'secrets' | 'fish'; value: number; text: string };
  special: string;
}

export const SPECIES: Species[] = [
  { id: 'pipit', name: 'Pipit Ladang', desc: 'Kecil, lincah, seimbang. Teman terbaik untuk belajar terbang.', speed: 1, agility: 1.15, stamina: 100, glide: 0.95, dive: 1, size: 1, wing: 1, tail: 1, forkTail: false,
    colors: { body: '#a5714a', wing: '#6e4a33', belly: '#efe0c4', beak: '#3a3330' }, unlock: { type: 'start', value: 0, text: 'Tersedia sejak awal' }, special: 'Makan memulihkan stamina lebih banyak.' },
  { id: 'layang', name: 'Layang-layang', desc: 'Sangat cepat dan gesit, stamina sedikit lebih rendah.', speed: 1.18, agility: 1.35, stamina: 90, glide: 1, dive: 1.05, size: 0.9, wing: 1.15, tail: 1.3, forkTail: true,
    colors: { body: '#2b3f73', wing: '#1d2748', belly: '#f2ece4', beak: '#222222' }, unlock: { type: 'level', value: 3, text: 'Capai level 3' }, special: 'Wind Dash lebih jauh.' },
  { id: 'camar', name: 'Camar Pantai', desc: 'Peluncur ulung: hampir tak perlu mengepak di udara.', speed: 1.05, agility: 0.85, stamina: 120, glide: 1.4, dive: 1.05, size: 1.25, wing: 1.35, tail: 1, forkTail: false,
    colors: { body: '#f4f4f2', wing: '#9aa6b2', belly: '#ffffff', beak: '#f2b33d' }, unlock: { type: 'level', value: 5, text: 'Capai level 5' }, special: 'Arus udara naik lebih kuat.' },
  { id: 'raja-udang', name: 'Raja Udang', desc: 'Penyelam handal, mudah menangkap ikan.', speed: 1.08, agility: 1.1, stamina: 100, glide: 0.9, dive: 1.4, size: 0.95, wing: 0.95, tail: 0.8, forkTail: false,
    colors: { body: '#1f8fc4', wing: '#1673a8', belly: '#ef8a3a', beak: '#262020' }, unlock: { type: 'fish', value: 5, text: 'Tangkap 5 ikan' }, special: 'Ikan memberi makanan dua kali lipat.' },
  { id: 'elang', name: 'Elang Gunung', desc: 'Kuat, stamina besar, tukikan sangat cepat. Predator segan mendekat.', speed: 1.15, agility: 0.9, stamina: 140, glide: 1.25, dive: 1.45, size: 1.55, wing: 1.5, tail: 1.1, forkTail: false,
    colors: { body: '#6b4a2e', wing: '#4a321f', belly: '#d9c3a0', beak: '#e8c13a' }, unlock: { type: 'level', value: 8, text: 'Capai level 8' }, special: 'Predator jarang mengejar.' },
  { id: 'hantu', name: 'Burung Hantu', desc: 'Senyap dan bermata tajam — penguasa malam.', speed: 1, agility: 1, stamina: 115, glide: 1.15, dive: 1.1, size: 1.3, wing: 1.25, tail: 0.7, forkTail: false,
    colors: { body: '#9c8466', wing: '#6e5a44', belly: '#e9dcc4', beak: '#3a3330' }, unlock: { type: 'secrets', value: 4, text: 'Temukan 4 lokasi rahasia' }, special: 'Jarak pandang luas & tidak terdeteksi di malam hari.' },
];

export const COLOR_PRESETS = [
  { name: 'Asli', body: '', wing: '', belly: '', beak: '' },
  { name: 'Senja', body: '#d4693a', wing: '#8a3f2a', belly: '#f6d8a8', beak: '#3a3330' },
  { name: 'Hutan', body: '#4f7f3a', wing: '#2f5a2a', belly: '#e6e2b0', beak: '#e0a838' },
  { name: 'Salju', body: '#e9eef3', wing: '#aab8c6', belly: '#ffffff', beak: '#e88a2a' },
  { name: 'Malam', body: '#33325a', wing: '#1f1d3a', belly: '#8f8cc4', beak: '#f2d24a' },
  { name: 'Tropis', body: '#e8c53a', wing: '#2fa36b', belly: '#f2f0b8', beak: '#d2403a' },
];
