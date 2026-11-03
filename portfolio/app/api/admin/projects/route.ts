import { adminRoute, readJson } from "@/lib/api";
import { createProject, projectInputSchema } from "@/lib/projects";

export const POST = adminRoute(async (req) => {
  const input = projectInputSchema.parse(await readJson(req));
  const project = createProject(input);
  return Response.json({ project }, { status: 201 });
});
