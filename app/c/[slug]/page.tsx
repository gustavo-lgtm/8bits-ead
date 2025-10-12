// app/c/[slug]/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

function unitIcon(type: string) {
  if (type === "VIDEO") return "🎬";
  if (type === "DOC") return "📄";
  if (type === "LINK") return "🔗";
  return "📦";
}

export default async function CoursePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const session = await getServerSession(authOptions);

  // userId com fallback por email
  let effectiveUserId = (session?.user as any)?.id as string | undefined;
  if (!effectiveUserId && session?.user?.email) {
    const u = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    effectiveUserId = u?.id;
  }

  const courseRaw = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortIndex: "asc" },
        include: { units: { orderBy: { sortIndex: "asc" } } },
      },
    },
  });
  if (!courseRaw) notFound();
  const course = courseRaw as NonNullable<typeof courseRaw>;

  const unitIds = course.modules.flatMap((m) => m.units.map((u) => u.id));
  const totalUnits = unitIds.length;

  // progresso do usuário
  let completedSet = new Set<string>();
  if (effectiveUserId && totalUnits > 0) {
    const progresses = await prisma.userUnitProgress.findMany({
      where: { userId: effectiveUserId, unitId: { in: unitIds }, status: "COMPLETED" },
      select: { unitId: true },
    });
    completedSet = new Set(progresses.map((p) => p.unitId));
  }

  const completedCount = completedSet.size;
  const pct = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

  function isUnitUnlocked(
    moduleUnits: (typeof course.modules)[number]["units"],
    idx: number
  ) {
    const current = moduleUnits[idx];
    if (!current.requiresCompletedPrevious) return true;
    if (idx === 0) return true;
    const prev = moduleUnits[idx - 1];
    return completedSet.has(prev.id);
  }

  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho da página */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm underline">Início</Link>
          </div>
        </div>

        {/* Barra de progresso (clean) */}
        <div className="mt-5 rounded-2xl border p-4">
          <div className="flex justify-between text-xs mb-1 font-medium text-gray-700">
            <span>Progresso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {completedCount} de {totalUnits} aulas concluídas
          </div>
        </div>

        {/* Módulos e aulas */}
        <div className="mt-8 space-y-8">
          {course.modules.length === 0 ? (
            <div className="text-sm text-gray-500">Este curso ainda não tem módulos.</div>
          ) : (
            course.modules.map((m) => (
              <section key={m.id}>
                <h2 className="text-base md:text-lg font-semibold mb-3">{m.title}</h2>

                {m.units.length === 0 ? (
                  <div className="text-sm text-gray-500">Sem aulas neste módulo.</div>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {m.units.map((u, idx) => {
                      const done = completedSet.has(u.id);
                      const unlocked = isUnitUnlocked(m.units, idx);

                      return (
                        <li
                          key={u.id}
                          className="rounded-2xl border p-4 flex items-center gap-3"
                        >
                          <div className="text-2xl shrink-0">{unitIcon(u.type)}</div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{u.title}</div>
                            <div className="text-xs text-gray-500">
                              {u.durationSec ? `${Math.round(u.durationSec / 60)} min` : "Sem duração"} ·{" "}
                              {u.requiresCompletedPrevious ? "Sequencial" : "Livre"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {unlocked ? (
                              <span
                                aria-label={done ? "concluída" : "pendente"}
                                title={done ? "concluída" : "pendente"}
                              >
                                {done ? "✅" : "⬜"}
                              </span>
                            ) : (
                              <span aria-label="bloqueada" title="bloqueada">🔒</span>
                            )}

                            {unlocked ? (
                              <Link
                                href={`/c/${course.slug}/${m.slug}/${u.slug}`}
                                className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
                              >
                                {done ? "Rever" : "Abrir"}
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">Bloqueada</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
