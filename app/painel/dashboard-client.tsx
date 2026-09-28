"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, Download, KeyRound, Loader2, LogOut, Search, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { checklistLabel } from "@/lib/checklists";

type Inspection = { id: string; checklistType: string; inspectorName: string; inspectionDate: string; km: number; fleet: string; plate: string; branch: string; photoKey: string; signatureKey: string; totalItems: number; problemCount: number; actionStatus: string; actionPlan: string; actionOwner: string; actionDueDate: string | null; createdAt: string };
type Problem = { inspectionId: string; itemNumber: number; question: string; comment: string; evidenceKey: string | null; fleet: string; plate: string; inspectionDate: string };
type Data = { inspections: Inspection[]; problems: Problem[] };

export function DashboardClient() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<Data>({ inspections: [], problems: [] });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("todos");
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [editing, setEditing] = useState<Inspection | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.status === 401) { setAuthorized(false); return; }
      if (!response.ok) throw new Error("Não foi possível carregar o painel.");
      setData(await response.json()); setAuthorized(true);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setLoginError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error); }
      window.location.reload();
    } catch (error) { setLoginError(error instanceof Error ? error.message : "Login ou senha incorretos."); } finally { setLoading(false); }
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthorized(false); setData({ inspections: [], problems: [] }); }

  const filtered = useMemo(() => data.inspections.filter((item) => {
    const text = `${item.fleet} ${item.plate} ${item.inspectorName} ${item.branch}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (type === "todos" || item.checklistType === type);
  }), [data.inspections, query, type]);
  const uniqueFleets = new Set(data.inspections.map((item) => item.fleet)).size;
  const pending = data.inspections.filter((item) => item.problemCount > 0 && item.actionStatus !== "concluido").length;
  const problemsByInspection = useMemo(() => new Map(data.inspections.map((inspection) => [inspection.id, data.problems.filter((problem) => problem.inspectionId === inspection.id)])), [data]);

  if (authorized === null || (loading && authorized === null)) return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#0b91ad]" /></div>;
  if (!authorized) return <div className="mx-auto max-w-md px-4 py-16"><Card className="border-[#cbdde6] shadow-[0_20px_60px_rgba(18,52,90,.1)]"><CardContent className="p-7"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e3f5f9] text-[#087b93]"><KeyRound /></div><h2 className="mt-5 text-center text-2xl font-bold text-[#12345a]">Acesso administrativo</h2><p className="mt-2 text-center text-[#587083]">Entre com seu login e senha para abrir o painel.</p><form onSubmit={login} className="mt-6 space-y-4"><label><span className="mb-2 block text-sm font-semibold text-[#27465d]">Login</span><Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="Seu login" className="h-12" autoFocus /></label><label><span className="mb-2 block text-sm font-semibold text-[#27465d]">Senha</span><Input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" placeholder="Sua senha" className="h-12" /></label>{loginError && <p className="text-center text-sm font-medium text-[#a2262e]">{loginError}</p>}<Button className="h-12 w-full bg-[#12345a]" disabled={!username.trim() || !password || loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar</Button></form></CardContent></Card></div>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b91ad]">Visão geral</p><h2 className="mt-1 text-3xl font-bold text-[#12345a]">Resultado das inspeções</h2></div><Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sair</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<ClipboardCheck />} label="Check-lists realizados" value={data.inspections.length} tone="blue" /><Metric icon={<Truck />} label="Frotas vistoriadas" value={uniqueFleets} tone="cyan" /><Metric icon={<AlertTriangle />} label="Problemas encontrados" value={data.problems.length} tone="amber" /><Metric icon={<CalendarClock />} label="Planos pendentes" value={pending} tone="red" /></div>

      <Tabs defaultValue="inspections" className="mt-8">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-[#e3edf2] p-1 sm:w-auto"><TabsTrigger value="inspections" className="min-h-10 px-4">Inspeções</TabsTrigger><TabsTrigger value="problems" className="min-h-10 px-4">Problemas e planos</TabsTrigger></TabsList>
        <TabsContent value="inspections" className="mt-5"><Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle>Histórico</CardTitle><div className="flex flex-col gap-3 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b8291]" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar frota, placa ou nome" className="pl-9 sm:w-72" /></div><NativeSelect value={type} onChange={(e) => setType(e.target.value)}><option value="todos">Todos</option><option value="quinzenal">Quinzenal</option><option value="mensal">Mensal</option><option value="troca_caminhao">Troca de caminhão</option></NativeSelect></div></CardHeader><CardContent><div className="grid gap-3">{filtered.length === 0 ? <Empty text="Nenhuma inspeção encontrada." /> : filtered.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="grid gap-3 rounded-xl border border-[#d6e3e9] bg-white p-4 text-left transition hover:border-[#0ba6c7] sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg text-[#12345a]">Frota {item.fleet}</strong><Badge variant="secondary">{checklistLabel(item.checklistType)}</Badge>{item.problemCount > 0 && <Badge variant="destructive">{item.problemCount} problema{item.problemCount > 1 ? "s" : ""}</Badge>}</div><p className="mt-1 text-sm text-[#587083]">{item.plate} · {item.branch} · {item.inspectorName}</p></div><span className="text-sm font-medium text-[#425f72]">{formatDate(item.inspectionDate)}</span><Status status={item.actionStatus} /></button>)}</div></CardContent></Card></TabsContent>
        <TabsContent value="problems" className="mt-5"><div className="grid gap-4">{data.inspections.filter((item) => item.problemCount > 0).length === 0 ? <Card><CardContent className="p-8"><Empty text="Nenhum problema registrado." /></CardContent></Card> : data.inspections.filter((item) => item.problemCount > 0).map((item) => <Card key={item.id} className="overflow-hidden"><CardHeader className="border-b border-[#d8e5ea] bg-[#f8fbfc] sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Frota {item.fleet} · {item.plate}</CardTitle><p className="mt-1 text-sm text-[#587083]">{formatDate(item.inspectionDate)} · {item.problemCount} ocorrência{item.problemCount > 1 ? "s" : ""}</p></div><div className="flex items-center gap-2"><Status status={item.actionStatus} /><Button size="sm" onClick={() => setEditing(item)}>Plano de ação</Button></div></CardHeader><CardContent className="p-5"><div className="space-y-3">{(problemsByInspection.get(item.id) ?? []).map((problem) => <div key={problem.itemNumber} className="rounded-xl border-l-4 border-[#d28a21] bg-[#fff8eb] p-4"><p className="font-semibold text-[#4d3a1f]">Item {problem.itemNumber}: {problem.question}</p><p className="mt-2 text-sm text-[#725735]"><strong>Relato:</strong> {problem.comment || "Registrado por foto."}</p>{problem.evidenceKey && <img src={`/api/media/${problem.evidenceKey}`} alt={`Foto do problema no item ${problem.itemNumber}`} className="mt-3 max-h-72 w-full rounded-lg border object-cover sm:w-80" />}</div>)}</div>{item.actionPlan && <div className="mt-4 rounded-xl bg-[#edf7fa] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#087b93]">Plano atual</p><p className="mt-1 text-[#27465d]">{item.actionPlan}</p><p className="mt-2 text-sm text-[#587083]">Responsável: {item.actionOwner || "Não definido"}{item.actionDueDate ? ` · Prazo: ${formatDate(item.actionDueDate)}` : ""}</p></div>}</CardContent></Card>)}</div></TabsContent>
      </Tabs>
      <InspectionDialog inspection={selected} problems={selected ? problemsByInspection.get(selected.id) ?? [] : []} onClose={() => setSelected(null)} onEdit={(item) => { setSelected(null); setEditing(item); }} />
      <ActionDialog inspection={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />
    </section>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "cyan" | "amber" | "red" }) {
  const colors = { blue: "bg-[#e8eef6] text-[#12345a]", cyan: "bg-[#e1f6fa] text-[#087b93]", amber: "bg-[#fff3dc] text-[#9a6418]", red: "bg-[#ffebec] text-[#a52b33]" };
  return <Card><CardContent className="flex items-center gap-4 p-5"><span className={`grid h-12 w-12 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><div><p className="text-3xl font-bold text-[#12345a]">{value}</p><p className="text-sm text-[#587083]">{label}</p></div></CardContent></Card>;
}
function Status({ status }: { status: string }) { const labels: Record<string, string> = { pendente: "Pendente", em_andamento: "Em andamento", concluido: "Concluído" }; const styles: Record<string, string> = { pendente: "bg-[#fff0df] text-[#8b5a14]", em_andamento: "bg-[#e5f3fb] text-[#17658b]", concluido: "bg-[#e3f5ea] text-[#2d7651]" }; return <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${styles[status] || styles.pendente}`}>{labels[status] || status}</span>; }
function Empty({ text }: { text: string }) { return <div className="py-8 text-center text-[#587083]"><CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-[#9cb4c1]" /><p>{text}</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`)); }

function InspectionDialog({ inspection, problems, onClose, onEdit }: { inspection: Inspection | null; problems: Problem[]; onClose: () => void; onEdit: (inspection: Inspection) => void }) {
  return <Dialog open={!!inspection} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">{inspection && <><DialogHeader><DialogTitle>Frota {inspection.fleet} · {inspection.plate}</DialogTitle><DialogDescription>{checklistLabel(inspection.checklistType)} · {inspection.inspectorName} · {formatDate(inspection.inspectionDate)} · {inspection.km.toLocaleString("pt-BR")} km</DialogDescription></DialogHeader><div className="grid gap-5 sm:grid-cols-2"><div><p className="mb-2 font-semibold text-[#12345a]">Foto do responsável</p><img src={`/api/media/${inspection.photoKey}`} alt={`Foto de ${inspection.inspectorName}`} className="aspect-[4/3] w-full rounded-xl border object-cover" /></div><div><p className="mb-2 font-semibold text-[#12345a]">Assinatura</p><div className="grid aspect-[4/3] place-items-center rounded-xl border bg-white p-4"><img src={`/api/media/${inspection.signatureKey}`} alt="Assinatura do responsável" className="max-h-full max-w-full" /></div></div></div><div><p className="mb-2 font-semibold text-[#12345a]">Problemas encontrados</p>{problems.length ? <div className="space-y-2">{problems.map((problem) => <div className="rounded-lg bg-[#fff6e8] p-3 text-sm" key={problem.itemNumber}><strong>Item {problem.itemNumber}</strong><p className="mt-1">{problem.comment || "Registrado por foto."}</p>{problem.evidenceKey && <img src={`/api/media/${problem.evidenceKey}`} alt={`Foto do problema no item ${problem.itemNumber}`} className="mt-3 max-h-80 w-full rounded-lg border object-cover" />}</div>)}</div> : <p className="rounded-lg bg-[#eaf7ef] p-3 text-sm text-[#2d7651]">Nenhum problema informado.</p>}</div><div className="flex flex-col gap-3 sm:flex-row"><Button variant="outline" asChild><a href={`/api/inspections/${inspection.id}/pdf`} download><Download className="mr-2 h-4 w-4" />Baixar PDF</a></Button><Button onClick={() => onEdit(inspection)} disabled={!inspection.problemCount}>Abrir plano de ação</Button></div></>}</DialogContent></Dialog>;
}

function ActionDialog({ inspection, onClose, onSaved }: { inspection: Inspection | null; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState("pendente");
  const [plan, setPlan] = useState("");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (inspection) { setStatus(inspection.actionStatus); setPlan(inspection.actionPlan); setOwner(inspection.actionOwner); setDueDate(inspection.actionDueDate ?? ""); } }, [inspection]);
  async function save() { if (!inspection) return; setSaving(true); try { const response = await fetch(`/api/inspections/${inspection.id}/action`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, plan, owner, dueDate: dueDate || null }) }); if (!response.ok) throw new Error(); await onSaved(); } finally { setSaving(false); } }
  return <Dialog open={!!inspection} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>Plano de ação</DialogTitle><DialogDescription>{inspection ? `Frota ${inspection.fleet} · ${inspection.problemCount} ocorrência(s)` : ""}</DialogDescription></DialogHeader><div className="space-y-4"><label><span className="mb-2 block text-sm font-semibold">Situação</span><NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}><option value="pendente">Pendente</option><option value="em_andamento">Em andamento</option><option value="concluido">Concluído</option></NativeSelect></label><label><span className="mb-2 block text-sm font-semibold">Ação a realizar</span><Textarea value={plan} onChange={(e) => setPlan(e.target.value)} className="min-h-28" placeholder="Descreva a correção e os próximos passos" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Responsável</span><Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Nome" /></label><label><span className="mb-2 block text-sm font-semibold">Prazo</span><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label></div><Button onClick={save} disabled={saving || !plan.trim()} className="h-11 w-full bg-[#12345a]">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar plano</Button></div></DialogContent></Dialog>;
}
