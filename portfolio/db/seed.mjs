// Data awal Felixiority. Semua isi bisa diubah dari dashboard admin.
// URL sengaja dikosongkan: tombol kunjungan hanya muncul setelah admin mengisinya.

export const DEFAULT_SETTINGS = {
  hero: {
    eyebrow: "Studio digital independen",
    headline: "Website, API, dan server yang saling terhubung dalam satu ekosistem.",
    sub: "Felixiority menaungi project website, Rest API, AI, bot Telegram, dan panel hosting Pterodactyl; tempat ide dibangun sampai benar-benar bisa dipakai orang.",
  },
  about: {
    title: "Produk yang dipakai, server yang dirawat.",
    paragraphs: [
      "Felixiority fokus pada dua pekerjaan yang jarang dipisahkan: membuat produk digital dan mengurus infrastruktur tempat produk itu berjalan. Pekerjaan sebuah website atau API tidak selesai saat deploy, karena sesudahnya ada panel yang perlu diatur, resource yang harus diawasi, dan pengguna yang menunggu akses.",
      "Sebagian project lahir dari kebutuhan sendiri saat mengelola server Pterodactyl. Sebagian lain murni eksperimen visual yang belum tentu jadi produk, dan keduanya tetap dipajang di sini apa adanya, lengkap dengan statusnya.",
    ],
    focus: [
      "Pengembangan produk digital",
      "Infrastruktur Pterodactyl",
      "Integrasi AI dan Rest API",
      "Eksperimen motion dan antarmuka",
    ],
  },
  services: [
    {
      title: "Pengembangan website",
      body: "Landing page, dashboard, atau aplikasi web lengkap dengan panel admin. Ditulis dengan Next.js dan TypeScript, siap jalan di VPS sendiri.",
    },
    {
      title: "Integrasi API",
      body: "Menyambungkan website atau bot ke layanan AI dan API pihak ketiga, lalu merapikan endpoint-nya supaya developer lain tidak perlu menebak format respons.",
    },
    {
      title: "Otomasi bot",
      body: "Bot Telegram untuk pemesanan, notifikasi, dan pengelolaan layanan. Pengguna cukup menekan tombol; tidak perlu membuka dashboard.",
    },
    {
      title: "Pengelolaan panel hosting",
      body: "Setup dan perawatan panel Pterodactyl: node, egg, alokasi resource, sampai akun pengguna yang rapi.",
    },
  ],
  contact: {
    title: "Punya project yang perlu dibangun atau server yang perlu dirapikan?",
    note: "Ceritakan kebutuhanmu secara singkat. Ide yang belum jelas bentuknya juga boleh.",
    email: "",
    telegram: "",
    whatsapp: "",
    location: "",
  },
  socials: [],
  seo: {
    title: "Felixiority · Website, API, dan Infrastruktur",
    description: "Portfolio Felixiority: project website, Rest API, AI, bot Telegram, panel hosting Pterodactyl, dan eksperimen digital.",
  },
  motion: "full",
};

export const SEED_PROJECTS = [
  {
    slug: "fxb-restapi",
    title: "FxB RestApi",
    summary: "Layanan Rest API untuk AI, downloader, tools, dan integrasi digital dalam satu base URL.",
    description:
      "FxB RestApi mengumpulkan kebutuhan yang sering muncul saat membangun bot atau website: endpoint AI, downloader media, dan berbagai utilitas kecil yang biasanya harus dicari satu per satu di tempat berbeda.\n\nIdenya sederhana. Developer memanggil satu base URL, menerima format respons yang konsisten, lalu bisa langsung fokus ke produknya sendiri.",
    categories: ["api", "ai"],
    tech: ["Rest API", "Node.js", "JSON"],
    status: "active",
    preview_kind: "api",
    featured: 1,
  },
  {
    slug: "semile-ai",
    title: "Semile AI",
    summary: "Antarmuka percakapan AI yang sederhana, cepat dibuka, dan enak dipakai lama.",
    description:
      "Semile AI adalah antarmuka chat AI yang sengaja dibuat tidak ramai. Kolom pesan, riwayat percakapan, dan jawaban yang mudah dibaca; selebihnya disingkirkan.\n\nProject ini jadi tempat menguji bagaimana pengalaman ngobrol dengan AI bisa terasa ringan tanpa kehilangan fungsi.",
    categories: ["ai", "website"],
    tech: ["AI", "Web App"],
    status: "development",
    preview_kind: "chat",
    featured: 1,
  },
  {
    slug: "felix-panel",
    title: "FELIX PANEL",
    summary: "Platform pemesanan panel hosting sekaligus tempat pelanggan mengelola layanannya.",
    description:
      "FELIX PANEL menangani alur yang biasanya tercecer di chat: pelanggan memilih paket panel, memesan, lalu memantau layanannya dari satu dashboard.\n\nDi sisi pengelola, pesanan dan akun panel tercatat rapi sehingga tidak ada yang terlewat saat jumlah pelanggan bertambah.",
    categories: ["hosting", "website"],
    tech: ["Pterodactyl", "Web App"],
    status: "active",
    preview_kind: "panel",
    featured: 1,
  },
  {
    slug: "felixiority-tools",
    title: "FELIXIORITY TOOLS",
    summary: "Alat pengelolaan Pterodactyl untuk server, pengguna, dan resource.",
    description:
      "FELIXIORITY TOOLS lahir dari pekerjaan admin panel yang berulang: membuat user, mengatur server, mengecek alokasi resource. Semua tugas itu dikumpulkan ke satu antarmuka yang langsung bicara dengan API Pterodactyl.\n\nHasilnya, pekerjaan rutin yang dulu butuh banyak klik di panel bisa selesai dari satu layar.",
    categories: ["hosting"],
    tech: ["Pterodactyl API", "Node.js"],
    status: "development",
    preview_kind: "tools",
    featured: 0,
  },
  {
    slug: "felixiority-3d-user-warehouse",
    title: "FELIXIORITY — 3D USER WAREHOUSE",
    summary: "Eksplorasi visual pengguna Pterodactyl dalam ruang 3D interaktif.",
    description:
      "Daftar pengguna panel biasanya berupa tabel panjang. 3D USER WAREHOUSE mencoba cara lain: setiap pengguna dan servernya ditempatkan sebagai objek di dalam ruang yang bisa dijelajahi.\n\nProject ini masih eksperimen, dan pertanyaan utamanya belum terjawab: apakah tampilan ruang membantu admin memahami kondisi panel lebih cepat daripada tabel?",
    categories: ["experiment", "hosting"],
    tech: ["Pterodactyl API", "WebGL", "Next.js"],
    status: "development",
    preview_kind: "warehouse",
    featured: 1,
  },
  {
    slug: "fxb-cpanel",
    title: "FxB Cpanel",
    summary: "Bot Telegram untuk memesan dan mengelola panel tanpa membuka dashboard.",
    description:
      "FxB Cpanel memindahkan pemesanan panel ke tempat pelanggan sudah berada, yaitu Telegram. Pilih paket, konfirmasi, dan cek layanan cukup lewat tombol di dalam chat.\n\nBot ini juga membantu pengelola menerima pesanan tanpa harus membalas pesan satu per satu.",
    categories: ["bot", "hosting"],
    tech: ["Telegram Bot API", "Pterodactyl API"],
    status: "active",
    preview_kind: "bot",
    featured: 0,
  },
  {
    slug: "fxbgram",
    title: "FxBgraM",
    summary: "Antarmuka Telegram dengan pendekatan visual liquid glass.",
    description:
      "FxBgraM adalah eksplorasi tampilan Telegram dengan lapisan transparan, pantulan halus, dan tata letak yang lebih lega. Fokusnya ada pada rasa material di antarmuka, sementara fungsi chat tetap dijaga agar tidak tenggelam oleh efek.",
    categories: ["experiment", "bot"],
    tech: ["UI Design", "Telegram"],
    status: "development",
    preview_kind: "glass",
    featured: 1,
  },
  {
    slug: "motion-remotion-studio",
    title: "Motion & Remotion Studio",
    summary: "Kumpulan eksperimen motion graphics dan animasi yang ditulis lewat kode.",
    description:
      "Tempat menyimpan eksperimen animasi berbasis kode: komposisi Remotion, koreografi GSAP, dan potongan motion kecil yang suatu saat bisa dipakai di produk lain.\n\nTidak semua eksperimen di sini selesai, dan memang tidak harus.",
    categories: ["experiment"],
    tech: ["Remotion", "GSAP", "React"],
    status: "development",
    preview_kind: "motion",
    featured: 0,
  },
];

export function seedDatabase(db) {
  const hasProjects = db.prepare("SELECT COUNT(*) AS n FROM projects").get().n > 0;
  if (!hasProjects) {
    const insert = db.prepare(
      `INSERT INTO projects (slug, title, summary, description, categories, tech, status, preview_kind, featured, sort_order, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    );
    SEED_PROJECTS.forEach((p, i) => {
      insert.run(p.slug, p.title, p.summary, p.description, JSON.stringify(p.categories), JSON.stringify(p.tech), p.status, p.preview_kind, p.featured, i + 1);
    });
  }
  const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    insertSetting.run(key, JSON.stringify(value));
  }
}
