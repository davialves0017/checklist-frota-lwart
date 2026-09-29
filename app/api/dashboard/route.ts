import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!env.DB) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
  const inspections = await env.DB.prepare(`SELECT id, checklist_type AS checklistType, inspector_name AS inspectorName, inspection_date AS inspectionDate, km, fleet, plate, branch, photo_key AS photoKey, signature_key AS signatureKey, total_items AS totalItems, problem_count AS problemCount, action_status AS actionStatus, action_plan AS actionPlan, action_owner AS actionOwner, action_due_date AS actionDueDate, created_at AS createdAt FROM inspections ORDER BY created_at DESC LIMIT 500`).all();
  const problems = await env.DB.prepare(`SELECT a.inspection_id AS inspectionId, a.item_number AS itemNumber, a.question, a.comment, a.evidence_key AS evidenceKey, i.fleet, i.plate, i.inspection_date AS inspectionDate FROM inspection_answers a JOIN inspections i ON i.id = a.inspection_id WHERE a.is_problem = 1 ORDER BY i.created_at DESC`).all();
  return NextResponse.json({ inspections: inspections.results, problems: problems.results, currentUser: { username: session.username, role: session.role, canManageUsers: session.canManageUsers } });
}
