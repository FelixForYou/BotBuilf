import { AreaLayout } from "@/components/guard";

export const metadata = { title: "Dashboard" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AreaLayout area="user">{children}</AreaLayout>;
}
