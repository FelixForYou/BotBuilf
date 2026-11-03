import "server-only";
import { BRAND } from "../brand";
import { catalog, CATEGORIES } from "./registry";

export async function openapi(base: string) {
  const eps = await catalog();
  const paths: Record<string, unknown> = {};
  for (const e of eps) {
    const hasFile = e.params.some((p) => p.type === "file");
    const schemaOf = (p: (typeof e.params)[number]) =>
      p.type === "number" ? { type: "number" } : p.type === "boolean" ? { type: "boolean" } : p.type === "enum" ? { type: "string", enum: p.options } : p.type === "file" ? { type: "string", format: "binary" } : { type: "string", ...(p.max ? { maxLength: p.max } : {}) };
    const op: Record<string, unknown> = {
      tags: [CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category],
      summary: e.name,
      description: `${e.description}\n\n**Tier:** ${e.tier}${e.provider ? ` · **Provider:** ${e.provider}` : ""} · **Status:** ${e.status}`,
      operationId: e.id.replace(/[^a-z0-9]+/gi, "_"),
      security: [{ ApiKeyQuery: [] }, { ApiKeyHeader: [] }],
      responses: {
        "200": e.response === "json"
          ? { description: "Sukses", content: { "application/json": { example: { status: true, creator: BRAND.developer, result: e.example } } } }
          : { description: "Gambar/file", content: { "image/png": { schema: { type: "string", format: "binary" } } } },
        "400": { $ref: "#/components/responses/Error" },
        "401": { $ref: "#/components/responses/Error" },
        "403": { $ref: "#/components/responses/Error" },
        "429": { $ref: "#/components/responses/Error" },
        "503": { $ref: "#/components/responses/Error" },
      },
    };
    if (e.method === "GET") {
      op.parameters = e.params.filter((p) => p.type !== "file").map((p) => ({ name: p.name, in: "query", required: !!p.required, description: p.description, schema: schemaOf(p), example: p.example }));
    } else {
      const props = Object.fromEntries(e.params.map((p) => [p.name, { ...schemaOf(p), description: p.description, example: p.example }]));
      const required = e.params.filter((p) => p.required).map((p) => p.name);
      op.requestBody = {
        required: true,
        content: {
          ...(hasFile ? {} : { "application/json": { schema: { type: "object", properties: props, required } } }),
          "multipart/form-data": { schema: { type: "object", properties: props, required } },
        },
      };
    }
    paths[e.path] = { [e.method.toLowerCase()]: op };
  }
  return {
    openapi: "3.1.0",
    info: { title: BRAND.name, version: BRAND.version, description: `${BRAND.tagline}\n\nDeveloped by ${BRAND.developer}.`, contact: { name: BRAND.developer } },
    servers: [{ url: base }],
    tags: CATEGORIES.map((c) => ({ name: c.name, description: c.description })),
    paths,
    components: {
      securitySchemes: {
        ApiKeyQuery: { type: "apiKey", in: "query", name: "apikey" },
        ApiKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" },
      },
      responses: {
        Error: {
          description: "Error",
          content: { "application/json": { example: { status: false, creator: BRAND.developer, error: { code: "RATE_LIMITED", message: "Limit harian tercapai." } } } },
        },
      },
    },
  };
}
