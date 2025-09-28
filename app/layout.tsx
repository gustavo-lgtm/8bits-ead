import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/Header"; // <- relativo ao arquivo

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "8bits - Plataforma",
  description: "Plataforma EAD gamificada da 8bits",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Header />
        <div className="min-h-dvh">{children}</div>
      </body>
    </html>
  );
}
