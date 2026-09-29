import { ClipboardCheck, ShieldCheck } from "lucide-react";
import { ChecklistForm } from "./checklist-form";
import { HomeLink } from "./home-link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[#c9dce6] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <HomeLink className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#12345a] text-white shadow-sm"><ClipboardCheck className="h-6 w-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b91ad]">LWART</p><p className="font-semibold text-[#12345a]">Inspeção de frota</p></div>
          </HomeLink>
          <a href="/painel" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#b8cdd8] bg-white px-4 text-sm font-semibold text-[#12345a] transition hover:border-[#0ba6c7] hover:bg-[#eef9fc]"><ShieldCheck className="h-4 w-4" />Painel</a>
        </div>
      </header>
      <ChecklistForm />
    </main>
  );
}
