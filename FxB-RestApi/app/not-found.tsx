"use client";

import { Compass } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md pt-10">
      <EmptyState icon={Compass} title="Halaman tidak ditemukan" text="Link mungkin salah atau halaman sudah dipindahkan." action={<Button href="/">Ke beranda</Button>} />
    </div>
  );
}
