import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Check-list de Frota LWART",
  description: "Inspeções quinzenais e mensais de veículos da frota.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
