import { env } from "cloudflare:workers";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { isAdminRequest } from "@/lib/admin-auth";
import { checklistLabel } from "@/lib/checklists";

type InspectionRow = {
  id: string;
  checklistType: string;
  inspectorName: string;
  inspectionDate: string;
  km: number;
  fleet: string;
  plate: string;
  branch: string;
  photoKey: string;
  signatureKey: string;
  problemCount: number;
};

type AnswerRow = { itemNumber: number; question: string; response: string; comment: string; isProblem: number };

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return new Response("Não autorizado", { status: 401 });
  if (!env.DB || !env.BUCKET) return new Response("Armazenamento indisponível", { status: 503 });

  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return new Response("Mês inválido", { status: 400 });
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = monthNumber === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;
  const result = await env.DB.prepare(`SELECT id, checklist_type AS checklistType, inspector_name AS inspectorName, inspection_date AS inspectionDate, km, fleet, plate, branch, photo_key AS photoKey, signature_key AS signatureKey, problem_count AS problemCount FROM inspections WHERE inspection_date >= ? AND inspection_date < ? ORDER BY inspection_date, created_at`).bind(start, end).all<InspectionRow>();
  if (!result.results.length) return new Response("Nenhum check-list encontrado neste mês", { status: 404 });

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];

  for (const inspection of result.results) {
    const answerResult = await env.DB.prepare(`SELECT item_number AS itemNumber, question, response, comment, is_problem AS isProblem FROM inspection_answers WHERE inspection_id = ? ORDER BY item_number`).bind(inspection.id).all<AnswerRow>();
    let page = pdf.addPage(pageSize);
    let y = drawHeader(page, bold, inspection);
    const info = [
      `Motorista: ${inspection.inspectorName}`,
      `Data: ${formatDate(inspection.inspectionDate)}    Quilometragem: ${Number(inspection.km).toLocaleString("pt-BR")} km`,
      `Frota: ${inspection.fleet}    Placa: ${inspection.plate}    Filial: ${inspection.branch}`,
    ];
    for (const line of info) { page.drawText(safeText(line), { x: 40, y, size: 10.5, font: regular, color: rgb(0.12, 0.22, 0.34) }); y -= 17; }
    y -= 8;

    for (const answer of answerResult.results) {
      const questionLines = wrapText(`${answer.itemNumber}. ${answer.question}`, bold, 10.5, 505);
      const commentLines = answer.comment ? wrapText(`Observação: ${answer.comment}`, regular, 9.5, 505) : [];
      const needed = questionLines.length * 14 + 18 + commentLines.length * 13 + 12;
      if (y - needed < 55) { page = pdf.addPage(pageSize); y = drawHeader(page, bold, inspection); }
      page.drawRectangle({ x: 35, y: y - needed + 7, width: 525, height: needed, color: answer.isProblem ? rgb(1, 0.95, 0.91) : rgb(0.96, 0.98, 0.99), borderColor: answer.isProblem ? rgb(0.76, 0.23, 0.18) : rgb(0.78, 0.85, 0.88), borderWidth: 0.7 });
      for (const line of questionLines) { page.drawText(safeText(line), { x: 45, y, size: 10.5, font: bold, color: rgb(0.07, 0.20, 0.35) }); y -= 14; }
      page.drawText(`Resposta: ${formatResponse(answer.response)}`, { x: 45, y, size: 10, font: regular, color: answer.isProblem ? rgb(0.65, 0.12, 0.12) : rgb(0.14, 0.42, 0.29) }); y -= 15;
      for (const line of commentLines) { page.drawText(safeText(line), { x: 45, y, size: 9.5, font: regular, color: rgb(0.30, 0.25, 0.20) }); y -= 13; }
      y -= 12;
    }

    const mediaPage = pdf.addPage(pageSize);
    drawHeader(mediaPage, bold, inspection);
    mediaPage.drawText("Confirmação do responsável", { x: 40, y: 720, size: 16, font: bold, color: rgb(0.07, 0.20, 0.35) });
    const photoObject = await env.BUCKET.get(inspection.photoKey);
    if (photoObject) await drawR2Image(pdf, mediaPage, photoObject, 40, 395, 250, 300);
    const signatureObject = await env.BUCKET.get(inspection.signatureKey);
    if (signatureObject) await drawR2Image(pdf, mediaPage, signatureObject, 315, 500, 240, 150);
    mediaPage.drawText("Foto do responsável", { x: 40, y: 375, size: 10, font: bold, color: rgb(0.25, 0.35, 0.42) });
    mediaPage.drawText("Assinatura", { x: 315, y: 480, size: 10, font: bold, color: rgb(0.25, 0.35, 0.42) });
    mediaPage.drawText(`Problemas registrados: ${inspection.problemCount}`, { x: 40, y: 330, size: 11, font: bold, color: inspection.problemCount ? rgb(0.65, 0.12, 0.12) : rgb(0.14, 0.42, 0.29) });
  }

  const bytes = await pdf.save();
  return new Response(bytes, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="checklists-${month}.pdf"`, "cache-control": "private, no-store" } });
}

function drawHeader(page: PDFPage, font: PDFFont, inspection: InspectionRow) {
  page.drawRectangle({ x: 0, y: 775, width: 595.28, height: 66.89, color: rgb(0.07, 0.20, 0.35) });
  page.drawText("LWART", { x: 40, y: 806, size: 20, font, color: rgb(0.10, 0.75, 0.86) });
  page.drawText(`CHECK-LIST ${safeText(checklistLabel(inspection.checklistType).toUpperCase())}`, { x: 160, y: 807, size: 16, font, color: rgb(1, 1, 1) });
  return 754;
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safeText(value).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function safeText(value: string) { return value.replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\u00a0/g, " "); }
function formatResponse(value: string) { if (value === "sim") return "Sim"; if (value === "nao") return "Não"; if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(value); return value; }
function formatDate(value: string) { const [dateYear, dateMonth, day] = value.slice(0, 10).split("-"); return `${day}/${dateMonth}/${dateYear}`; }

async function drawR2Image(pdf: PDFDocument, page: PDFPage, object: R2ObjectBody, x: number, y: number, maxWidth: number, maxHeight: number) {
  try {
    const bytes = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType ?? "";
    const image = contentType.includes("png") ? await pdf.embedPng(bytes) : contentType.includes("jpeg") || contentType.includes("jpg") ? await pdf.embedJpg(bytes) : null;
    if (!image) return;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    page.drawImage(image, { x, y, width: image.width * scale, height: image.height * scale });
  } catch { /* O PDF continua disponível mesmo se uma imagem antiga não puder ser incorporada. */ }
}
