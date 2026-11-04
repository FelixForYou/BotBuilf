import { authed } from "@/lib/api-helpers";
import { sendVerificationEmail } from "@/lib/auth/service";
import { rateLimit } from "@/lib/ratelimit";

export const POST = authed({}, async ({ auth }) => {
  if (auth.user.emailVerifiedAt) return { message: "Email sudah terverifikasi" };
  await rateLimit(`verify-resend:${auth.user.id}`, 3, 3600);
  await sendVerificationEmail(auth.user);
  return { message: "Email verifikasi dikirim ulang" };
});
