import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as { status?: string; plan?: string; owner?: string; dueDate?: string | null };
  if (!body.status || !["pendente", "em_andamento", "concluido"].includes(body.status)) return NextResponse.json({ error: "Situação inválida." }, { status: 400 });
  await env.DB.prepare(`UPDATE inspections SET action_status = ?, action_plan = ?, action_owner = ?, action_due_date = ?, action_updated_at = ? WHERE id = ?`).bind(body.status, body.plan?.trim() ?? "", body.owner?.trim() ?? "", body.dueDate || null, new Date().toISOString(), id).run();
  return NextResponse.json({ ok: true });
}
