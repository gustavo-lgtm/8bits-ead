// app/api/progress/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardUnitCompletionXP } from "@/lib/gamification";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { unitId, action } = body as { unitId?: string; action?: "start" | "complete" };

  if (!unitId || !action) {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  const now = new Date();

  // Atualiza ou cria o progresso da unit
  await prisma.userUnitProgress.upsert({
    where: { userId_unitId: { userId, unitId } },
    create: {
      userId,
      unitId,
      status: action === "complete" ? "COMPLETED" : "IN_PROGRESS",
      lastViewedAt: now,
      completedAt: action === "complete" ? now : null,
    },
    update: {
      status: action === "complete" ? "COMPLETED" : "IN_PROGRESS",
      lastViewedAt: now,
      completedAt: action === "complete" ? now : undefined,
    },
  });

  // Se foi conclusão, concede XP
  if (action === "complete") {
    await awardUnitCompletionXP(userId, unitId);
  }

  return NextResponse.json({ ok: true });
}
