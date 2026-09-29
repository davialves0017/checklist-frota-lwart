import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as { itemNumber?: number; status?: string; plan?: string; owner?: string; dueDate?: string | null };
  if (!Number.isInteger(body.itemNumber) || Number(body.itemNumber) < 1) return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  if (!body.status || !["pendente", "em_andamento", "concluido"].includes(body.status)) return NextResponse.json({ error: "Situação inválida." }, { status: 400 });
  if (!body.plan?.trim() || !body.owner?.trim() || !body.dueDate) return NextResponse.json({ error: "Informe a ação, o responsável e o prazo." }, { status: 400 });
  const now = new Date().toISOString();
  const updated = await env.DB.prepare(`UPDATE inspection_answers SET action_status = ?, action_plan = ?, action_owner = ?, action_due_date = ?, action_updated_at = ?, action_updated_by = ? WHERE inspection_id = ? AND item_number = ? AND is_problem = 1`).bind(body.status, body.plan.trim(), body.owner.trim(), body.dueDate, now, session.username, id, body.itemNumber).run();
  if (!updated.meta.changes) return NextResponse.json({ error: "Problema não encontrado." }, { status: 404 });
  const summary = await env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN action_status = 'concluido' THEN 1 ELSE 0 END) AS concluded, SUM(CASE WHEN action_status = 'em_andamento' THEN 1 ELSE 0 END) AS inProgress FROM inspection_answers WHERE inspection_id = ? AND is_problem = 1`).bind(id).first<{ total: number; concluded: number; inProgress: number }>();
  const aggregateStatus = Number(summary?.total) > 0 && Number(summary?.concluded) === Number(summary?.total) ? "concluido" : Number(summary?.inProgress) > 0 || Number(summary?.concluded) > 0 ? "em_andamento" : "pendente";
  await env.DB.prepare(`UPDATE inspections SET action_status = ?, action_updated_at = ?, action_updated_by = ? WHERE id = ?`).bind(aggregateStatus, now, session.username, id).run();
  return NextResponse.json({ ok: true });
}
