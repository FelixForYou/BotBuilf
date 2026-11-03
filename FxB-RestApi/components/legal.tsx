import { BRAND } from "@/lib/brand";

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string][] }) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-[30px] font-extrabold">{title}</h1>
      <p className="mt-1 text-[14px] text-muted">{BRAND.name} · {BRAND.developer} · Diperbarui {updated}</p>
      <div className="mt-6 space-y-3">
        {sections.map(([h, body]) => (
          <section key={h} className="rounded-[22px] bg-card p-5">
            <h2 className="text-[17px] font-semibold">{h}</h2>
            <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-muted">{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
