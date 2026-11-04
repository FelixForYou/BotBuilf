import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/client";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FxB Pay — BY FELIXIORITY", template: "%s · FxB Pay" },
  description: "Payment gateway dengan integrasi resmi DANA, dompet ber-ledger, dan dashboard admin.",
  robots: { index: false },
};
export const viewport: Viewport = { themeColor: "#101010", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-dvh">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
