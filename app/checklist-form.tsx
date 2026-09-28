"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { mensalItems, quinzenalItems } from "@/lib/checklists";
import { SignaturePad } from "./signature-pad";

type ChecklistType = "quinzenal" | "mensal";
type Answer = { itemNumber: number; response: string; comment: string };
const today = new Date().toISOString().slice(0, 10);

export function ChecklistForm() {
  const [type, setType] = useState<ChecklistType | null>(null);
  const [stage, setStage] = useState<"choose" | "identity" | "questions" | "evidence" | "success">("choose");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [identity, setIdentity] = useState({ inspectorName: "", inspectionDate: today, km: "", fleet: "", plate: "", branch: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<Blob | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; problemCount: number } | null>(null);
  const items = type === "mensal" ? mensalItems : quinzenalItems;
  const current = items[questionIndex];
  const currentAnswer = current ? answers[current.number] : undefined;
  const progress = stage === "questions" ? ((questionIndex + 1) / items.length) * 100 : stage === "evidence" || stage === "success" ? 100 : stage === "identity" ? 8 : 0;

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => unknown } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    try {
      void Promise.resolve(context.registerTool({ name: "start_fleet_checklist", title: "Iniciar check-list de frota", description: "Inicia o preenchimento do check-list quinzenal ou mensal na tela.", inputSchema: { type: "object", properties: { type: { type: "string", enum: ["quinzenal", "mensal"] } }, required: ["type"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input: unknown) { const value = (input as { type?: ChecklistType }).type; if (value !== "quinzenal" && value !== "mensal") throw new Error("Tipo inválido"); setType(value); setStage("identity"); return { started: true, type: value }; } }, { signal: controller.signal })).catch(() => undefined);
    } catch { /* O formulário continua funcionando sem WebMCP. */ }
    return () => controller.abort();
  }, []);

  const identityComplete = Object.values(identity).every(Boolean) && Number(identity.km) >= 0;
  const answerComplete = useMemo(() => {
    if (!current || !currentAnswer?.response) return false;
    return !(current.kind !== "date" && current.kind !== "number" && currentAnswer.response === "nao" && !currentAnswer.comment.trim());
  }, [current, currentAnswer]);

  function selectType(value: ChecklistType) { setType(value); setStage("identity"); setAnswers({}); setQuestionIndex(0); }
  function updateAnswer(response: string) { if (!current) return; setAnswers((state) => ({ ...state, [current.number]: { itemNumber: current.number, response, comment: state[current.number]?.comment ?? "" } })); }
  function updateComment(comment: string) { if (!current) return; setAnswers((state) => ({ ...state, [current.number]: { itemNumber: current.number, response: state[current.number]?.response ?? "", comment } })); }
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
      const response = await fetch("/api/inspections", { method: "POST", body: data });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Não foi possível salvar.");
      setResult(json); setStage("success"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); } finally { setSending(false); }
  }

  function restart() { setType(null); setStage("choose"); setAnswers({}); setQuestionIndex(0); setIdentity({ inspectorName: "", inspectionDate: today, km: "", fleet: "", plate: "", branch: "" }); setPhoto(null); setSignature(null); setAccepted(false); setResult(null); }

  return (
    <section className="safe-bottom mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0b91ad]">Inspeção digital</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#12345a] sm:text-4xl">Check-list do veículo</h1></div>{stage !== "choose" && stage !== "success" && <span className="rounded-full bg-[#dff5fa] px-3 py-1.5 text-sm font-bold capitalize text-[#087b93]">{type}</span>}</div>
      {stage !== "choose" && stage !== "success" && <Progress value={progress} className="mb-6 h-2.5 bg-[#dbe7ed] [&>div]:bg-[#0ba6c7]" />}

      {stage === "choose" && <div className="grid gap-4 sm:grid-cols-2">
        <TypeCard title="Quinzenal" description="25 verificações essenciais" onClick={() => selectType("quinzenal")} accent="bg-[#0ba6c7]" />
        <TypeCard title="Mensal" description="49 verificações completas" onClick={() => selectType("mensal")} accent="bg-[#12345a]" />
      </div>}

      {stage === "identity" && <Card className="border-[#cbdde6] shadow-[0_20px_60px_rgba(18,52,90,.08)]"><CardContent className="p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e0f5f9] text-[#087b93]"><Truck /></div><div><h2 className="text-xl font-bold text-[#12345a]">Identificação</h2><p className="text-sm text-[#587083]">Dados do responsável e do veículo</p></div></div><div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome de quem está preenchendo" className="sm:col-span-2"><Input required value={identity.inspectorName} onChange={(e) => setIdentity({ ...identity, inspectorName: e.target.value })} placeholder="Nome completo" /></Field>
        <Field label="Data"><Input type="date" required value={identity.inspectionDate} onChange={(e) => setIdentity({ ...identity, inspectionDate: e.target.value })} /></Field>
        <Field label="Quilometragem"><Input type="number" inputMode="numeric" min="0" required value={identity.km} onChange={(e) => setIdentity({ ...identity, km: e.target.value })} placeholder="Ex.: 125430" /></Field>
        <Field label="Frota"><Input required value={identity.fleet} onChange={(e) => setIdentity({ ...identity, fleet: e.target.value })} placeholder="Número da frota" /></Field>
        <Field label="Placa"><Input required value={identity.plate} onChange={(e) => setIdentity({ ...identity, plate: e.target.value.toUpperCase() })} placeholder="ABC1D23" /></Field>
        <Field label="Filial" className="sm:col-span-2"><Input required value={identity.branch} onChange={(e) => setIdentity({ ...identity, branch: e.target.value })} placeholder="Nome da filial" /></Field>
      </div><NavButtons onBack={previous} onNext={() => { if (identityComplete) { setStage("questions"); setQuestionIndex(0); } }} nextDisabled={!identityComplete} /></CardContent></Card>}

      {stage === "questions" && current && <Card className="overflow-hidden border-[#cbdde6] shadow-[0_20px_60px_rgba(18,52,90,.08)]"><div className="flex items-center justify-between border-b border-[#d6e3e9] bg-[#12345a] px-5 py-4 text-white"><span className="font-semibold">Item {current.number}</span><span className="text-sm text-[#bfeaf2]">{questionIndex + 1} de {items.length}</span></div><CardContent className="p-5 sm:p-8"><h2 className="text-xl font-bold leading-snug text-[#12345a] sm:text-2xl">{current.question}</h2><div className="mt-7">
        {current.kind === "date" ? <Input type="date" className="h-12" value={currentAnswer?.response ?? ""} onChange={(e) => updateAnswer(e.target.value)} /> : current.kind === "number" ? <Input type="number" inputMode="numeric" min="0" className="h-12" placeholder="Informe a quilometragem" value={currentAnswer?.response ?? ""} onChange={(e) => updateAnswer(e.target.value)} /> : <RadioGroup value={currentAnswer?.response ?? ""} onValueChange={updateAnswer} className="grid grid-cols-2 gap-3"><Choice id={`yes-${current.number}`} value="sim" label="Sim" tone="good" /><Choice id={`no-${current.number}`} value="nao" label="Não" tone="bad" /></RadioGroup>}
        {currentAnswer?.response === "nao" && <div className="mt-5 rounded-xl border border-[#efc2c5] bg-[#fff4f4] p-4"><label className="mb-2 block font-semibold text-[#8c252c]">Descreva o problema encontrado</label><Textarea value={currentAnswer.comment} onChange={(e) => updateComment(e.target.value)} placeholder="Informe a irregularidade para o plano de ação" className="min-h-28 bg-white" /><p className="mt-2 text-sm text-[#8c4b4f]">A observação é obrigatória quando a resposta for “Não”.</p></div>}
      </div><NavButtons onBack={previous} onNext={nextQuestion} nextDisabled={!answerComplete} nextLabel={questionIndex === items.length - 1 ? "Ir para assinatura" : "Próximo item"} /></CardContent></Card>}

      {stage === "evidence" && <Card className="border-[#cbdde6] shadow-[0_20px_60px_rgba(18,52,90,.08)]"><CardContent className="space-y-7 p-5 sm:p-8"><div><h2 className="text-2xl font-bold text-[#12345a]">Confirmação</h2><p className="mt-1 text-[#587083]">A foto e a assinatura ficam ligadas a este preenchimento.</p></div><div><label className="mb-2 block font-semibold text-[#12345a]">Foto de quem preencheu</label><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#9db8c7] bg-[#f8fcfd] p-5 text-center transition hover:border-[#0ba6c7]"><Camera className="mb-2 h-7 w-7 text-[#0b91ad]" /><span className="font-semibold text-[#12345a]">{photo ? photo.name : "Abrir câmera ou escolher foto"}</span><span className="mt-1 text-sm text-[#587083]">A imagem será usada para confirmar o responsável.</span><input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label></div><SignaturePad onChange={setSignature} /><label className="flex items-start gap-3 rounded-xl bg-[#eaf4f8] p-4 text-sm leading-relaxed text-[#27465d]"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-[#0b91ad]" /><span>Declaro que as informações prestadas são verdadeiras e estou ciente das responsabilidades previstas no Código de Conduta do Processo de Coleta.</span></label>{error && <p role="alert" className="rounded-xl bg-[#fff0f1] p-3 font-medium text-[#a2262e]">{error}</p>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="outline" className="h-12" onClick={previous} disabled={sending}><ChevronLeft className="mr-2 h-4 w-4" />Voltar</Button><Button className="h-12 bg-[#0b91ad] px-6 hover:bg-[#087b93]" onClick={submit} disabled={!photo || !signature || !accepted || sending}>{sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}Finalizar check-list</Button></div></CardContent></Card>}

      {stage === "success" && <Card className="border-[#b8dfce] bg-white text-center shadow-[0_20px_60px_rgba(18,52,90,.08)]"><CardContent className="p-8 sm:p-12"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e0f5e9] text-[#2f855a]"><CheckCircle2 className="h-11 w-11" /></div><h2 className="mt-6 text-3xl font-bold text-[#12345a]">Check-list enviado</h2><p className="mx-auto mt-3 max-w-md text-[#587083]">A inspeção da frota <strong>{identity.fleet}</strong> foi registrada com segurança.</p>{result && result.problemCount > 0 && <p className="mx-auto mt-4 max-w-md rounded-xl bg-[#fff4e5] p-3 font-semibold text-[#8c5a12]">{result.problemCount} {result.problemCount === 1 ? "problema foi enviado" : "problemas foram enviados"} para o plano de ação.</p>}<Button className="mt-7 h-12 bg-[#12345a] px-6" onClick={restart}>Preencher outro check-list</Button></CardContent></Card>}
    </section>
  );
}

function TypeCard({ title, description, onClick, accent }: { title: string; description: string; onClick: () => void; accent: string }) { return <button type="button" onClick={onClick} className="group overflow-hidden rounded-2xl border border-[#c7dbe5] bg-white text-left shadow-[0_16px_45px_rgba(18,52,90,.07)] transition hover:-translate-y-1 hover:border-[#0ba6c7] hover:shadow-[0_22px_55px_rgba(18,52,90,.13)]"><span className={`block h-2 ${accent}`} /><span className="block p-6"><span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-[#e5f6fa] text-[#0b91ad]"><ClipboardList /></span><span className="block text-2xl font-bold text-[#12345a]">{title}</span><span className="mt-2 block text-[#587083]">{description}</span><span className="mt-6 flex items-center font-semibold text-[#087b93]">Começar <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" /></span></span></button>; }
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={className}><span className="mb-2 block text-sm font-semibold text-[#27465d]">{label}</span>{children}</label>; }
function Choice({ id, value, label, tone }: { id: string; value: string; label: string; tone: "good" | "bad" }) { return <label htmlFor={id} className={`flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 bg-white p-3 text-lg font-bold transition has-[[data-state=checked]]:shadow-sm ${tone === "good" ? "border-[#b8dfce] text-[#2f7554] has-[[data-state=checked]]:border-[#3f9b6d] has-[[data-state=checked]]:bg-[#edf9f2]" : "border-[#efc2c5] text-[#9b2d35] has-[[data-state=checked]]:border-[#c4323b] has-[[data-state=checked]]:bg-[#fff1f2]"}`}><RadioGroupItem id={id} value={value} />{label}</label>; }
function NavButtons({ onBack, onNext, nextDisabled, nextLabel = "Continuar" }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string }) { return <div className="mt-8 flex items-center justify-between gap-3"><Button type="button" variant="ghost" className="h-12" onClick={onBack}><ChevronLeft className="mr-1 h-4 w-4" />Voltar</Button><Button type="button" className="h-12 bg-[#12345a] px-5 hover:bg-[#0b2947]" onClick={onNext} disabled={nextDisabled}>{nextLabel}<ChevronRight className="ml-1 h-4 w-4" /></Button></div>; }
