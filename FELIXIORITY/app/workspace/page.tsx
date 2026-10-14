import type { Metadata } from "next";
import { Protected } from "@/components/Protected";

export const metadata: Metadata = { title: "Workspace · FELIXIORITY" };

export default function Page() {
  return <Protected page="workspace" />;
}
