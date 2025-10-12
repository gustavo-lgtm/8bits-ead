// app/dev/links/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DevLinksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    const callback = encodeURIComponent("/dev/links");
    return (
      <main className="min-h-dvh p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold">Links de desenvolvimento</h1>
          <p className="text-sm text-gray-500 mt-2">
            Faça login para ver os cursos e navegar pelas aulas.
          </p>
          <div className="mt-4">
            <a
              href={`/login?callback=${callback}`}
              className="rounded-lg bg-black px-4 py-2 text-white"
            >
              Fazer login
            </a>
          </div>
        </div>
      </main>
    );
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      modules: {
        orderBy: { sortIndex: "asc" },
        include: { units: { orderBy: { sortIndex: "asc" } } },
      },
    },
  });

  return (
    <main className="min-h-dvh p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Links de desenvolvimento</h1>
        <p className="text-sm text-gray-500 mt-2">
          Atalho temporário para navegar até cursos, módulos e aulas.
        </p>

        <div className="mt-6 space-y-6">
          {courses.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhum curso cadastrado.
            </div>
          ) : (
            courses.map((c) => (
              <div key={c.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.title}</div>
                  <Link href={`/c/${c.slug}`} className="text-sm underline">
                    Abrir página do curso
                  </Link>
                </div>

                <ul className="mt-3 space-y-3">
                  {c.modules.map((m) => (
                    <li key={m.id} className="rounded-lg border p-3">
                      <div className="font-medium">{m.title}</div>
                      {m.units.length === 0 ? (
                        <div className="text-sm text-gray-500 mt-1">
                          Sem aulas neste módulo.
                        </div>
                      ) : (
                        <ul className="mt-2 space-y-1">
                          {m.units.map((u) => (
                            <li key={u.id} className="flex items-center justify-between">
                              <span className="text-sm">{u.title}</span>
                              <Link
                                href={`/c/${c.slug}/${m.slug}/${u.slug}`}
                                className="text-sm underline"
                              >
                                Abrir aula
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
