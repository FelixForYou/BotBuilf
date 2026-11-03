import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Drawer, HelpFab, TopBar, Tour } from "@/components/shell";
import { Toaster } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — REST API by ${BRAND.developer}`, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.developer }],
};

export const viewport: Viewport = {
  themeColor: "#0e0e0f",
  width: "device-width",
  initialScale: 1,
};

const themeBoot = `try{var t=localStorage.getItem("fxb-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-dvh">
        <Providers>
          <TopBar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6">{children}</main>
          <Drawer />
          <HelpFab />
          <Tour />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
