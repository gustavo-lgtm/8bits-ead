// app/api/units/complete/route.ts
import { NextResponse } from "next/server";
import * as database from "@/lib/db"; // funciona se você exportar prisma, db ou default
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ajuste o caminho se o seu auth estiver em outro lugar

// Resolve o client do Prisma, independente do nome de export que você usa em "@/lib/db"
const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

export async function POST(req: Request) {
  // Tipagem flexível para não reclamar de session.user
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const unitId: string | undefined = body?.unitId;
  if (!unitId) {
    return NextResponse.json({ error: "unitId is required" }, { status: 400 });
  }

  // Busca a unidade e relações mínimas
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      id: true,
      slug: true,
      title: true,
      xpValue: true,
      isOptional: true,
      isExtra: true,
      sortIndex: true,
      moduleId: true,
      module: {
        select: {
          id: true,
          slug: true,
          courseId: true,
          course: { select: { id: true, slug: true } },
        },
      },
    },
  });

  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const courseId = unit.module.courseId;
  const moduleId = unit.module.id;

  // Próxima unidade (no mesmo módulo, por sortIndex)
  const nextUnit = await prisma.unit.findFirst({
    where: { moduleId: unit.moduleId, sortIndex: { gt: unit.sortIndex } },
    orderBy: { sortIndex: "asc" },
    select: { slug: true },
  });
  const nextUnitSlug = nextUnit?.slug ?? null;

  // Idempotência por user+unit
  const existing = await prisma.userUnitProgress.findUnique({
    where: { userId_unitId: { userId, unitId: unit.id } },
    select: { completedAt: true },
  });

  if (existing?.completedAt) {
    // Já concluída - não duplica XP
    return NextResponse.json({ awardedXp: 0, nextUnitSlug, streakDelta: 0 });
  }

  // XP da unidade: usa xpValue (default 30, já garantido no schema)
  const awardedXp = unit.xpValue ?? 30;

  // Define tipo de XP conforme suas flags
  // (usando strings para evitar importar enums se der conflito de tipos)
  const xpType =
    unit.isExtra ? "EXTRA" : unit.isOptional ? "OPTIONAL" : "MANDATORY";

  // Marca conclusão em UserUnitProgress
  const now = new Date();
  await prisma.userUnitProgress.upsert({
    where: { userId_unitId: { userId, unitId: unit.id } },
    update: {
      status: "COMPLETED",
      completedAt: now,
      lastViewedAt: now,
    },
    create: {
      userId,
      unitId: unit.id,
      status: "COMPLETED",
      completedAt: now,
      lastViewedAt: now,
    },
  });

  // Cria evento de XP - idempotência garantida pelo @@unique no schema
  try {
    await prisma.userXPEvent.create({
      data: {
        userId,
        courseId,
        moduleId,
        unitId: unit.id,
        eventType: "unit_completed",
        xp: awardedXp,
        xpType, // "MANDATORY" | "EXTRA" | "OPTIONAL"
        meta: { unitSlug: unit.slug, unitTitle: unit.title },
      },
    });
  } catch {
    // Se já existe, ignoramos para não quebrar idempotência
  }

  // Recalcula os saldos materializados
  await upsertAndRecalcBalances(prisma, userId, courseId);

  // Streak diário - placeholder neutro por enquanto
  const streakDelta = 0;

  return NextResponse.json({ awardedXp, nextUnitSlug, streakDelta });
}

// Soma eventos por tipo e atualiza UserXPBalance
async function upsertAndRecalcBalances(
  prisma: any,
  userId: string,
  courseId: string
) {
  const events: Array<{ xp: number; xpType: string }> =
    await prisma.userXPEvent.findMany({
      where: { userId, courseId },
      select: { xp: true, xpType: true },
    });

  let xpMandatory = 0,
    xpExtra = 0,
    xpOptional = 0,
    xpBonus = 0,
    xpWelcome = 0;

  for (const e of events) {
    if (e.xpType === "MANDATORY") xpMandatory += e.xp;
    else if (e.xpType === "EXTRA") xpExtra += e.xp;
    else if (e.xpType === "OPTIONAL") xpOptional += e.xp;
    else if (e.xpType === "BONUS") xpBonus += e.xp;
    else if (e.xpType === "WELCOME") xpWelcome += e.xp;
  }

  // Regra simples: primary = mandatory + extra + bonus; total = primary + optional + welcome
  const xpPrimary = xpMandatory + xpExtra + xpBonus;
  const xpTotal = xpPrimary + xpOptional + xpWelcome;

  await prisma.userXPBalance.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      xpMandatory,
      xpExtra,
      xpOptional,
      xpBonus,
      xpWelcome,
      xpPrimary,
      xpTotal,
    },
    create: {
      userId,
      courseId,
      xpMandatory,
      xpExtra,
      xpOptional,
      xpBonus,
      xpWelcome,
      xpPrimary,
      xpTotal,
    },
  });
}
