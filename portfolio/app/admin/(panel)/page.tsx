import { allProjects } from "@/lib/projects";
import { ProjectTable } from "@/components/admin/ProjectTable";

export const dynamic = "force-dynamic";

export default function AdminHome() {
  return <ProjectTable initial={allProjects()} />;
}
