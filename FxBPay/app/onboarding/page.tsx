import { requireUser } from "@/lib/auth/session";
import { Onboarding } from "./onboarding";
export default async function Page() {
  const { user } = await requireUser();
  return <Onboarding name={user.name.split(" ")[0]} />;
}
