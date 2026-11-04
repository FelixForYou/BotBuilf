import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { currentEnv } from "@/lib/auth/session";
import { createPayment, quoteFee } from "@/lib/payments/service";
import { parseRupiah } from "@/lib/money";
import { AppError } from "@/lib/errors";

export const PaymentInput = z.object({
  amount: z.union([z.string(), z.number()]).transform((v, ctx) => {
    try {
      return parseRupiah(v);
    } catch {
      ctx.addIssue({ code: "custom", message: "Nominal harus bilangan bulat rupiah" });
      return z.NEVER;
    }
  }),
  description: z.string().trim().min(3, "Deskripsi minimal 3 karakter").max(140),
  orderRef: z.string().trim().max(64).regex(/^[A-Za-z0-9._\-/#]*$/, "Referensi hanya huruf, angka, dan . _ - / #").optional().default(""),
  expiresInMinutes: z.coerce.number().int(),
  feeBearer: z.enum(["merchant", "customer"]).optional(),
  purpose: z.enum(["payment", "topup"]).optional().default("payment"),
  method: z.enum(["redirect", "qris"]).optional().default("redirect"),
  customerName: z.string().trim().max(80).optional(),
  customerEmail: z.string().trim().email("Email pelanggan tidak valid").or(z.literal("")).optional(),
  quote: z.boolean().optional(),
});

export const POST = authed({ schema: PaymentInput, limit: 30 }, async ({ auth, input }) => {
  const env = await currentEnv();
  if (input.quote) {
    const q = await quoteFee(input.amount, input.feeBearer ?? "merchant");
    return { fee: q.fee.toString(), amount: q.amount.toString(), net: q.net.toString() };
  }
  if (!auth.user.emailVerifiedAt && env === "production") throw new AppError("email_unverified", "Verifikasi email Anda sebelum menerima pembayaran Production", 403);
  const p = await createPayment(auth.user.id, env, { ...input, via: "dashboard", feeBearer: input.purpose === "topup" ? "merchant" : input.feeBearer });
  return { id: p.id, publicId: p.publicId, redirect: `/app/pembayaran/${p.id}`, message: input.purpose === "topup" ? "Tagihan isi saldo dibuat" : "Link pembayaran dibuat" };
});
