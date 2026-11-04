import { EmptyState, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <div className="w-full">
        <EmptyState icon="search" title="Halaman tidak ditemukan" action={<LinkButton href="/">Ke beranda</LinkButton>}>Tautan mungkin salah, sudah kedaluwarsa, atau Anda tidak memiliki akses.</EmptyState>
      </div>
    </div>
  );
}
