import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return <SettingsForm initial={getSettings()} />;
}
