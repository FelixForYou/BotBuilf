import { Hero } from "@/components/site/Hero";
import { Showcase } from "@/components/site/Showcase";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { About, ContactFooter, EndFooter, Services } from "@/components/site/Sections";
import { publicProjects } from "@/lib/projects";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function Home() {
  const s = getSettings();
  const projects = publicProjects();
  const featured = projects.filter((p) => p.featured);
  return (
    <>
      <Hero eyebrow={s.hero.eyebrow} headline={s.hero.headline} sub={s.hero.sub} />
      <Showcase projects={featured.length ? featured : projects.slice(0, 4)} />
      <ProjectGrid projects={projects} />
      <About about={s.about} />
      <Services services={s.services} />
      <ContactFooter contact={s.contact} socials={s.socials} />
      <EndFooter />
    </>
  );
}
