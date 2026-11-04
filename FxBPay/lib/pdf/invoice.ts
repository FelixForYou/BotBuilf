import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Payment } from "../payments/service";
import { formatRupiah } from "../money";
import { fmtDate } from "../format";
import { STATUS_LABEL } from "../payments/status";

/** Invoice / bukti pembayaran PDF bermerek FxB Pay. */
export async function renderInvoicePdf(p: Payment, merchant: { storeName: string; email: string }, kind: "invoice" | "receipt", siteName = "FxB Pay") {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mint = rgb(0x58 / 255, 0xdc / 255, 0xc5 / 255);
  const dark = rgb(0.06, 0.06, 0.06);
  const gray = rgb(0.45, 0.45, 0.45);
  page.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: dark });
  page.drawRectangle({ x: 40, y: 772, width: 36, height: 36, color: mint });
  page.drawText("F", { x: 51, y: 780, size: 22, font: bold, color: dark });
  page.drawText(siteName, { x: 88, y: 792, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("BY FELIXIORITY", { x: 88, y: 776, size: 9, font, color: mint });
  page.drawText(kind === "invoice" ? "INVOICE" : "BUKTI PEMBAYARAN", { x: 380, y: 788, size: 16, font: bold, color: rgb(1, 1, 1) });
  if (p.env === "sandbox") page.drawText(p.provider === "demo" ? "SANDBOX · DEMO — BUKAN TRANSAKSI NYATA" : "SANDBOX — BUKAN TRANSAKSI NYATA", { x: 40, y: 750, size: 9, font: bold, color: rgb(1, 0.72, 0.29) });

  let y = 700;
  const line = (k: string, v: string, b = false) => {
    page.drawText(k, { x: 40, y, size: 11, font, color: gray });
    const f = b ? bold : font;
    const w = f.widthOfTextAtSize(v, 11);
    page.drawText(v, { x: 555 - w, y, size: 11, font: f, color: dark });
    y -= 24;
  };
  page.drawText(merchant.storeName || "Merchant", { x: 40, y, size: 14, font: bold, color: dark });
  y -= 18;
  page.drawText(merchant.email, { x: 40, y, size: 10, font, color: gray });
  y -= 36;
  line("Nomor referensi", p.partnerReferenceNo);
  if (p.orderRef) line("Referensi pesanan", p.orderRef);
  line("Deskripsi", p.description.slice(0, 60));
  line("Dibuat", fmtDate(p.createdAt));
  line("Berlaku hingga", fmtDate(p.expiresAt));
  if (p.paidAt) line("Dibayar", fmtDate(p.paidAt));
  line("Status", STATUS_LABEL[p.status]);
  line("Metode", p.provider === "dana" ? (p.paymentMethod === "qris" ? "QRIS via DANA" : "DANA") : "Demo (sandbox)");
  if (p.providerReferenceNo) line("Referensi DANA", p.providerReferenceNo);
  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 26;
  line("Nominal", formatRupiah(p.baseAmount));
  if (p.feeBearer === "customer") line("Biaya layanan", formatRupiah(p.fee));
  line("Total dibayar", formatRupiah(p.amount), true);
  if (p.refundedAmount > 0n) line("Direfund", formatRupiah(p.refundedAmount));
  page.drawText(kind === "receipt" ? "Bukti ini diterbitkan setelah pembayaran diverifikasi server FxB Pay." : "Bayar melalui link pembayaran resmi FxB Pay. Jangan pernah membagikan PIN/OTP DANA.", { x: 40, y: 60, size: 9, font, color: gray });
  page.drawText(`Dicetak ${fmtDate(new Date())} WIB`, { x: 40, y: 44, size: 9, font, color: gray });
  return Buffer.from(await pdf.save());
}
