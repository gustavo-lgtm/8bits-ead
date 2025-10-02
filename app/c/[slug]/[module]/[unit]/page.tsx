import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
              <a href={`/login?callback=${callback}`} className="rounded-lg bg-black px-4 py-2 text-white">
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
              <Link href={`/unlock/${slug}`} className="rounded-lg bg-black px-4 py-2 text-white">
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

  // 5) Conteúdo da unit — tipamos explicitamente como non-null
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
          <a href={u.url} target="_blank" rel="noopener noreferrer" className="underline font-medium">
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

        <UnitBody unit={unitRec} />

        <div className="mt-6 text-sm text-gray-500">
          {unitRec.durationSec ? `${Math.round(unitRec.durationSec / 60)} min` : "Sem duração definida"}
          {" · "}
          {unitRec.requiresCompletedPrevious ? "Sequencial" : "Livre"}
        </div>
      </div>
    </main>
  );
}
