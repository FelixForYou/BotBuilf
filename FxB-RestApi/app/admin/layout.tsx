import { AreaLayout } from "@/components/guard";

export const metadata = { title: "Admin" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AreaLayout area="admin">{children}</AreaLayout>;
}
