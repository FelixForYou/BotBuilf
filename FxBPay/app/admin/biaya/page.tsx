import { getSetting } from "@/lib/settings";
import { Card, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { ActionForm } from "@/components/client";

const F = ({ id, label, value, hint }: { id: string; label: string; value: number; hint?: string }) => (
  <div><label className="label" htmlFor={id}>{label}</label><input id={id} name={id} inputMode="numeric" className="input tabular" defaultValue={value} />{hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}</div>
);

export default async function Fees() {
  const [fees, limits] = await Promise.all([getSetting("fees"), getSetting("limits")]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Biaya & limit" subtitle="Perubahan berlaku untuk transaksi baru dan tercatat di audit log." />
      <Notice tone="info">Biaya dihitung dengan bilangan bulat: flat + persen (basis poin, 100 bps = 1%), dibulatkan ke atas ke rupiah penuh, minimal sebesar biaya minimum.</Notice>
      <SectionTitle>Biaya</SectionTitle>
      <Card>
        <ActionForm action="/api/admin/settings/fees" submit="Simpan biaya" success="Biaya disimpan">
          <div className="grid gap-4 sm:grid-cols-3">
            <F id="paymentFlat" label="Biaya flat pembayaran (Rp)" value={fees.paymentFlat} />
            <F id="paymentBps" label="Persentase (bps)" value={fees.paymentBps} hint={`${fees.paymentBps / 100}%`} />
            <F id="paymentMin" label="Biaya minimum (Rp)" value={fees.paymentMin} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <F id="withdrawalFlat" label="Biaya penarikan (Rp)" value={fees.withdrawalFlat} />
            <F id="holdHours" label="Masa tahan saldo (jam)" value={fees.holdHours} hint="0 = langsung tersedia" />
            <div><label className="label" htmlFor="defaultFeeBearer">Default penanggung biaya</label><select id="defaultFeeBearer" name="defaultFeeBearer" className="input" defaultValue={fees.defaultFeeBearer}><option value="merchant">Merchant</option><option value="customer">Pelanggan</option></select></div>
          </div>
        </ActionForm>
      </Card>
      <SectionTitle>Limit</SectionTitle>
      <Card>
        <ActionForm action="/api/admin/settings/limits" submit="Simpan limit" success="Limit disimpan">
          <div className="grid gap-4 sm:grid-cols-2">
            <F id="paymentMin" label="Pembayaran minimum (Rp)" value={limits.paymentMin} />
            <F id="paymentMax" label="Pembayaran maksimum (Rp)" value={limits.paymentMax} />
            <F id="withdrawalMin" label="Penarikan minimum (Rp)" value={limits.withdrawalMin} />
            <F id="withdrawalMax" label="Penarikan maksimum per transaksi (Rp)" value={limits.withdrawalMax} />
            <F id="withdrawalDailyMax" label="Penarikan maksimum harian (Rp)" value={limits.withdrawalDailyMax} />
            <F id="linkMaxHours" label="Masa berlaku link maksimum (jam)" value={limits.linkMaxHours} hint="Dibatasi juga oleh DANA: Sandbox 30 menit, Production 7 hari" />
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
