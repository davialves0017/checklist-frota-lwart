import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return new Response("Não autorizado", { status: 401 });
  if (!env.DB) return new Response("Banco indisponível", { status: 503 });
  const rows = await env.DB.prepare(`SELECT i.inspection_date AS data, i.fleet AS frota, i.plate AS placa, i.checklist_type AS tipo, i.inspector_name AS motorista, i.km, i.problem_count AS totalProblemas, COALESCE(a.action_status, i.action_status) AS situacao, CASE WHEN a.action_plan != '' THEN a.action_plan ELSE i.action_plan END AS plano, CASE WHEN a.action_owner != '' THEN a.action_owner ELSE i.action_owner END AS responsavel, COALESCE(a.action_due_date, i.action_due_date) AS prazo, a.item_number AS item, a.question AS problema, a.comment AS observacao FROM inspections i LEFT JOIN inspection_answers a ON a.inspection_id = i.id AND a.is_problem = 1 ORDER BY i.inspection_date DESC, i.fleet, a.item_number`).all<Record<string, unknown>>();
  const headers = ["Data", "Frota", "Placa", "Tipo", "Motorista", "KM", "Total de problemas", "Situação", "Plano de ação", "Responsável", "Prazo", "Item", "Problema", "Observação"];
  const keys = ["data", "frota", "placa", "tipo", "motorista", "km", "totalProblemas", "situacao", "plano", "responsavel", "prazo", "item", "problema", "observacao"];
  const csv = [headers, ...rows.results.map((row) => keys.map((key) => row[key] ?? ""))].map((row) => row.map(csvCell).join(";")).join("\r\n");
  return new Response(`\uFEFF${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="relatorio-frota.csv"`, "cache-control": "private, no-store" } });
}

function csvCell(value: unknown) { const text = String(value).replace(/"/g, '""'); return `"${text}"`; }
