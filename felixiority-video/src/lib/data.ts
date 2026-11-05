import type { Status } from "./ui";

export type Kind = "api" | "chat" | "panel" | "tools" | "warehouse" | "bot" | "glass" | "motion";

export const HERO = {
  eyebrow: "Studio digital independen",
  headline: "Website, API, dan server yang saling terhubung dalam satu ekosistem.",
  sub: "Felixiority menaungi project website, Rest API, AI, bot Telegram, dan panel hosting Pterodactyl; tempat ide dibangun sampai benar-benar bisa dipakai orang.",
};

export const ABOUT = {
  title: "Produk yang dipakai, server yang dirawat.",
  body: "Pekerjaan sebuah website atau API tidak selesai saat deploy. Sesudahnya ada panel yang perlu diatur, resource yang harus diawasi, dan pengguna yang menunggu akses.",
  focus: ["Pengembangan produk digital", "Infrastruktur Pterodactyl", "Integrasi AI dan Rest API", "Eksperimen motion dan antarmuka"],
};

export const SERVICES = [
  { title: "Pengembangan website", body: "Landing page, dashboard, atau aplikasi web lengkap dengan panel admin." },
  { title: "Integrasi API", body: "Menyambungkan website atau bot ke layanan AI dan API pihak ketiga." },
  { title: "Otomasi bot", body: "Bot Telegram untuk pemesanan, notifikasi, dan pengelolaan layanan." },
  { title: "Pengelolaan panel hosting", body: "Setup dan perawatan panel Pterodactyl: node, egg, alokasi resource." },
];

export const CONTACT = {
  title: "Punya project yang perlu dibangun atau server yang perlu dirapikan?",
  note: "Ceritakan kebutuhanmu secara singkat. Ide yang belum jelas bentuknya juga boleh.",
};

export type Project = { title: string; summary: string; cats: string[]; tech: string[]; status: Status; kind: Kind };

export const PROJECTS: Project[] = [
  { title: "FxB RestApi", summary: "Layanan Rest API untuk AI, downloader, tools, dan integrasi digital dalam satu base URL.", cats: ["API", "AI"], tech: ["Rest API", "Node.js", "JSON"], status: "active", kind: "api" },
  { title: "Semile AI", summary: "Antarmuka percakapan AI yang sederhana, cepat dibuka, dan enak dipakai lama.", cats: ["AI", "Website"], tech: ["AI", "Web App"], status: "development", kind: "chat" },
  { title: "FELIX PANEL", summary: "Platform pemesanan panel hosting sekaligus tempat pelanggan mengelola layanannya.", cats: ["Hosting", "Website"], tech: ["Pterodactyl", "Web App"], status: "active", kind: "panel" },
  { title: "FELIXIORITY TOOLS", summary: "Alat pengelolaan Pterodactyl untuk server, pengguna, dan resource.", cats: ["Hosting"], tech: ["Pterodactyl API", "Node.js"], status: "development", kind: "tools" },
  { title: "3D User Warehouse", summary: "Eksplorasi visual pengguna Pterodactyl dalam ruang 3D interaktif.", cats: ["Eksperimen", "Hosting"], tech: ["Pterodactyl API", "WebGL", "Next.js"], status: "development", kind: "warehouse" },
  { title: "FxB Cpanel", summary: "Bot Telegram untuk memesan dan mengelola panel tanpa membuka dashboard.", cats: ["Bot", "Hosting"], tech: ["Telegram Bot API", "Pterodactyl API"], status: "active", kind: "bot" },
  { title: "FxBgraM", summary: "Antarmuka Telegram dengan pendekatan visual liquid glass.", cats: ["Eksperimen", "Bot"], tech: ["UI Design", "Telegram"], status: "development", kind: "glass" },
  { title: "Motion & Remotion Studio", summary: "Kumpulan eksperimen motion graphics dan animasi yang ditulis lewat kode.", cats: ["Eksperimen"], tech: ["Remotion", "GSAP", "React"], status: "development", kind: "motion" },
];
