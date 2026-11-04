/** Konfigurasi server. Tidak pernah diimpor oleh komponen klien. */
import "server-only";

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Variabel lingkungan ${name} belum diatur. Lihat .env.example.`);
  return v;
}

export const config = {
  get databaseUrl() {
    return req("DATABASE_URL");
  },
  get appUrl() {
    return req("APP_URL", process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000").replace(/\/+$/, "");
  },
  get encryptionKey() {
    return req("APP_ENCRYPTION_KEY", process.env.NODE_ENV === "production" ? undefined : "ZGV2LW9ubHktZW5jcnlwdGlvbi1rZXktMzJieXRlcyE=");
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  get secureCookies() {
    return (process.env.APP_URL ?? "").startsWith("https://");
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get setupToken() {
    return process.env.SETUP_TOKEN ?? "";
  },
  smtp: {
    get url() {
      return process.env.SMTP_URL ?? "";
    },
    get from() {
      return process.env.MAIL_FROM ?? "FxB Pay <no-reply@localhost>";
    },
  },
  get allowPrivateWebhooks() {
    return process.env.NODE_ENV !== "production" && process.env.ALLOW_PRIVATE_WEBHOOK_URLS === "1";
  },
};
