import { LegalPage } from "@/components/legal";

export const metadata = { title: "Syarat Layanan" };

export default function Terms() {
  return (
    <LegalPage
      title="Syarat Layanan"
      updated="3 November 2026"
      sections={[
        ["Penerimaan", "Dengan membuat akun atau memakai API FxB RestApi kamu menyetujui syarat ini."],
        ["Penggunaan yang diizinkan", "Kamu bertanggung jawab atas konten yang kamu proses. Dilarang memakai layanan untuk: melanggar hak cipta atau ketentuan platform asal konten, mengunduh konten privat tanpa izin, spam, penipuan, mengumpulkan data pribadi orang lain, atau aktivitas ilegal lainnya. Endpoint profil hanya menampilkan informasi publik."],
        ["API key & limit", "Key bersifat pribadi; jangan dibagikan. Kami dapat menangguhkan key/akun yang menyalahgunakan layanan atau mencoba melewati rate limit."],
        ["Premium & pembayaran", "Paket premium berlaku sesuai masa aktif yang tertera dan aktif setelah pembayaran terverifikasi. Perpanjangan menambah sisa masa aktif. Pembayaran yang sudah diverifikasi tidak dapat dikembalikan kecuali layanan tidak dapat diberikan karena kesalahan kami."],
        ["Ketersediaan", "Sebagian endpoint bergantung pada penyedia pihak ketiga yang dapat berubah atau berhenti sewaktu-waktu. Kami berupaya memberi pesan error yang jelas, namun tidak menjamin ketersediaan 100%."],
        ["Perubahan", "Syarat, harga, dan limit dapat berubah. Perubahan harga tidak memengaruhi paket yang sudah dibayar."],
      ]}
    />
  );
}
