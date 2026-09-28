import { ArrowLeft, BarChart3 } from "lucide-react";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[#c9dce6] bg-[#12345a] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <a href="/" className="flex items-center gap-3" aria-label="Voltar para a tela inicial"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><BarChart3 /></div><div><p className="text-sm font-semibold text-[#75d5e7]">Gestão de frota</p><h1 className="text-xl font-bold">Inspeção de frota</h1></div></a>
          <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10"><ArrowLeft className="h-4 w-4" />Check-list</a>
        </div>
      </header>
      <DashboardClient />
    </main>
  );
}
