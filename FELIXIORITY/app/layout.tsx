import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FELIXIORITY",
  description: "Lihat seluruh user dan server panel Pterodactyl dalam ruangan pixel interaktif.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#090e22",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
