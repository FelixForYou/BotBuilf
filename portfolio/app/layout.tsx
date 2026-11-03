import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  return {
    title: { default: s.seo.title, template: `%s · Felixiority` },
    description: s.seo.description,
    openGraph: { title: s.seo.title, description: s.seo.description, type: "website", siteName: "Felixiority" },
    twitter: { card: "summary", title: s.seo.title, description: s.seo.description },
  };
}

export const viewport: Viewport = {
  themeColor: "#F2EEE6",
  width: "device-width",
  initialScale: 1,
};

// Menentukan level animasi sebelum halaman tampil, supaya tidak ada kedipan konten.
const motionBoot = `(function(){try{var d=document.documentElement;var p=d.getAttribute('data-motion-pref')||'full';
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)p='minimal';
d.setAttribute('data-motion',p);
d.setAttribute('data-device',window.matchMedia('(max-width: 767px), (pointer: coarse)').matches?'touch':'desk');
setTimeout(function(){d.classList.add('motion-fallback')},4000);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const s = getSettings();
  return (
    <html lang="id" data-motion-pref={s.motion} data-motion="minimal" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
