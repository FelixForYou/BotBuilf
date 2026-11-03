import { Download, Image as ImageIcon, Smile, Sparkles, Wrench, type LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  downloader: Download,
  ai: Sparkles,
  "ai-image": ImageIcon,
  entertainment: Smile,
  tools: Wrench,
};
