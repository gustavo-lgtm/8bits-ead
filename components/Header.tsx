"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block h-8 w-8 rounded-lg bg-black" />
          <span>8bits - Plataforma</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link className="hover:underline" href="/painel">Painel</Link>
          <Link className="hover:underline" href="/desbloquear/demo">Desbloquear</Link>
        </nav>
      </div>
    </header>
  );
}
