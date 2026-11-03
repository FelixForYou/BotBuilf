import Link from "next/link";

export default function NotFound() {
  return (
    <main className="nf">
      <p className="label">(404)</p>
      <h1 className="nf__title">Halaman ini tidak ada.</h1>
      <p>Mungkin project-nya sudah diarsipkan, atau alamatnya salah ketik.</p>
      <Link href="/" className="btn btn--solid"><span>Kembali ke beranda</span></Link>
    </main>
  );
}
