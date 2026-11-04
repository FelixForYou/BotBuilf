import { z } from "zod";
import { cookies } from "next/headers";
import { authed } from "@/lib/api-helpers";
import { ENV_COOKIE } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { AppError } from "@/lib/errors";
import { config } from "@/lib/env";

export const POST = authed({ schema: z.object({ env: z.enum(["sandbox", "production"]) }) }, async ({ input }) => {
  if (input.env === "production" && !(await getSetting("production")).enabled) throw new AppError("production_disabled", "Mode Production belum diaktifkan admin. Tetap gunakan Sandbox.", 403);
  (await cookies()).set(ENV_COOKIE, input.env, { httpOnly: true, sameSite: "lax", secure: config.secureCookies, path: "/", maxAge: 365 * 86400 });
  return { message: input.env === "production" ? "Beralih ke Production" : "Beralih ke Sandbox" };
});
