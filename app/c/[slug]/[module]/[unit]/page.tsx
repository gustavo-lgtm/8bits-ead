import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UnitProgressClient from "@/components/UnitProgressClient";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string; module: string; unit: string }>;
}) {
  const { slug, module, unit } = await params;

  // 1) Curso
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true },
  });
  if (!course) return notFound();

  // 2) Módulo dentro do curso
  const mod = await prisma.module.findFirst({
    where: { slug: module, courseId: course.id },
    select: { id: true, slug: true, title: true },
  });
  if (!mod) return notFound();

  // 3) Unit dentro do módulo
  const unitRec = await prisma.unit.findFirst({
    where: { slug: unit, moduleId: mod.id },
  });
  if (!unitRec) return notFound(); // daqui pra baixo é garantido non-null

  // 4) Sessão e gate de acesso
  const session = await getServerSession(authOptions);

  if (!session) {
    const callback = encodeURIComponent(`/c/${slug}/${module}/${unit}`);
    return (
      <main className="min-h-dvh p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Módulo: {mod.title} - Aula: {unitRec.title}
          </p>

          <div className="mt-6 rounded-xl border p-4">
            <div className="font-medium">Login necessário</div>
            <p className="text-sm text-gray-500 mt-1">
              Faça login para acessar o conteúdo desta aula.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={`/login?callback=${callback}`}
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Fazer login
              </a>
              <Link href={`/unlock/${slug}`} className="rounded-lg border px-4 py-2">
                Desbloquear curso
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <Link href={`/c/${slug}`} className="underline">
              Voltar para o curso
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const userId = (session.user as any)?.id;
  if (typeof userId !== "string" || !userId) {
    const callback = encodeURIComponent(`/c/${slug}/${module}/${unit}`);
    return (
      <main className="min-h-dvh p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Módulo: {mod.title} - Aula: {unitRec.title}
          </p>
          <div className="mt-6 rounded-xl border p-4">
            <div className="font-medium">Sessão inválida</div>
            <p className="text-sm text-gray-500 mt-1">
              Faça login novamente para continuar.
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
        </div>
      </main>
    );
  }

  const enrolled = await prisma.userCourse.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  });

  if (!enrolled) {
    return (
      <main className="min-h-dvh p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Módulo: {mod.title} - Aula: {unitRec.title}
          </p>

          <div className="mt-6 rounded-xl border p-4">
            <div className="font-medium">Curso bloqueado para sua conta</div>
            <p className="text-sm text-gray-500 mt-1">
              Use o código da sua box para desbloquear este curso.
            </p>
            <div className="mt-4">
              <Link
                href={`/unlock/${slug}`}
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Ir para desbloqueio
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <Link href={`/c/${slug}`} className="underline">
              Voltar para o curso
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 5) Gate sequencial: se a unit exige anterior, checa a imediatamente anterior do mesmo módulo
  if (unitRec.requiresCompletedPrevious) {
    const prevUnit = await prisma.unit.findFirst({
      where: { moduleId: mod.id, sortIndex: { lt: unitRec.sortIndex } },
      orderBy: { sortIndex: "desc" },
      select: { id: true, slug: true, title: true },
    });

    if (prevUnit) {
      const prevCompleted = await prisma.userUnitProgress.findUnique({
        where: { userId_unitId: { userId, unitId: prevUnit.id } },
        select: { status: true },
      });

      if (prevCompleted?.status !== "COMPLETED") {
        // bloqueia acesso e sugere a aula anterior
        return (
          <main className="min-h-dvh p-6 md:p-10">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
              <p className="text-sm text-gray-500 mt-2">
                Módulo: {mod.title} - Aula: {unitRec.title}
              </p>

              <div className="mt-6 rounded-xl border p-4 bg-yellow-50">
                <div className="font-medium">Esta aula está bloqueada</div>
                <p className="text-sm text-gray-700 mt-1">
                  Para acessar, conclua antes: <strong>{prevUnit.title}</strong>.
                </p>
                <div className="mt-4">
                  <Link
                    href={`/c/${slug}/${module}/${prevUnit.slug}`}
                    className="rounded-lg bg-black px-4 py-2 text-white"
                  >
                    Ir para a aula anterior
                  </Link>
                </div>
              </div>

              <div className="mt-6">
                <Link href={`/c/${slug}`} className="underline">
                  Voltar para o curso
                </Link>
              </div>
            </div>
          </main>          
        );
      }
    }
  }

  // 6) Progresso do curso para exibir barra na página da aula
  const [completedCount, totalUnits] = await Promise.all([
    prisma.userUnitProgress.count({
      where: {
        userId,
        status: "COMPLETED",
        unit: { module: { courseId: course.id } },
      },
    }),
    prisma.unit.count({
      where: { module: { courseId: course.id } },
    }),
  ]);
  const pct = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

  // 7) Conteúdo da unit — tipamos explicitamente como non-null
  function UnitBody({ unit: u }: { unit: NonNullable<typeof unitRec> }) {
    if (u.type === "VIDEO" && u.youtubeId) {
      return (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${u.youtubeId}`}
            title={u.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      );
    }

    if (u.type === "DOC" && u.driveFileId) {
      return (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border">
          <iframe
            className="h-full w-full"
            src={`https://drive.google.com/file/d/${u.driveFileId}/preview`}
            title={u.title}
            allow="fullscreen"
          />
        </div>
      );
    }

    if (u.type === "LINK" && u.url) {
      return (
        <div className="mt-4 rounded-xl border p-4">
          <a
            href={u.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Abrir recurso externo
          </a>
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-xl border p-4 text-sm text-gray-500">
        Conteúdo não configurado para esta aula.
      </div>
    );
  }

  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-sm text-gray-500">
          <Link href={`/c/${slug}`} className="underline">
            {course.title}
          </Link>{" "}
          / {mod.title}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mt-1">{unitRec.title}</h1>

        {/* Barra de progresso do curso (topo da Unit) */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Progresso do curso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-black transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {completedCount} de {totalUnits} aulas concluídas
          </div>
        </div>

        <UnitBody unit={unitRec} />

        {/* Progresso da aula: inicia automático e botão para concluir */}
        <UnitProgressClient unitId={unitRec.id} />

        <div className="mt-6 text-sm text-gray-500">
          {unitRec.durationSec
            ? `${Math.round(unitRec.durationSec / 60)} min`
            : "Sem duração definida"}
          {" · "}
          {unitRec.requiresCompletedPrevious ? "Sequencial" : "Livre"}
        </div>
      </div>
    </main>
  );
}
