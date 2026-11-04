import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./icons";

export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-8">
      <Link href="/" className="mx-auto flex items-center gap-2.5">
        <Logo size={34} />
        <span className="text-lg font-extrabold">FxB Pay</span>
      </Link>
      <div className="animate-enter mx-auto my-auto w-full max-w-md py-10">
        <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="card mt-6 p-5 sm:p-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
      <p className="text-center text-xs text-subtle">FxB Pay — BY FELIXIORITY · Kami tidak pernah meminta PIN atau OTP DANA Anda.</p>
    </div>
  );
}
