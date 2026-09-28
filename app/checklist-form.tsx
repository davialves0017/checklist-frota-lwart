"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { checklistLabel, mensalItems, quinzenalItems, trocaCaminhaoItems } from "@/lib/checklists";
import { clearDraftMedia, loadDraftMedia, saveDraftMedia } from "@/lib/checklist-draft";
import { defaultDrivers, normalizeDriverName } from "@/lib/drivers";
import { fleetByNumber, fleetVehicles } from "@/lib/fleets";
import { SignaturePad } from "./signature-pad";

type ChecklistType = "quinzenal" | "mensal" | "troca_caminhao";
type Answer = { itemNumber: number; response: string; comment: string };
type Stage = "choose" | "identity" | "questions" | "evidence" | "success";
type Draft = { type: ChecklistType | null; stage: Stage; questionIndex: number; answers: Record<number, Answer>; identity: { inspectorName: string; inspectionDate: string; km: string; fleet: string; plate: string; branch: string }; rememberName: boolean; accepted: boolean };
const today = new Date().toISOString().slice(0, 10);

export function ChecklistForm() {
  const [type, setType] = useState<ChecklistType | null>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [identity, setIdentity] = useState({ inspectorName: "", inspectionDate: today, km: "", fleet: "", plate: "", branch: "Goiânia" });
  const [rememberName, setRememberName] = useState(true);
  const [savedDrivers, setSavedDrivers] = useState<string[]>([]);
  const [issuePhotos, setIssuePhotos] = useState<Record<number, File | null>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<Blob | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; problemCount: number } | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const items = type === "mensal" ? mensalItems : type === "troca_caminhao" ? trocaCaminhaoItems : quinzenalItems;
  const driverOptions = useMemo(() => [...new Set([...defaultDrivers, ...savedDrivers])].sort((a, b) => a.localeCompare(b, "pt-BR")), [savedDrivers]);
  const current = items[questionIndex];
  const currentAnswer = current ? answers[current.number] : undefined;
  const progress = stage === "questions" ? ((questionIndex + 1) / items.length) * 100 : stage === "evidence" || stage === "success" ? 100 : stage === "identity" ? 8 : 0;

  useEffect(() => {
    const savedName = window.localStorage.getItem("lwart_collector_name");
    const rawDraft = window.localStorage.getItem("lwart_checklist_draft");
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft) as Draft;
        if (draft.type && ["quinzenal", "mensal", "troca_caminhao"].includes(draft.type) && draft.stage !== "success") {
          setType(draft.type); setStage(draft.stage); setQuestionIndex(draft.questionIndex); setAnswers(draft.answers ?? {}); setIdentity({ ...draft.identity, branch: "Goiânia" }); setRememberName(draft.rememberName); setAccepted(draft.accepted);
        }
      } catch { window.localStorage.removeItem("lwart_checklist_draft"); }
    } else if (savedName) setIdentity((value) => ({ ...value, inspectorName: savedName }));
    void loadDraftMedia().then((media) => { if (media) { setPhoto(media.photo); setSignature(media.signature); setIssuePhotos(media.issuePhotos ?? {}); } }).catch(() => undefined).finally(() => setDraftLoaded(true));
    void fetch("/api/drivers").then((response) => response.ok ? response.json() : { drivers: [] }).then((data: { drivers?: string[] }) => setSavedDrivers(data.drivers ?? [])).catch(() => undefined);
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => unknown } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    try {
      void Promise.resolve(context.registerTool({ name: "start_fleet_checklist", title: "Iniciar check-list de frota", description: "Inicia o preenchimento do check-list quinzenal, mensal ou de troca de caminhão.", inputSchema: { type: "object", properties: { type: { type: "string", enum: ["quinzenal", "mensal", "troca_caminhao"] } }, required: ["type"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input: unknown) { const value = (input as { type?: ChecklistType }).type; if (!value || !["quinzenal", "mensal", "troca_caminhao"].includes(value)) throw new Error("Tipo inválido"); setType(value); setStage("identity"); return { started: true, type: value }; } }, { signal: controller.signal })).catch(() => undefined);
    } catch { /* O formulário continua funcionando sem WebMCP. */ }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!draftLoaded || stage === "success") return;
    const draft: Draft = { type, stage, questionIndex, answers, identity, rememberName, accepted };
    window.localStorage.setItem("lwart_checklist_draft", JSON.stringify(draft));
  }, [accepted, answers, draftLoaded, identity, questionIndex, rememberName, stage, type]);

  const selectedVehicle = fleetByNumber.get(identity.fleet.trim());
  const invalidFleet = Boolean(identity.fleet.trim()) && !selectedVehicle;
  const identityComplete = Boolean(identity.inspectorName.trim() && identity.inspectionDate && identity.km !== "" && selectedVehicle && identity.plate === selectedVehicle.plate && identity.branch === "Goiânia" && Number(identity.km) >= 0);
  const answerComplete = useMemo(() => {
    if (!current || !currentAnswer?.response) return false;
    return !(current.kind !== "date" && current.kind !== "number" && currentAnswer.response === (current.problemResponse ?? "nao") && !currentAnswer.comment.trim() && !issuePhotos[current.number]);
  }, [current, currentAnswer, issuePhotos]);

  function selectType(value: ChecklistType) { setType(value); setStage("identity"); setAnswers({}); setIssuePhotos({}); setQuestionIndex(0); setPhoto(null); setSignature(null); setAccepted(false); void clearDraftMedia(); }
  function updateAnswer(response: string) { if (!current) return; setAnswers((state) => ({ ...state, [current.number]: { itemNumber: current.number, response, comment: state[current.number]?.comment ?? "" } })); }
  function updateComment(comment: string) { if (!current) return; setAnswers((state) => ({ ...state, [current.number]: { itemNumber: current.number, response: state[current.number]?.response ?? "", comment } })); }
  function updateFleet(fleet: string) { const vehicle = fleetByNumber.get(fleet.trim()); setIdentity((value) => ({ ...value, fleet, plate: vehicle?.plate ?? "" })); }
  function updateIssuePhoto(itemNumber: number, file: File | null) { const next = { ...issuePhotos, [itemNumber]: file }; setIssuePhotos(next); void saveDraftMedia({ photo, signature, issuePhotos: next }).catch(() => undefined); }
  function updateResponsiblePhoto(file: File | null) { setPhoto(file); void saveDraftMedia({ photo: file, signature, issuePhotos }).catch(() => undefined); }
  function updateSignature(value: Blob | null) { setSignature(value); void saveDraftMedia({ photo, signature: value, issuePhotos }).catch(() => undefined); }
  function startQuestions() { if (!identityComplete) return; const driverName = normalizeDriverName(identity.inspectorName); setIdentity((value) => ({ ...value, inspectorName: driverName })); if (rememberName) window.localStorage.setItem("lwart_collector_name", driverName); else window.localStorage.removeItem("lwart_collector_name"); setStage("questions"); setQuestionIndex(0); }
  function nextQuestion() { if (!answerComplete) return; if (questionIndex === items.length - 1) setStage("evidence"); else setQuestionIndex((value) => value + 1); }
  function previous() { if (stage === "identity") setStage("choose"); else if (stage === "questions" && questionIndex === 0) setStage("identity"); else if (stage === "questions") setQuestionIndex((value) => value - 1); else if (stage === "evidence") { setStage("questions"); setQuestionIndex(items.length - 1); } }

  async function submit() {
    if (!type || !photo || !signature || !accepted) { setError("Tire a foto, faça a assinatura e confirme a declaração."); return; }
    setSending(true); setError("");
    try {
      const data = new FormData();
      data.append("payload", JSON.stringify({ checklistType: type, ...identity, km: Number(identity.km), answers: items.map((item) => answers[item.number]) }));
      data.append("photo", photo, "responsavel.jpg");
      data.append("signature", signature, "assinatura.png");
      for (const item of items) { const issuePhoto = issuePhotos[item.number]; if (answers[item.number]?.response === (item.problemResponse ?? "nao") && issuePhoto) data.append(`itemPhoto_${item.number}`, issuePhoto, issuePhoto.name); }
      const response = await fetch("/api/inspections", { method: "POST", body: data });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Não foi possível salvar.");
      setResult(json); setStage("success"); window.localStorage.removeItem("lwart_checklist_draft"); await clearDraftMedia().catch(() => undefined); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); } finally { setSending(false); }
  }

  function restart() { const savedName = window.localStorage.getItem("lwart_collector_name") ?? ""; window.localStorage.removeItem("lwart_checklist_draft"); void clearDraftMedia(); setType(null); setStage("choose"); setAnswers({}); setIssuePhotos({}); setQuestionIndex(0); setIdentity({ inspectorName: savedName, inspectionDate: today, km: "", fleet: "", plate: "", branch: "Goiânia" }); setPhoto(null); setSignature(null); setAccepted(false); setResult(null); }

  return (
    <section className="safe-bottom mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0b91ad]">Inspeção digital</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#12345a] sm:text-4xl">Check-list do veículo</h1></div>{stage !== "choose" && stage !== "success" && type && <span className="rounded-full bg-[#dff5fa] px-3 py-1.5 text-sm font-bold text-[#087b93]">{checklistLabel(type)}</span>}</div>
      {stage !== "choose" && stage !== "success" && <Progress value={progress} className="mb-6 h-2.5 bg-[#dbe7ed] [&>div]:bg-[#0ba6c7]" />}

      {stage === "choose" && <div className="grid gap-4 sm:grid-cols-3">
        <TypeCard title="Quinzenal" description="25 verificações essenciais" onClick={() => selectType("quinzenal")} accent="bg-[#0ba6c7]" />
        <TypeCard title="Mensal" description="49 verificações completas" onClick={() => selectType("mensal")} accent="bg-[#12345a]" />
        <TypeCard title="Troca de caminhão" description="Entrega e observações" onClick={() => selectType("troca_caminhao")} accent="bg-[#d28a21]" />
      </div>}

      {stage === "identity" && <Card className="border-[#cbdde6] shadow-[0_20px_60px_rgba(18,52,90,.08)]"><CardContent className="p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e0f5f9] text-[#087b93]"><Truck /></div><div><h2 className="text-xl font-bold text-[#12345a]">Identificação</h2><p className="text-sm text-[#587083]">Dados do responsável e do veículo</p></div></div><div className="grid gap-5 sm:grid-cols-2">
        <Field label="Motorista" className="sm:col-span-2"><Input required list="driver-options" value={identity.inspectorName} onChange={(e) => setIdentity({ ...identity, inspectorName: e.target.value.toLocaleUpperCase("pt-BR") })} placeholder="Selecione ou digite o nome" /><datalist id="driver-options">{driverOptions.map((driver) => <option key={driver} value={driver} />)}</datalist><p className="mt-2 text-sm text-[#587083]">Se o nome não estiver na lista, digite o nome completo. Ele será cadastrado ao enviar.</p><label className="mt-3 flex items-center gap-2 text-sm text-[#587083]"><input type="checkbox" checked={rememberName} onChange={(e) => setRememberName(e.target.checked)} className="h-4 w-4 accent-[#0b91ad]" />Lembrar meu nome neste aparelho</label></Field>
        <Field label="Data"><Input type="date" required value={identity.inspectionDate} onChange={(e) => setIdentity({ ...identity, inspectionDate: e.target.value })} /></Field>
        <Field label="Quilometragem"><Input type="number" inputMode="numeric" min="0" required value={identity.km} onChange={(e) => setIdentity({ ...identity, km: e.target.value })} placeholder="Ex.: 125430" /></Field>
        <Field label="Frota"><Input required list="fleet-options" value={identity.fleet} onChange={(e) => updateFleet(e.target.value)} aria-invalid={invalidFleet} placeholder="Digite ou selecione a frota" /><datalist id="fleet-options">{fleetVehicles.map((vehicle) => <option key={vehicle.fleet} value={vehicle.fleet}>{vehicle.plate} · {vehicle.type}</option>)}</datalist>{invalidFleet && <p className="mt-2 text-sm font-semibold text-[#a2262e]">Selecione uma frota cadastrada.</p>}</Field>
        <Field label="Placa"><Input required readOnly value={identity.plate} className="bg-[#eef5f7] font-semibold text-[#27465d]" placeholder="Preenchida pela frota" /></Field>
        <Field label="Filial" className="sm:col-span-2"><Input required readOnly value={identity.branch} className="bg-[#eef5f7] font-semibold text-[#27465d]" /></Field>
      </div><NavButtons onBack={previous} onNext={startQuestions} nextDisabled={!identityComplete} /></CardContent></Card>}

      {stage === "questions" && current && <Card className="overflow-hidden border-[#cbdde6] shadow-[0_20px_60px_rgba(18,52,90,.08)]"><div className="flex items-center justify-between border-b border-[#d6e3e9] bg-[#12345a] px-5 py-4 text-white"><span className="font-semibold">Item {current.number}</span><span className="text-sm text-[#bfeaf2]">{questionIndex + 1} de {items.length}</span></div><CardContent className="p-5 sm:p-8"><h2 className="text-xl font-bold leading-snug text-[#12345a] sm:text-2xl">{current.question}</h2><div className="mt-7">
        {current.kind === "date" ? <Input type="date" className="h-12" value={currentAnswer?.response ?? ""} onChange={(e) => updateAnswer(e.target.value)} /> : current.kind === "number" ? <Input type="number" inputMode="numeric" min="0" className="h-12" placeholder="Informe a quilometragem" value={currentAnswer?.response ?? ""} onChange={(e) => updateAnswer(e.target.value)} /> : <RadioGroup value={currentAnswer?.response ?? ""} onValueChange={updateAnswer} className="grid grid-cols-2 gap-3"><Choice id={`yes-${current.number}`} value="sim" label="Sim" tone="good" /><Choice id={`no-${current.number}`} value="nao" label="Não" tone="bad" /></RadioGroup>}
        {currentAnswer?.response === (current.problemResponse ?? "nao") && <div className="mt-5 rounded-xl border border-[#efc2c5] bg-[#fff4f4] p-4"><p className="font-semibold text-[#8c252c]">Adicione uma foto ou descreva a observação</p><Textarea value={currentAnswer.comment} onChange={(e) => updateComment(e.target.value)} placeholder="Observação para o plano de ação" className="mt-3 min-h-24 bg-white" /><label className="mt-3 flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#d9a8ac] bg-white p-3 text-center text-sm font-semibold text-[#8c252c]"><Camera className="h-5 w-5" />{issuePhotos[current.number]?.name ?? "Tirar ou escolher foto"}<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => updateIssuePhoto(current.number, e.target.files?.[0] ?? null)} /></label><p className="mt-2 text-sm text-[#8c4b4f]">Para continuar, informe pelo menos uma foto ou uma observação.</p></div>}
      </div><NavButtons onBack={previous} onNext={nextQuestion} nextDisabled={!answerComplete} nextLabel={questionIndex === items.length - 1 ? "Ir para assinatura" : "Próximo item"} /></CardContent></Card>}

      {stage === "evidence" && <Card className="border-[#cbdde6] shadow-[0_20px_60px_rgba(18,52,90,.08)]"><CardContent className="space-y-7 p-5 sm:p-8"><div><h2 className="text-2xl font-bold text-[#12345a]">Confirmação</h2><p className="mt-1 text-[#587083]">A foto e a assinatura ficam ligadas a este preenchimento.</p></div><div><label className="mb-2 block font-semibold text-[#12345a]">Foto de quem preencheu</label><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#9db8c7] bg-[#f8fcfd] p-5 text-center transition hover:border-[#0ba6c7]"><Camera className="mb-2 h-7 w-7 text-[#0b91ad]" /><span className="font-semibold text-[#12345a]">{photo ? photo.name : "Abrir câmera ou escolher foto"}</span><span className="mt-1 text-sm text-[#587083]">A imagem será usada para confirmar o responsável.</span><input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => updateResponsiblePhoto(e.target.files?.[0] ?? null)} /></label></div><SignaturePad onChange={updateSignature} />{signature && <p className="-mt-5 text-sm font-semibold text-[#2f7554]">Assinatura salva neste aparelho.</p>}<label className="flex items-start gap-3 rounded-xl bg-[#eaf4f8] p-4 text-sm leading-relaxed text-[#27465d]"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-[#0b91ad]" /><span>Declaro que as informações prestadas são verdadeiras e estou ciente das responsabilidades previstas no Código de Conduta do Processo de Coleta.</span></label>{error && <p role="alert" className="rounded-xl bg-[#fff0f1] p-3 font-medium text-[#a2262e]">{error}</p>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="outline" className="h-12" onClick={previous} disabled={sending}><ChevronLeft className="mr-2 h-4 w-4" />Voltar</Button><Button className="h-12 bg-[#0b91ad] px-6 hover:bg-[#087b93]" onClick={submit} disabled={!photo || !signature || !accepted || sending}>{sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}Finalizar check-list</Button></div></CardContent></Card>}

      {stage === "success" && <Card className="border-[#b8dfce] bg-white text-center shadow-[0_20px_60px_rgba(18,52,90,.08)]"><CardContent className="p-8 sm:p-12"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e0f5e9] text-[#2f855a]"><CheckCircle2 className="h-11 w-11" /></div><h2 className="mt-6 text-3xl font-bold text-[#12345a]">Check-list enviado</h2><p className="mx-auto mt-3 max-w-md text-[#587083]">A inspeção da frota <strong>{identity.fleet}</strong> foi registrada com segurança.</p>{result && result.problemCount > 0 && <p className="mx-auto mt-4 max-w-md rounded-xl bg-[#fff4e5] p-3 font-semibold text-[#8c5a12]">{result.problemCount} {result.problemCount === 1 ? "problema foi enviado" : "problemas foram enviados"} para o plano de ação.</p>}<Button className="mt-7 h-12 bg-[#12345a] px-6" onClick={restart}>Preencher outro check-list</Button></CardContent></Card>}
    </section>
  );
}

function TypeCard({ title, description, onClick, accent }: { title: string; description: string; onClick: () => void; accent: string }) { return <button type="button" onClick={onClick} className="group overflow-hidden rounded-2xl border border-[#c7dbe5] bg-white text-left shadow-[0_16px_45px_rgba(18,52,90,.07)] transition hover:-translate-y-1 hover:border-[#0ba6c7] hover:shadow-[0_22px_55px_rgba(18,52,90,.13)]"><span className={`block h-2 ${accent}`} /><span className="block p-6"><span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-[#e5f6fa] text-[#0b91ad]"><ClipboardList /></span><span className="block text-2xl font-bold text-[#12345a]">{title}</span><span className="mt-2 block text-[#587083]">{description}</span><span className="mt-6 flex items-center font-semibold text-[#087b93]">Começar <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" /></span></span></button>; }
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={className}><span className="mb-2 block text-sm font-semibold text-[#27465d]">{label}</span>{children}</label>; }
function Choice({ id, value, label, tone }: { id: string; value: string; label: string; tone: "good" | "bad" }) { return <label htmlFor={id} className={`flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 bg-white p-3 text-lg font-bold transition has-[[data-state=checked]]:shadow-sm ${tone === "good" ? "border-[#b8dfce] text-[#2f7554] has-[[data-state=checked]]:border-[#3f9b6d] has-[[data-state=checked]]:bg-[#edf9f2]" : "border-[#efc2c5] text-[#9b2d35] has-[[data-state=checked]]:border-[#c4323b] has-[[data-state=checked]]:bg-[#fff1f2]"}`}><RadioGroupItem id={id} value={value} />{label}</label>; }
function NavButtons({ onBack, onNext, nextDisabled, nextLabel = "Continuar" }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string }) { return <div className="mt-8 flex items-center justify-between gap-3"><Button type="button" variant="ghost" className="h-12" onClick={onBack}><ChevronLeft className="mr-1 h-4 w-4" />Voltar</Button><Button type="button" className="h-12 bg-[#12345a] px-5 hover:bg-[#0b2947]" onClick={onNext} disabled={nextDisabled}>{nextLabel}<ChevronRight className="ml-1 h-4 w-4" /></Button></div>; }
