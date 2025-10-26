// app/painel/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const session: any = await getServerSession(authOptions as any);
  const user = session?.user;

  return (
    <main className="min-h-dvh bg-white text-neutral-900">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-8">
        <h1 className="text-2xl font-bold">Painel</h1>
        {!user ? (
          <div className="mt-4">
            <p>Você não está logado.</p>
            <Link href="/login" className="text-amber-600 hover:underline">Ir para login</Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p><span className="font-semibold">Usuário:</span> {user.email}</p>
            <p><span className="font-semibold">ID:</span> {user.id}</p>
            <p><span className="font-semibold">Papel:</span> {user.role}</p>
            <div className="flex gap-3">
              <a href="/api/auth/signout" className="rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-sm">Sair</a>
              <Link href="/cursos" className="rounded-lg bg-amber-400 text-white px-3 py-1.5 text-sm">Ir para Projetos</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
