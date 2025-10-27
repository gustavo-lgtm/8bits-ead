// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AppTopBar from "@/components/AppTopBar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "8bits Educação",
  description: "Plataforma 8bits",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="bg-white text-neutral-900">
        <Providers>
          <AppTopBar />
          <main className="min-h-dvh">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
