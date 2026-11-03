import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/site/ProjectDetail";
import { requireAdminPage } from "@/lib/auth";
import { projectById } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview project", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const id = Number((await params).id);
  const project = Number.isInteger(id) ? projectById(id) : null;
  if (!project) notFound();
  return <ProjectDetail project={project} preview />;
}
