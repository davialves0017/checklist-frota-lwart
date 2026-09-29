import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./service-worker-register";

export const metadata: Metadata = {
  title: "Check-list de Frota LWART",
  description: "Inspeções quinzenais e mensais de veículos da frota.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}<ServiceWorkerRegister /></body>
    </html>
  );
}
