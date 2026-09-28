import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await isAdminRequest(request))) return new Response("Não autorizado", { status: 401 });
  if (!env.BUCKET) return new Response("Armazenamento indisponível", { status: 503 });
  const { key } = await params;
  const object = await env.BUCKET.get(key.join("/"));
  if (!object) return new Response("Não encontrado", { status: 404 });
  return new Response(object.body, { headers: { "content-type": object.httpMetadata?.contentType ?? "application/octet-stream", "cache-control": "private, max-age=300" } });
}
