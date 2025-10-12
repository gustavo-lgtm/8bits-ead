// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "8bits-ead",
  description: "Plataforma 8bits EAD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-gray-900">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
