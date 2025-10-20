// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AppTopBar from "@/components/AppTopBar";

export const metadata: Metadata = {
  title: "8bits Educação",
  description: "Plataforma 8bits",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-neutral-900">
        <AppTopBar />
        {/* O spacer que o AppTopBar injeta já cuida do offset. Aqui só garantimos stacking */}
        <main className="min-h-dvh">{children}</main>
      </body>
    </html>
  );
}
