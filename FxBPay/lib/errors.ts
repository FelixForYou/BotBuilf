export class AppError extends Error {
  constructor(public code: string, message: string, public status = 400, public details?: unknown) {
    super(message);
  }
}
export const notFound = (what = "Data") => new AppError("not_found", `${what} tidak ditemukan`, 404);
export const forbidden = (msg = "Anda tidak memiliki akses") => new AppError("forbidden", msg, 403);
export class InsufficientFundsError extends AppError {
  constructor() {
    super("insufficient_funds", "Saldo tidak mencukupi", 409);
  }
}

/** Kode error Postgres untuk pelanggaran CHECK constraint. */
export function isCheckViolation(e: unknown, constraint?: string): boolean {
  const err = (e as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } }) ?? {};
  const c = err.code === "23514" ? err : err.cause?.code === "23514" ? err.cause : null;
  return !!c && (!constraint || c.constraint === constraint);
}
export function isUniqueViolation(e: unknown): boolean {
  const err = (e as { code?: string; cause?: { code?: string } }) ?? {};
  return err.code === "23505" || err.cause?.code === "23505";
}
