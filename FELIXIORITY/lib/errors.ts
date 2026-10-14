// Kesalahan yang aman ditampilkan ke pengguna. Pesan tidak boleh memuat API key.

export type ErrorCode =
  | "CONFIG"
  | "INVALID_DOMAIN"
  | "HTTPS_REQUIRED"
  | "BLOCKED_ADDRESS"
  | "DNS_FAILED"
  | "CONNECT_FAILED"
  | "TIMEOUT"
  | "TLS_FAILED"
  | "REDIRECT"
  | "INVALID_KEY_FORMAT"
  | "KEY_REJECTED"
  | "PERMISSION_DENIED"
  | "NOT_PTERODACTYL"
  | "PANEL_ERROR"
  | "RATE_LIMITED"
  | "RESPONSE_TOO_LARGE"
  | "TOO_MANY_PAGES"
  | "NOT_CONNECTED"
  | "FORBIDDEN_ORIGIN"
  | "BAD_REQUEST";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status = 400,
    public retryAfterMs?: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const KEY_PATTERN = /ptl[a-z]_[A-Za-z0-9]+/g;

/** Hapus pola API key dari teks apa pun sebelum ditampilkan/dicatat. */
export function redact(text: string): string {
  return text.replace(KEY_PATTERN, "[disembunyikan]");
}

export function toPublicError(err: unknown): { status: number; body: { error: string; code: string; retryAfterMs?: number } } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: redact(err.message), code: err.code, ...(err.retryAfterMs ? { retryAfterMs: err.retryAfterMs } : {}) },
    };
  }
  return { status: 500, body: { error: "Terjadi kesalahan tak terduga di server aplikasi.", code: "INTERNAL" } };
}
