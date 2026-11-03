import type { Project } from "@/lib/types";
import { mediaUrl } from "@/lib/types";
import { ProjectArt } from "./ProjectArt";

/** Cover asli bila sudah diunggah admin; kalau belum, ilustrasi antarmuka yang ditandai jelas. */
export function ProjectVisual({
  project, priority = false, showTag = true, className = "",
}: { project: Project; priority?: boolean; showTag?: boolean; className?: string }) {
  if (project.cover) {
    return (
      <div className={`visual ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(project.cover.file)}
          alt={project.cover.alt}
          width={project.cover.width || undefined}
          height={project.cover.height || undefined}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
    );
  }
  return (
    <div className={`visual visual--art ${className}`} role="img" aria-label={`Ilustrasi antarmuka ${project.title}`}>
      <ProjectArt kind={project.previewKind} title={project.title} />
      {showTag && <span className="visual__tag">Ilustrasi project</span>}
    </div>
  );
}
