import { prisma } from "@/lib/db";

/**
 * Soma o "cap" de XP de uma unidade, conforme o modo:
 * - FIXED         => xpValue || 0
 * - QUIZ_PARTIAL  => xpMax   || 0
 */
function xpCap(u: { xpMode: "FIXED" | "QUIZ_PARTIAL"; xpValue: number | null; xpMax: number | null }) {
  return u.xpMode === "QUIZ_PARTIAL" ? (u.xpMax ?? 0) : (u.xpValue ?? 0);
}

export type ProjectRowItem = {
  id: string;
  slug: string;
  title: string;
  description: string;

  posterWideUrl: string;   // 16:9 (card estendido)
  posterNarrowUrl: string; // vertical/estreito

  // 🔹 enums atuais do seu schema
  category: "GAME_DEV" | "ROBOTIC" | "MAKER" | "AI" | "DIGITAL";
  level: "N1" | "N2" | "N3";

  xpPrimary: number;
  xpOptional: number;

  xpTargetPrimary: number;
  xpTargetOptional: number;

  totalRequiredUnits: number;
  completedRequiredUnits: number;
  totalExtraUnits: number;
  completedExtraUnits: number;

  href: string;
};

export async function getProjectsRowItems(userId: string): Promise<ProjectRowItem[]> {
  // Matrículas do usuário (trazendo o curso com os campos necessários)
  const enrollments = await prisma.userCourse.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,       // ⬅️ buscar do banco
          posterWideUrl: true,
          posterNarrowUrl: true,
          category: true,
          level: true,
        },
      },
    },
    orderBy: { unlockedAt: "desc" },
  });

  if (enrollments.length === 0) return [];

  const courseIds = enrollments.map((e) => e.course.id);

  // Saldos
  const balances = await prisma.userXPBalance.findMany({
    where: { userId, courseId: { in: courseIds } },
    select: { courseId: true, xpPrimary: true, xpOptional: true },
  });
  const balanceMap = new Map(balances.map((b) => [b.courseId, b]));

  // Configs por curso
  const configs = await prisma.courseGamificationConfig.findMany({
    where: { courseId: { in: courseIds } },
    select: { courseId: true, countExtraInPrimary: true },
  });
  const cfgMap = new Map(configs.map((c) => [c.courseId, c]));

  // Monta os itens
  const items = await Promise.all(
    enrollments.map(async (e) => {
      const course = e.course;
      const courseId = course.id;
      const countExtraInPrimary = cfgMap.get(courseId)?.countExtraInPrimary ?? true;

      // Carrega units para calcular XP alvo
      const [requiredUnits, extraUnits, optionalUnits] = await Promise.all([
        prisma.unit.findMany({
          where: { module: { courseId }, isOptional: false, isExtra: false },
          select: { xpMode: true, xpValue: true, xpMax: true },
        }),
        prisma.unit.findMany({
          where: { module: { courseId }, isOptional: false, isExtra: true },
          select: { xpMode: true, xpValue: true, xpMax: true },
        }),
        prisma.unit.findMany({
          where: { module: { courseId }, isOptional: true },
          select: { xpMode: true, xpValue: true, xpMax: true },
        }),
      ]);

      const requiredCap = requiredUnits.reduce((acc, u) => acc + xpCap(u), 0);
      const extraCap = extraUnits.reduce((acc, u) => acc + xpCap(u), 0);
      const optionalCap = optionalUnits.reduce((acc, u) => acc + xpCap(u), 0);

      const xpTargetPrimary = requiredCap + (countExtraInPrimary ? extraCap : 0);
      const xpTargetOptional = optionalCap;

      // Contagem de unidades concluídas
      const [completedRequiredUnits, completedExtraUnits] = await Promise.all([
        prisma.userUnitProgress.count({
          where: {
            userId,
            status: "COMPLETED",
            unit: { module: { courseId }, isOptional: false, isExtra: false },
          },
        }),
        prisma.userUnitProgress.count({
          where: {
            userId,
            status: "COMPLETED",
            unit: { module: { courseId }, isOptional: false, isExtra: true },
          },
        }),
      ]);

      const balance = balanceMap.get(courseId);

      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description ?? "",   // ⬅️ vem do banco

        posterWideUrl: course.posterWideUrl ?? "",
        posterNarrowUrl: course.posterNarrowUrl ?? "",

        category: course.category as ProjectRowItem["category"],
        level: course.level as ProjectRowItem["level"],

        xpPrimary: balance?.xpPrimary ?? 0,
        xpOptional: balance?.xpOptional ?? 0,

        xpTargetPrimary,
        xpTargetOptional,

        totalRequiredUnits: requiredUnits.length,
        completedRequiredUnits,
        totalExtraUnits: extraUnits.length,
        completedExtraUnits,

        href: `/c/${course.slug}`,
      } satisfies ProjectRowItem;
    })
  );

  return items;
}
