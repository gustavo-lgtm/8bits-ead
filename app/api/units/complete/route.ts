// app/api/units/complete/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as database from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, XPType } from "@prisma/client";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const unitId = (body as any)?.unitId as string | undefined;
  if (!unitId) return NextResponse.json({ error: "unitId is required" }, { status: 400 });

  // Unidade + módulo/curso (para próxima unidade e saldo do curso)
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
          units: { select: { id: true, slug: true, sortIndex: true } },
        },
      },
    },
  });
  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

  const courseId = unit.module.courseId;
  const unitXP: number = typeof unit.xpValue === "number" ? unit.xpValue : 30;
  const xpType: XPType = unit.isOptional ? "OPTIONAL" : unit.isExtra ? "EXTRA" : "MANDATORY";

  // Idempotência: já concluída?
  const already = await prisma.userUnitProgress.findUnique({
    where: { userId_unitId: { userId, unitId: unit.id } },
    select: { completedAt: true },
  });
  if (already?.completedAt) {
    return NextResponse.json({ awardedXp: 0, nextUnitSlug: nextSlug(unit), streakDelta: 0 });
  }

  const now = new Date();
  const eventType = `unit_completed:${unit.id}`; // idempotente por unidade dentro do curso

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1) Marca COMPLETED
      await tx.userUnitProgress.upsert({
        where: { userId_unitId: { userId, unitId: unit.id } },
        update: { status: "COMPLETED", completedAt: now, lastViewedAt: now },
        create: { userId, unitId: unit.id, status: "COMPLETED", completedAt: now, lastViewedAt: now },
      });

      // 2) Evento de UNIDADE:
      //    - courseId OBRIGATÓRIO (seu schema exige)
      //    - moduleId OMITIDO (null) para não colidir com UNIQUE de módulo
      //    - eventType com sufixo da unidade para não colidir com UNIQUE de curso
      try {
        await tx.userXPEvent.create({
          data: {
            userId,
            courseId,              // obrigatório no seu schema
            // moduleId: unit.moduleId, // <- NÃO preencher em evento de unidade
            unitId: unit.id,
            eventType,             // ex.: "unit_completed:<unitId>"
            xp: unitXP,
            xpType,
            meta: { unitSlug: unit.slug, unitTitle: unit.title },
          },
        });
      } catch (err) {
        // P2002: já existe (idempotência por algum UNIQUE) — ignora
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) {
          throw err;
        }
      }

      // 3) Recalcula saldos do curso (soma eventos do curso em qualquer escopo)
      type EventRow = { xp: number; xpType: XPType };
      const events = (await tx.userXPEvent.findMany({
        where: {
          userId,
          OR: [
            { courseId },                        // alvo curso
            { module: { courseId } },            // alvo módulo
            { unit: { module: { courseId } } },  // alvo unidade
          ],
        },
        select: { xp: true, xpType: true },
      })) as EventRow[];

      const sum: Record<XPType, number> = {
        MANDATORY: 0,
        EXTRA: 0,
        OPTIONAL: 0,
        BONUS: 0,
        WELCOME: 0,
      };
      for (const e of events) sum[e.xpType] += e.xp;

      const cfg = await tx.courseGamificationConfig.findUnique({
        where: { courseId },
        select: { countExtraInPrimary: true, xpWelcome: true },
      });
      const countExtra = cfg?.countExtraInPrimary ?? true;

      const xpMandatory = sum.MANDATORY | 0;
      const xpExtra     = sum.EXTRA     | 0;
      const xpOptional  = sum.OPTIONAL  | 0;
      const xpBonus     = sum.BONUS     | 0;
      const xpWelcome   = sum.WELCOME   | 0;

      const xpPrimary = xpMandatory + (countExtra ? xpExtra : 0) + xpBonus + xpWelcome;
      const xpTotal   = xpPrimary + xpOptional;

      await tx.userXPBalance.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { xpMandatory, xpExtra, xpOptional, xpBonus, xpWelcome, xpPrimary, xpTotal },
        create: { userId, courseId, xpMandatory, xpExtra, xpOptional, xpBonus, xpWelcome, xpPrimary, xpTotal },
      });
    });
  } catch (e) {
    console.error("units/complete error", e);
    return NextResponse.json({ error: "Failed to complete unit" }, { status: 500 });
  }

  return NextResponse.json({ awardedXp: unitXP, nextUnitSlug: nextSlug(unit), streakDelta: 0 });
}

function nextSlug(unit: {
  id: string;
  sortIndex: number;
  module: { units: { id: string; slug: string; sortIndex: number }[] };
}) {
  const list = unit.module.units ?? [];
  const sorted = [...list].sort((a, b) => a.sortIndex - b.sortIndex);
  const i = sorted.findIndex((u) => u.id === unit.id);
  return i >= 0 && i + 1 < sorted.length ? sorted[i + 1].slug : null;
}
