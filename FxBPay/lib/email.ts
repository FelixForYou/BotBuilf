import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { emailOutbox } from "./db/schema";
import { config } from "./env";

/** Kirim email dari outbox. Tanpa SMTP_URL (development), isi email ditulis ke log server dan tabel outbox. */
export async function sendQueuedEmail(id: string) {
  const [m] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, id));
  if (!m || m.status === "sent" || m.status === "logged") return;
  if (!config.smtp.url) {
    if (config.isProd) throw new Error("SMTP_URL belum diatur; email tidak dapat dikirim di production");
    console.info(`[fxb][email:dev] Kepada: ${m.to}\nSubjek: ${m.subject}\n${m.body}\n`);
    await db.update(emailOutbox).set({ status: "logged", sentAt: new Date() }).where(eq(emailOutbox.id, id));
    return;
  }
  const nodemailer = await import("nodemailer");
  const t = nodemailer.createTransport(config.smtp.url);
  await t.sendMail({ from: config.smtp.from, to: m.to, subject: m.subject, text: m.body });
  await db.update(emailOutbox).set({ status: "sent", sentAt: new Date() }).where(eq(emailOutbox.id, id));
}
