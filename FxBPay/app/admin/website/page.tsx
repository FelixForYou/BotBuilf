import { getSetting } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/client";

export default async function Website() {
  const b = await getSetting("branding");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Website & branding" />
      <Card>
        <ActionForm action="/api/admin/settings/branding" submit="Simpan" success="Pengaturan website disimpan">
          <div><label className="label" htmlFor="siteName">Nama situs</label><input id="siteName" name="siteName" className="input" defaultValue={b.siteName} /></div>
          <div><label className="label" htmlFor="tagline">Tagline</label><input id="tagline" name="tagline" className="input" defaultValue={b.tagline} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="supportEmail">Email bantuan</label><input id="supportEmail" name="supportEmail" type="email" className="input" defaultValue={b.supportEmail} /></div>
            <div><label className="label" htmlFor="supportPhone">Telepon bantuan</label><input id="supportPhone" name="supportPhone" className="input" defaultValue={b.supportPhone} /></div>
          </div>
          <div><label className="label" htmlFor="footerNote">Catatan footer</label><input id="footerNote" name="footerNote" className="input" defaultValue={b.footerNote} /></div>
          <div><label className="label" htmlFor="maintenanceBanner">Banner pengumuman (kosongkan untuk menyembunyikan)</label><input id="maintenanceBanner" name="maintenanceBanner" className="input" defaultValue={b.maintenanceBanner} /></div>
          <label className="flex items-center gap-3 rounded-2xl bg-surface p-4 font-semibold"><input type="checkbox" name="registrationOpen" defaultChecked={b.registrationOpen} className="h-5 w-5 accent-[#58dcc5]" />Pendaftaran akun baru dibuka</label>
        </ActionForm>
      </Card>
    </div>
  );
}
