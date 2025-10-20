// app/c/[slug]/[module]/[unit]/page.tsx
import * as database from "@/lib/db";
import UnitClient from "./UnitClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

type Props = { params: { slug: string; module: string; unit: string } };

export default async function UnitPage({ params }: Props) {
  const { slug: courseSlug, module: moduleSlug, unit: unitSlug } = params;

  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;

  const unit = await prisma.unit.findFirst({
    where: { slug: unitSlug, module: { slug: moduleSlug, course: { slug: courseSlug } } },
    select: {
      id: true, slug: true, title: true, description: true,
      youtubeId: true, thresholdPct: true, xpValue: true,
      isOptional: true, isExtra: true,
      module: { select: { slug: true, title: true, course: { select: { slug: true, title: true } } } },
    },
  });

  if (!unit) {
    return <section className="p-6"><h1 className="text-lg font-semibold">Unidade não encontrada.</h1></section>;
  }

  const unitTypeLabel = unit.isExtra ? "Extra" : unit.isOptional ? "Opcional" : "Obrigatória";
  const unitXP = unit.xpValue ?? 30;

  // progresso inicial do usuário (para abrir corretamente)
  let initialCompleted = false;
  let initialWatchedPct = 0;
  if (userId) {
    const prog = await prisma.userUnitProgress.findUnique({
      where: { userId_unitId: { userId, unitId: unit.id } },
      select: { status: true, completedAt: true, watchedPct: true },
    });
    initialCompleted = Boolean(prog?.completedAt && prog?.status === "COMPLETED");
    initialWatchedPct = Math.max(0, Math.min(100, prog?.watchedPct ?? 0));
  }

  return (
    <section className="p-4 sm:p-6 text-neutral-900">
      <UnitClient
        courseSlug={unit.module.course.slug}
        moduleSlug={unit.module.slug}
        unit={{
          id: unit.id,
          slug: unit.slug,
          title: unit.title,
          description: unit.description ?? "",
          youtubeId: unit.youtubeId,
          thresholdPct: unit.thresholdPct ?? 85,
          unitTypeLabel,
          unitXP,
          courseTitle: unit.module.course.title,
          moduleTitle: unit.module.title,
        }}
        initialCompleted={initialCompleted}
        initialWatchedPct={initialWatchedPct}
      />
    </section>
  );
}
