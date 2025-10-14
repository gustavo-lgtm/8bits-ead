// lib/unitsData.ts
import { prisma } from "@/lib/db";
import { XPType } from "@prisma/client";

type UnitItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  posterUrl: string;

  // flags
  isExtra: boolean;
  isOptional: boolean;

  // XP do aluno (na unidade)
  xpPrimary: number;
  xpOptional: number;

  // alvo (cap) da unidade
  xpTargetPrimary: number;   // FIXED=xpValue | QUIZ_PARTIAL=xpMax
  xpTargetOptional: number;  // sempre 0 aqui (opcional só entra no “opcional” do curso)

  // status (para badges simples)
  completed: boolean;
};

export type UnitsPageData = {
  course: { id: string; slug: string; title: string };
  module: { id: string; slug: string; title: string; description: string | null };
  units: UnitItem[];
  selectedIndex: number;
};

function unitCap(u: { xpMode: "FIXED" | "QUIZ_PARTIAL"; xpValue: number | null; xpMax: number | null }) {
  return u.xpMode === "QUIZ_PARTIAL" ? (u.xpMax ?? 0) : (u.xpValue ?? 0);
}

/** Retorna dados completos para a página de Unidades de um módulo. */
export async function getUnitsPageData(
  userId: string,
  courseSlug: string,
  moduleSlug: string
): Promise<UnitsPageData | null> {
  const mod = await prisma.module.findFirst({
    where: { slug: moduleSlug, course: { slug: courseSlug } },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      course: { select: { id: true, slug: true, title: true } },
    },
  });
  if (!mod) return null;

  // Todas as unidades do módulo (em ordem)
  const rawUnits = await prisma.unit.findMany({
    where: { moduleId: mod.id },
    orderBy: { sortIndex: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      posterUrl: true,
      isExtra: true,
      isOptional: true,
      xpMode: true,
      xpValue: true,
      xpMax: true,
    },
  });

  // Para cada unidade, somar XP do usuário por eventos
  const units: UnitItem[] = [];
  for (const u of rawUnits) {
    const target = unitCap(u);

    // eventos de XP vinculados à unidade
    const grouped = await prisma.userXPEvent.groupBy({
      by: ["xpType"],
      where: { userId, courseId: mod.course.id, moduleId: mod.id, unitId: u.id },
      _sum: { xp: true },
    });
    const sum = (t: XPType) => grouped.find((g) => g.xpType === t)?._sum.xp ?? 0;

    const xpMandatory = sum(XPType.MANDATORY);
    const xpExtra = sum(XPType.EXTRA);
    const xpOptional = sum(XPType.OPTIONAL);

    // Para unidade, “primary” é:
    // - se isOptional=true → 0 (entra no opcional do curso)
    // - senão: MANDATORY + EXTRA (pois extra conta para principal por padrão na unidade)
    const xpPrimary = u.isOptional ? 0 : xpMandatory + xpExtra;

    // Concluída? (pelo progresso)
    const completed = await prisma.userUnitProgress.findUnique({
      where: { userId_unitId: { userId, unitId: u.id } },
      select: { status: true },
    });

    units.push({
      id: u.id,
      slug: u.slug,
      title: u.title,
      description: u.description ?? "",
      posterUrl: u.posterUrl ?? `/images/units/${u.slug}.jpg`,
      isExtra: u.isExtra,
      isOptional: u.isOptional,
      xpPrimary,
      xpOptional,
      xpTargetPrimary: target,
      xpTargetOptional: 0,
      completed: completed?.status === "COMPLETED",
    });
  }

  // Última unidade acessada dentro do módulo
  const last = await prisma.userUnitProgress.findFirst({
    where: { userId, unit: { moduleId: mod.id } },
    orderBy: { lastViewedAt: "desc" },
    select: { unitId: true },
  });

  const idx = last ? units.findIndex((x) => x.id === last.unitId) : 0;

  return {
    course: mod.course,
    module: { id: mod.id, slug: mod.slug, title: mod.title, description: mod.description },
    units,
    selectedIndex: idx >= 0 ? idx : 0,
  };
}
