export const CATEGORIES = [
  { id: "website", label: "Website" },
  { id: "ai", label: "AI" },
  { id: "api", label: "API" },
  { id: "hosting", label: "Hosting" },
  { id: "bot", label: "Bot" },
  { id: "experiment", label: "Eksperimen" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const STATUSES = [
  { id: "active", label: "Aktif" },
  { id: "development", label: "Pengembangan" },
  { id: "maintenance", label: "Maintenance" },
  { id: "archived", label: "Arsip" },
] as const;
export type StatusId = (typeof STATUSES)[number]["id"];

export const LINK_KINDS = [
  { id: "website", label: "Website" },
  { id: "demo", label: "Demo" },
  { id: "github", label: "GitHub" },
  { id: "docs", label: "Dokumentasi" },
  { id: "other", label: "Lainnya" },
] as const;
export type LinkKind = (typeof LINK_KINDS)[number]["id"];

export const PREVIEW_KINDS = [
  { id: "api", label: "Endpoint API" },
  { id: "chat", label: "Percakapan AI" },
  { id: "panel", label: "Pemesanan panel" },
  { id: "tools", label: "Tabel server" },
  { id: "warehouse", label: "Ruang 3D" },
  { id: "bot", label: "Bot Telegram" },
  { id: "glass", label: "Liquid glass" },
  { id: "motion", label: "Timeline motion" },
] as const;
export type PreviewKind = (typeof PREVIEW_KINDS)[number]["id"];

export type MotionLevel = "full" | "light" | "minimal";

export interface ProjectLink {
  id?: number;
  kind: LinkKind;
  label: string;
  url: string;
}

export interface ProjectImage {
  id: number;
  role: "cover" | "gallery";
  file: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  categories: CategoryId[];
  tech: string[];
  status: StatusId;
  prevStatus: StatusId | null;
  previewKind: PreviewKind;
  featured: boolean;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  links: ProjectLink[];
  cover: ProjectImage | null;
  gallery: ProjectImage[];
}

export interface Settings {
  hero: { eyebrow: string; headline: string; sub: string };
  about: { title: string; paragraphs: string[]; focus: string[] };
  services: { title: string; body: string }[];
  contact: { title: string; note: string; email: string; telegram: string; whatsapp: string; location: string };
  socials: { label: string; url: string }[];
  seo: { title: string; description: string };
  motion: MotionLevel;
}

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const statusLabel = (id: string) => STATUSES.find((s) => s.id === id)?.label ?? id;
export const linkLabel = (l: ProjectLink) => l.label || LINK_KINDS.find((k) => k.id === l.kind)?.label || "Tautan";
export const mediaUrl = (file: string) => `/media/${file}`;
