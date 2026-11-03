import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/site/ProjectDetail";
import { EndFooter } from "@/components/site/Sections";
import { publicProjectBySlug, publicProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = publicProjectBySlug((await params).slug);
  if (!p) return { title: "Project tidak ditemukan" };
  return { title: p.title, description: p.summary, openGraph: { title: p.title, description: p.summary } };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = publicProjectBySlug(slug);
  if (!project) notFound();
  const all = publicProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null;
  return (
    <>
      <ProjectDetail project={project} next={next} />
      <EndFooter />
    </>
  );
}
