import { apiAuth, currentEnv } from "@/lib/auth/session";
import { route } from "@/lib/http";
import { listPayments, parseFilters } from "@/lib/payments/query";
import { STATUS_LABEL } from "@/lib/payments/status";

function csvCell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // cegah CSV/formula injection
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET = route(async (req) => {
  const auth = await apiAuth();
  const env = await currentEnv();
  const f = parseFilters(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await listPayments({ userId: auth.user.id, env, ...f, limit: 10_000, offset: 0 });
  const head = ["referensi", "ref_pesanan", "deskripsi", "status", "nominal", "biaya", "bersih", "direfund", "dibuat", "dibayar", "env", "provider"];
  const lines = [head.join(",")];
  for (const p of rows.items) lines.push([p.partnerReferenceNo, p.orderRef, p.description, STATUS_LABEL[p.status], p.amount, p.fee, p.net, p.refundedAmount, p.createdAt.toISOString(), p.paidAt?.toISOString() ?? "", p.env, p.provider].map(csvCell).join(","));
  return new Response("﻿" + lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="fxbpay-${env}-transaksi.csv"` } });
});
