import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function PainelPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="min-h-dvh p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-bold">Painel do Aluno</h1>
          <p className="text-sm text-gray-500 mt-2">
            Faça login para ver seus cursos.
          </p>
          <a
            href="/login?callback=%2Fpainel"
            className="inline-block mt-4 rounded-lg bg-black px-4 py-2 text-white"
          >
            Entrar
          </a>
        </div>
      </main>
    );
  }

  const userId = (session.user as any).id as string;
  const enrollments = await prisma.userCourse.findMany({
    where: { userId },
    include: { course: true },
    orderBy: { unlockedAt: "desc" },
  });

  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold">Painel do Aluno</h1>
        <p className="text-sm text-gray-500 mt-2">
          Cursos desbloqueados para {session.user?.email}
        </p>

        {enrollments.length === 0 ? (
          <div className="mt-6 rounded-xl border p-4">
            <div className="font-medium">Nenhum curso desbloqueado ainda</div>
            <p className="text-sm text-gray-500">
              Use o código da sua box em{" "}
              <Link className="underline" href="/unlock/box-001-minecraft">
                Unlock
              </Link>.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enr) => (
              <div key={enr.id} className="rounded-xl border p-4">
                <div className="text-xs uppercase text-gray-500">Projeto</div>
                <div className="font-semibold">{enr.course.title}</div>
                <div className="text-xs mt-1">
                  Slug: <span className="font-medium">{enr.course.slug}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
