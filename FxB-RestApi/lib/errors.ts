/** Error dengan kode, pesan aman untuk ditampilkan, dan status HTTP. */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: (msg = "Silakan login terlebih dahulu.") => new AppError("UNAUTHORIZED", msg, 401),
  forbidden: (msg = "Akses ditolak.") => new AppError("FORBIDDEN", msg, 403),
  notFound: (msg = "Data tidak ditemukan.") => new AppError("NOT_FOUND", msg, 404),
  bad: (msg: string, details?: unknown) => new AppError("BAD_REQUEST", msg, 400, details),
  provider: (msg = "Layanan penyedia sedang tidak tersedia. Coba lagi nanti.") => new AppError("PROVIDER_ERROR", msg, 502),
  unavailable: (msg: string) => new AppError("PROVIDER_UNAVAILABLE", msg, 503),
};
