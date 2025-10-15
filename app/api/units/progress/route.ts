// app/api/units/progress/route.ts
import { NextResponse } from "next/server";
import * as database from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ajuste o caminho se necessário

// resolve prisma qualquer que seja o export de "@/lib/db"
const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

export async function POST(req: Request) {
  // tipagem flexível
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
  const watchedSeconds: number = Math.max(0, Number(body?.watchedSeconds ?? 0));
  const watchedPct: number = Math.min(100, Math.max(0, Number(body?.watchedPct ?? 0)));

  if (!unitId) {
    return NextResponse.json({ error: "unitId is required" }, { status: 400 });
  }

  // garante que a unit existe e pertence a um módulo/curso válidos
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { id: true },
  });
  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const now = new Date();

  // upsert do progresso, sem marcar como concluído aqui
  const existing = await prisma.userUnitProgress.findUnique({
    where: { userId_unitId: { userId, unitId } },
    select: { watchedSeconds: true, watchedPct: true, completedAt: true, status: true },
  });

  const newWatchedSeconds = Math.max(existing?.watchedSeconds ?? 0, Math.floor(watchedSeconds));
  const newWatchedPct = Math.max(existing?.watchedPct ?? 0, watchedPct);

  await prisma.userUnitProgress.upsert({
    where: { userId_unitId: { userId, unitId } },
    update: {
      // mantém o maior progresso já alcançado
      watchedSeconds: newWatchedSeconds,
      watchedPct: newWatchedPct,
      // se ainda não concluiu, mantém IN_PROGRESS; se já estava COMPLETED, não mexe
      status: existing?.completedAt ? existing.status : "IN_PROGRESS",
      lastViewedAt: now,
    },
    create: {
      userId,
      unitId,
      watchedSeconds: newWatchedSeconds,
      watchedPct: newWatchedPct,
      status: "IN_PROGRESS",
      lastViewedAt: now,
    },
  });

  return NextResponse.json({ ok: true });
}
