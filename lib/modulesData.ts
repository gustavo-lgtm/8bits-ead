// lib/modulesData.ts
import { prisma } from "@/lib/db";
import { XPType } from "@prisma/client";

type ModuleItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  posterUrl: string; // 16:9 do card

  // XP do módulo (aluno)
  xpPrimary: number;
  xpOptional: number;

  // Alvos do módulo
  xpTargetPrimary: number;
  xpTargetOptional: number;

  // Badges
  totalRequiredUnits: number;
  completedRequiredUnits: number;
  totalExtraUnits: number;
  completedExtraUnits: number;
};

export type ModulesPageData = {
  course: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
  };
  modules: ModuleItem[];
  selectedIndex: number; // índice do último módulo acessado (fallback 0)
};

function xpCap(u: { xpMode: "FIXED" | "QUIZ_PARTIAL"; xpValue: number | null; xpMax: number | null }) {
  return u.xpMode === "QUIZ_PARTIAL" ? (u.xpMax ?? 0) : (u.xpValue ?? 0);
}

/**
 * Retorna os dados completos para a página de Módulos de um curso.
 */
export async function getModulesPageData(userId: string, courseSlug: string): Promise<ModulesPageData | null> {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: { id: true, slug: true, title: true, description: true },
  });
  if (!course) return null;

  // Regra do curso: extras entram na principal?
  const cfg = await prisma.courseGamificationConfig.findUnique({
    where: { courseId: course.id },
    select: { countExtraInPrimary: true },
  });
  const countExtraInPrimary = cfg?.countExtraInPrimary ?? true;

  // Carrega todos os módulos do curso
  const rawModules = await prisma.module.findMany({
    where: { courseId: course.id },
    orderBy: { sortIndex: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      posterUrl: true, // 🔹 agora vem do banco
    },
  });

  // Para cada módulo, computar targets de XP e saldos do aluno por XPEvent
  const modules: ModuleItem[] = [];
  for (const m of rawModules) {
    const [requiredUnits, extraUnits, optionalUnits] = await Promise.all([
      prisma.unit.findMany({
        where: { moduleId: m.id, isOptional: false, isExtra: false },
        select: { xpMode: true, xpValue: true, xpMax: true },
      }),
      prisma.unit.findMany({
        where: { moduleId: m.id, isOptional: false, isExtra: true },
        select: { xpMode: true, xpValue: true, xpMax: true },
      }),
      prisma.unit.findMany({
        where: { moduleId: m.id, isOptional: true },
        select: { xpMode: true, xpValue: true, xpMax: true },
      }),
    ]);

    const requiredCap = requiredUnits.reduce((acc, u) => acc + xpCap(u), 0);
    const extraCap = extraUnits.reduce((acc, u) => acc + xpCap(u), 0);
    const optionalCap = optionalUnits.reduce((acc, u) => acc + xpCap(u), 0);

    const xpTargetPrimary = requiredCap + (countExtraInPrimary ? extraCap : 0);
    const xpTargetOptional = optionalCap;

    // Somas por eventos de XP no escopo do módulo (enum, não string)
    const events = await prisma.userXPEvent.groupBy({
      by: ["xpType"],
      where: { userId, courseId: course.id, moduleId: m.id },
      _sum: { xp: true },
    });
    const sum = (typ: XPType) => events.find((e) => e.xpType === typ)?._sum.xp ?? 0;

    const xpMandatory = sum(XPType.MANDATORY);
    const xpExtra = sum(XPType.EXTRA);
    const xpOptional = sum(XPType.OPTIONAL);

    const xpPrimary = xpMandatory + (countExtraInPrimary ? xpExtra : 0);

    // Concluídas (progress)
    const [completedRequiredUnits, completedExtraUnits] = await Promise.all([
      prisma.userUnitProgress.count({
        where: { userId, status: "COMPLETED", unit: { moduleId: m.id, isOptional: false, isExtra: false } },
      }),
      prisma.userUnitProgress.count({
        where: { userId, status: "COMPLETED", unit: { moduleId: m.id, isOptional: false, isExtra: true } },
      }),
    ]);

    modules.push({
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description ?? "",
      // usa o banco; se vazio, cai para arquivo em /public/images/modules/<slug>.jpg
      posterUrl: m.posterUrl ?? `/images/modules/${m.slug}.jpg`,
      xpPrimary,
      xpOptional,
      xpTargetPrimary,
      xpTargetOptional,
      totalRequiredUnits: requiredUnits.length,
      completedRequiredUnits,
      totalExtraUnits: extraUnits.length,
      completedExtraUnits,
    });
  }

  // Último módulo acessado (pega o mais recente lastViewedAt do usuário no curso)
  const last = await prisma.userUnitProgress.findFirst({
    where: { userId, unit: { module: { courseId: course.id } } },
    orderBy: { lastViewedAt: "desc" },
    select: { unit: { select: { moduleId: true } } },
  });

  const idx = last ? modules.findIndex((m) => m.id === last.unit.moduleId) : 0;

  return {
    course,
    modules,
    selectedIndex: idx >= 0 ? idx : 0,
  };
}
