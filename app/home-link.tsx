"use client";

import type { ReactNode } from "react";

export function HomeLink({ children, className }: { children: ReactNode; className?: string }) {
  function openHome() {
    window.localStorage.removeItem("lwart_checklist_draft");
    if ("indexedDB" in window) window.indexedDB.deleteDatabase("lwart-checklist-draft");
  }

  return <a href="/" className={className} aria-label="Voltar para a tela inicial" onClick={openHome}>{children}</a>;
}
