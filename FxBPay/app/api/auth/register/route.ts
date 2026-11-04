import { z } from "zod";
import { register } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { assertSameOrigin, body, clientIp, json, route, userAgent } from "@/lib/http";

const S = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  storeName: z.string().trim().min(2, "Nama toko minimal 2 karakter").max(80),
  email: z.string().trim().email("Email tidak valid").max(160),
  phone: z.string().trim().regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor telepon Indonesia tidak valid"),
  password: z.string().min(1).max(200),
});

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const input = await body(req, S);
  const u = await register(input, clientIp(req));
  await createSession(u, { ip: clientIp(req), userAgent: userAgent(req) });
  return json({ ok: true, redirect: "/onboarding", message: "Akun dibuat. Cek email untuk verifikasi." });
});
