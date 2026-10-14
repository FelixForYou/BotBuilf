import type { NextConfig } from "next";

/**
 * Dua mode build:
 * - Default (Vercel): aplikasi lengkap = frontend + API (/api/*).
 * - STATIC_EXPORT=1 (GitHub Pages): hanya frontend statis di folder `out/`;
 *   API dipanggil ke backend Vercel lewat NEXT_PUBLIC_API_BASE.
 */
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";
const BASE_PATH = STATIC_EXPORT ? (process.env.PAGES_BASE_PATH ?? "").replace(/\/+$/, "") : "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = STATIC_EXPORT
  ? {
      output: "export",
      basePath: BASE_PATH || undefined,
      trailingSlash: true,
      // Route handler (*.ts) tidak ikut diekspor; halaman & layout memakai .tsx.
      pageExtensions: ["tsx"],
      images: { unoptimized: true },
      reactStrictMode: true,
      env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
    }
  : {
      poweredByHeader: false,
      reactStrictMode: true,
      async headers() {
        return [
          { source: "/:path*", headers: securityHeaders },
          { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
        ];
      },
    };

export default nextConfig;
