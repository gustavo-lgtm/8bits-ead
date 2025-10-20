// lib/unitsData.ts
import { prisma } from "@/lib/db";
import { XPMode, XPType } from "@prisma/client";

type UnitItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  posterUrl: string | null;

  // flags
  isExtra: boolean;
  isOptional: boolean;
  completed: boolean;

  // XP por unidade (para a barra da unidade)
  xpPrimary: number;        // ganho pelo aluno que conta na trilha principal
  xpTargetPrimary: number;  // alvo da trilha principal (0 se opcional)

  // opcionalmente, se quiser usar depois
  // xpOptional?: number;
  // xpTargetOptional?: number;
};

export type UnitsPageData = {
  course: { id: string; slug: string; title: string };
  module: { id: string; slug: string; title: string };
  units: UnitItem[];
  selectedIndex: number;
};

function xpCap(u: { xpMode: XPMode; xpValue: number | null; xpMax: number | null }) {
  return u.xpMode === "QUIZ_PARTIAL" ? (u.xpMax ?? 0) : (u.xpValue ?? 0);
}

/**
 * Dados para a página de lista de unidades de um módulo.
 * Importante: soma XP da UNIDADE por `unitId` (eventos de unidade),
 * respeitando a regra da trilha principal (MANDATORY/EXTRA contam; OPTIONAL não).
 */
export async function getUnitsPageData(
  userId: string,
  courseSlug: string,
  moduleSlug: string
): Promise<UnitsPageData | null> {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: { id: true, slug: true, title: true },
  });
  if (!course) return null;

  const mod = await prisma.module.findFirst({
    where: { slug: moduleSlug, courseId: course.id },
    select: {
      id: true,
      slug: true,
      title: true,
      units: {
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
      },
    },
  });
  if (!mod) return null;

  // progresso do usuário para marcar "completed" e descobrir selectedIndex
  const progresses = await prisma.userUnitProgress.findMany({
    where: { userId, unitId: { in: mod.units.map((u) => u.id) } },
    select: { unitId: true, status: true, lastViewedAt: true, completedAt: true },
    orderBy: { lastViewedAt: "desc" },
  });

  const completedSet = new Set(
    progresses.filter((p) => p.status === "COMPLETED").map((p) => p.unitId)
  );

  const lastViewedUnitId = progresses[0]?.unitId ?? null;

  // Somar XP por unidade: eventos logados com unitId
  // (no teu fluxo, os eventos de unidade têm courseId + unitId; moduleId pode ser null).
  const unitEvents = await prisma.userXPEvent.findMany({
    where: {
      userId,
      unitId: { in: mod.units.map((u) => u.id) },
      xpType: { in: [XPType.MANDATORY, XPType.EXTRA] }, // apenas o que conta na trilha principal
    },
    select: { unitId: true, xp: true, xpType: true },
  });

  const xpByUnit: Record<string, number> = {};
  for (const e of unitEvents) {
    const key = e.unitId!;
    xpByUnit[key] = (xpByUnit[key] ?? 0) + e.xp;
  }

  const units: UnitItem[] = mod.units.map((u) => {
    const cap = xpCap(u); // teto da própria unidade
    const isOptional = !!u.isOptional;
    const isExtra = !!u.isExtra;

    // alvo da trilha principal desta unidade:
    const targetPrimary = isOptional ? 0 : cap;

    // ganho do aluno que conta na trilha principal:
    // (se a unidade é OPTIONAL, o ganho vai para trilha opcional — aqui fica 0)
    const gainedPrimary = isOptional ? 0 : (xpByUnit[u.id] ?? 0);

    return {
      id: u.id,
      slug: u.slug,
      title: u.title,
      description: u.description ?? "",
      posterUrl: u.posterUrl ?? `/images/units/${u.slug}.jpg`,
      isExtra,
      isOptional,
      completed: completedSet.has(u.id),
      xpPrimary: gainedPrimary,
      xpTargetPrimary: targetPrimary,
    };
  });

  const selectedIndex =
    lastViewedUnitId ? Math.max(0, units.findIndex((x) => x.id === lastViewedUnitId)) : 0;

  return {
    course: { id: course.id, slug: course.slug, title: course.title },
    module: { id: mod.id, slug: mod.slug, title: mod.title },
    units,
    selectedIndex,
  };
}
