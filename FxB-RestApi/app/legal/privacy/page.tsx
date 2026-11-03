import { LegalPage } from "@/components/legal";

export const metadata = { title: "Kebijakan Privasi" };

export default function Privacy() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      updated="3 November 2026"
      sections={[
        ["Data yang kami simpan", "• Akun: nama, email, hash password (scrypt).\n• API key: hanya hash SHA-256 dan prefix 10 karakter.\n• Log request: endpoint, status, latensi, waktu, dan hash IP (bukan IP mentah). Parameter request (mis. URL atau teks prompt) tidak disimpan di log.\n• Order: paket, nominal, status, dan referensi transaksi dari payment gateway."],
        ["Data yang tidak kami simpan", "Detail kartu, nomor rekening, atau kredensial e-wallet tidak pernah melewati server kami — pembayaran diproses langsung oleh payment gateway (Midtrans/Xendit)."],
        ["Pihak ketiga", "Beberapa endpoint meneruskan parameter ke penyedia eksternal yang tercantum di dokumentasi setiap endpoint (mis. penyedia AI, downloader, cuaca). Kebijakan privasi penyedia tersebut berlaku untuk data yang kamu kirim ke endpoint itu."],
        ["File & short link", "File yang diunggah lewat endpoint upload dan link pendek bersifat publik bagi siapa pun yang memiliki URL-nya. Jangan unggah data sensitif."],
        ["Retensi", "Log request disimpan maksimal 90 hari (dapat diatur). Menghapus akun akan menghapus akun dan seluruh API key; riwayat order disimpan untuk keperluan pembukuan."],
        ["Cookie", "Kami memakai satu cookie sesi httpOnly (fxb_session) untuk login, serta localStorage untuk preferensi tema & bahasa."],
        ["Kontak", "Pertanyaan privasi dapat diajukan kepada pengelola layanan, FELIXIORITY."],
      ]}
    />
  );
}
