import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChecklist } from "@/lib/checklists";
import { normalizeDriverName } from "@/lib/drivers";
import { fleetByNumber } from "@/lib/fleets";

type SubmittedAnswer = { itemNumber: number; response: string; comment?: string };
type Payload = { checklistType: string; inspectorName: string; inspectionDate: string; km: number; fleet: string; plate: string; branch: string; answers: SubmittedAnswer[] };

export async function POST(request: Request) {
  if (!env.DB || !env.BUCKET) return NextResponse.json({ error: "Armazenamento indisponível." }, { status: 503 });
  const form = await request.formData();
  const photo = form.get("photo");
  const signature = form.get("signature");
  let payload: Payload;
  try { payload = JSON.parse(String(form.get("payload"))); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const items = getChecklist(payload.checklistType);
  if (!["quinzenal", "mensal", "troca_caminhao"].includes(payload.checklistType) || !payload.inspectorName?.trim() || !payload.fleet?.trim() || !payload.plate?.trim() || !payload.branch?.trim() || !payload.inspectionDate || !Number.isFinite(Number(payload.km))) return NextResponse.json({ error: "Preencha a identificação da inspeção." }, { status: 400 });
  const vehicle = fleetByNumber.get(payload.fleet.trim());
  if (!vehicle) return NextResponse.json({ error: "Selecione uma frota cadastrada." }, { status: 400 });
  if (!(photo instanceof File) || !(signature instanceof File) || photo.size === 0 || signature.size === 0) return NextResponse.json({ error: "Foto e assinatura são obrigatórias." }, { status: 400 });
  if (photo.size > 8_000_000 || signature.size > 2_000_000) return NextResponse.json({ error: "Uma das imagens é muito grande." }, { status: 413 });
  if (payload.answers.length !== items.length || items.some((item) => !payload.answers.find((answer) => answer.itemNumber === item.number)?.response)) return NextResponse.json({ error: "Responda todos os itens." }, { status: 400 });

  const issuePhotos = new Map<number, File>();
  for (const item of items) {
    const file = form.get(`itemPhoto_${item.number}`);
    if (file instanceof File && file.size > 0) {
      if (file.size > 8_000_000) return NextResponse.json({ error: `A foto do item ${item.number} é muito grande.` }, { status: 413 });
      issuePhotos.set(item.number, file);
    }
    const answer = payload.answers.find((candidate) => candidate.itemNumber === item.number);
    const problemResponse = item.problemResponse ?? "nao";
    if (!item.kind && answer?.response === problemResponse && !answer.comment?.trim() && !issuePhotos.has(item.number)) return NextResponse.json({ error: `Adicione uma foto ou observação no item ${item.number}.` }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const photoKey = `inspections/${id}/photo.jpg`;
  const signatureKey = `inspections/${id}/signature.png`;
  const now = new Date().toISOString();
  const answers = items.map((item) => {
    const submitted = payload.answers.find((answer) => answer.itemNumber === item.number)!;
    return { ...submitted, question: item.question, isProblem: item.kind ? false : submitted.response === (item.problemResponse ?? "nao"), evidenceKey: issuePhotos.has(item.number) ? `inspections/${id}/items/${item.number}` : null };
  });
  const problemCount = answers.filter((answer) => answer.isProblem).length;

  try {
    await Promise.all([
      env.BUCKET.put(photoKey, await photo.arrayBuffer(), { httpMetadata: { contentType: photo.type || "image/jpeg" } }),
      env.BUCKET.put(signatureKey, await signature.arrayBuffer(), { httpMetadata: { contentType: signature.type || "image/png" } }),
      ...answers.flatMap((answer) => {
        const issuePhoto = issuePhotos.get(answer.itemNumber);
        return issuePhoto && answer.evidenceKey ? [issuePhoto.arrayBuffer().then((buffer) => env.BUCKET!.put(answer.evidenceKey!, buffer, { httpMetadata: { contentType: issuePhoto.type || "image/jpeg" } }))] : [];
      }),
    ]);
    const statements = [
      env.DB.prepare(`INSERT INTO inspections (id, checklist_type, inspector_name, inspection_date, km, fleet, plate, branch, photo_key, signature_key, total_items, problem_count, action_status, action_plan, action_owner, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?)`).bind(id, payload.checklistType, normalizeDriverName(payload.inspectorName), payload.inspectionDate, Number(payload.km), vehicle.fleet, vehicle.plate, "Goiânia", photoKey, signatureKey, items.length, problemCount, problemCount > 0 ? "pendente" : "executado", now),
      env.DB.prepare(`INSERT OR IGNORE INTO drivers (name, created_at) VALUES (?, ?)`).bind(normalizeDriverName(payload.inspectorName), now),
      ...answers.map((answer) => env.DB!.prepare(`INSERT INTO inspection_answers (inspection_id, item_number, question, response, comment, evidence_key, is_problem) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, answer.itemNumber, answer.question, answer.response, answer.comment?.trim() ?? "", answer.evidenceKey, answer.isProblem ? 1 : 0)),
    ];
    await env.DB.batch(statements);
    return NextResponse.json({ id, problemCount });
  } catch (error) {
    await Promise.allSettled([env.BUCKET.delete(photoKey), env.BUCKET.delete(signatureKey), ...answers.flatMap((answer) => answer.evidenceKey ? [env.BUCKET!.delete(answer.evidenceKey)] : [])]);
    console.error("inspection_save_failed", error);
    return NextResponse.json({ error: "Não foi possível salvar. Tente novamente." }, { status: 500 });
  }
}
