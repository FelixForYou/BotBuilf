// =====================================================================
//  FELIXIORITY — konfigurasi video promosi
//  Ubah teks, paket, harga, warna, logo, dan kontak HANYA di file ini.
//  Nilai dalam [KURUNG SIKU] adalah placeholder: ganti dengan data asli
//  sebelum dipublikasikan. Jangan isi dengan angka/klaim yang belum pasti.
// =====================================================================

export const video = {
	width: 1080,
	height: 1920,
	fps: 60,
	durationInFrames: 1800, // 30 detik
};

// Area aman: konten penting tidak diletakkan di luar kotak ini agar tidak
// tertutup UI TikTok / Reels / WhatsApp Story (caption, tombol samping, profil).
export const safeArea = {
	top: 210,
	bottom: 1500,
	left: 130,
	right: 130,
};

export const colors = {
	navyDeep: '#050a1f',
	navy: '#0a1433',
	navyPanel: '#0f1d47',
	navyLine: '#1e3172',
	electric: '#1f6bff',
	electricBright: '#3d8bff',
	cyan: '#4fd1ff',
	white: '#ffffff',
	ink: '#e8efff',
	inkSoft: '#9fb2e3',
	inkMute: '#6a7fb8',
	success: '#2fd58a',
	warning: '#ffb547',
	danger: '#ff5f6d',
};

export const fonts = {
	display: 'Plus Jakarta Sans',
	mono: 'JetBrains Mono',
};

export const brand = {
	name: 'FELIXIORITY',
	// Huruf di dalam logo bawaan. Isi `logoSrc` (file di folder public/, mis. 'logo.png')
	// untuk memakai logo gambar sendiri.
	monogram: 'F',
	logoSrc: null as string | null,
	tagline: 'Hosting Panel Pterodactyl',
};

// Judul besar ditulis per baris (1 item = 1 baris di layar) agar tidak ada teks
// yang terpotong. `accent` = kata yang diberi warna gradasi biru.
export const copy = {
	intro: {
		terminalTitle: 'bash — bot-kamu',
		terminalCommand: 'cd bot-kamu && npm start',
		terminalOutput: ['> node index.js', '[bot] memuat konfigurasi...', '[bot] mencari server untuk berjalan...'],
		headline: ['Butuh panel', 'untuk menjalankan', 'bot kamu?'],
		accent: ['panel'],
	},
	service: {
		headline: ['Kenalan dengan', 'FELIXIORITY.'],
		accent: ['FELIXIORITY'],
		subline: ['Hosting panel Pterodactyl', 'untuk kebutuhan bot kamu.'],
	},
	packages: {
		eyebrow: 'Pilihan paket',
	},
	flow: {
		eyebrow: 'Cara order',
		steps: ['Pilih paket', 'Konfirmasi pesanan', 'Terima akses panel'],
		nextButton: 'Lanjut',
		confirmButton: 'Konfirmasi pesanan',
		sentLabel: 'Pesanan dikirim',
		accessTitle: 'Akses panel diterima',
		consoleButton: 'Buka konsol',
	},
	cta: {
		headline: ['Siap menjalankan', 'bot kamu?'],
		accent: ['bot'],
		subline: 'Pilih paketmu dan hubungi kami.',
	},
};

// Kartu paket yang tampil bergantian di detik 10–17.
export const packageCards = [
	{
		id: 'ram',
		icon: 'memory',
		title: 'Pilihan RAM 1–10 GB',
		big: '1–10 GB',
		chips: ['1 GB', '2 GB', '3 GB', '4 GB', '5 GB', '6 GB', '7 GB', '8 GB', '9 GB', '10 GB'],
		priceLabel: 'Harga',
		price: '[HARGA PER PAKET]',
		note: null as string | null,
	},
	{
		id: 'unlimited',
		icon: 'infinity',
		title: 'Tersedia paket Unlimited',
		big: 'Unlimited',
		chips: [] as string[],
		priceLabel: 'Harga',
		price: '[HARGA UNLIMITED]',
		// "Unlimited" adalah nama paket, bukan sumber daya fisik tanpa batas.
		note: 'Batas penggunaan: [DETAIL KETENTUAN PAKET UNLIMITED]',
	},
	{
		id: 'runtime',
		icon: 'code',
		title: 'Untuk bot Node.js dan Python',
		big: 'Node.js & Python',
		chips: [] as string[],
		priceLabel: null as string | null,
		price: null as string | null,
		note: null as string | null,
	},
];

export const runtimes = [
	{name: 'Node.js', command: 'node index.js'},
	{name: 'Python', command: 'python main.py'},
];

// Pilihan yang muncul di simulasi "Pilih paket" (detik 17–24).
export const orderDemo = {
	options: ['1 GB', '2 GB', '4 GB', '6 GB', '8 GB', '10 GB', 'Unlimited'],
	selectedIndex: 2,
	summary: [
		{label: 'Paket', value: 'RAM 4 GB'},
		{label: 'Runtime', value: 'Node.js'},
		{label: 'Harga', value: '[HARGA]'},
	],
	serverName: 'bot-kamu',
	windowTitle: 'felixiority — order',
	console: ['container@pterodactyl~ npm start', '> node index.js', '[bot] berjalan'],
};

// Data contoh di mockup dashboard. Tidak berisi kredensial / data pelanggan.
export const dashboardDemo = {
	title: 'Server Saya',
	servers: [
		{name: 'bot-whatsapp', runtime: 'Node.js', online: true, ramUsedMb: 412, ramLimitMb: 2048, cpu: 18},
		{name: 'bot-telegram', runtime: 'Python', online: true, ramUsedMb: 236, ramLimitMb: 1024, cpu: 9},
		{name: 'bot-discord', runtime: 'Node.js', online: false, ramUsedMb: 0, ramLimitMb: 4096, cpu: 0},
	],
	console: [
		'container@pterodactyl~ npm start',
		'> node index.js',
		'[bot] konfigurasi dimuat',
		'[bot] terhubung, menunggu pesan...',
	],
};

export const contact = {
	label: 'Hubungi kami',
	telegram: '[USERNAME TELEGRAM]',
	whatsapp: '[NOMOR WHATSAPP]',
};

export const audio = {
	music: 'audio/music.wav',
	musicVolume: 0.9,
	sfxVolume: 0.55,
	bpm: 120,
};

// Batas adegan (frame @60 FPS). Semua jatuh tepat di ketukan musik 120 BPM.
export const scenes = {
	intro: {from: 0, to: 240},
	service: {from: 240, to: 600},
	packages: {from: 600, to: 1020},
	flow: {from: 1020, to: 1440},
	cta: {from: 1440, to: 1800},
};
