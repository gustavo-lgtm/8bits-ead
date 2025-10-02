import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortIndex: "asc" },
        include: { units: { orderBy: { sortIndex: "asc" } } },
      },
    },
  });

  if (!course) return notFound();

  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
        <p className="text-sm text-gray-500 mt-2">Slug: {course.slug}</p>

        {course.modules.length === 0 ? (
          <div className="mt-6 rounded-xl border p-4">
            <div className="font-medium">Nenhum módulo cadastrado</div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {course.modules.map((m) => (
              <section key={m.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  {m.icon ? (
                    <span className="inline-block h-6 w-6">{m.icon}</span>
                  ) : (
                    <span className="inline-block h-6 w-6 rounded bg-gray-200" />
                  )}
                  <h2 className="text-lg font-semibold">{m.title}</h2>
                </div>

                {m.units.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">
                    Nenhuma aula cadastrada para este módulo.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {m.units.map((u) => (
                      <li
                        key={u.id}
                        className="rounded-lg border p-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div>
                          <Link
                            className="font-medium underline"
                            href={`/c/${course.slug}/${m.slug}/${u.slug}`}
                          >
                            {u.title}
                          </Link>
                          <div className="text-xs text-gray-500">
                            Tipo: {u.type}
                            {u.durationSec ? ` - ${Math.round(u.durationSec / 60)} min` : ""}
                          </div>
                        </div>
                        <span className="text-xs rounded-full border px-2 py-1">
                          {u.requiresCompletedPrevious ? "Sequencial" : "Livre"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
