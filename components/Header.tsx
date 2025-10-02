"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block h-8 w-8 rounded-lg bg-black" />
          <span>8bits - Plataforma</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link className="hover:underline" href="/painel">Painel</Link>
          <Link className="hover:underline" href="/unlock/box-001-minecraft">Unlock</Link>

          {status === "authenticated" ? (
            <>
              <span className="hidden sm:inline text-gray-500">
                {(session.user?.email ?? "").split("@")[0]}
              </span>
              <button
                className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sair
              </button>
            </>
          ) : (
            <button
              className="rounded-lg border px-3 py-1 hover:bg-gray-50"
              onClick={() => signIn(undefined, { callbackUrl: "/painel" })}
            >
              Entrar
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
