// app/api/units/status/route.ts
import { NextResponse } from "next/server";
import * as database from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const unitId: string | undefined = body?.unitId;
  if (!unitId) return NextResponse.json({ error: "unitId is required" }, { status: 400 });

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { id: true, xpValue: true },
  });
  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

  const prog = await prisma.userUnitProgress.findUnique({
    where: { userId_unitId: { userId, unitId } },
    select: { status: true, completedAt: true, watchedPct: true, watchedSeconds: true },
  });

  const isCompleted = Boolean(prog?.completedAt && prog?.status === "COMPLETED");
  const unitXP = unit.xpValue ?? 30;

  return NextResponse.json({
    isCompleted,
    watchedPct: prog?.watchedPct ?? 0,
    watchedSeconds: prog?.watchedSeconds ?? 0,
    unitXP,
  });
}
