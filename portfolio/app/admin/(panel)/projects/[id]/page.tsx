import { notFound } from "next/navigation";
import { projectById } from "@/lib/projects";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const project = Number.isInteger(id) ? projectById(id) : null;
  if (!project) notFound();
  return <ProjectEditor project={project} />;
}
