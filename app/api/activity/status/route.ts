// app/api/activity/status/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const unitId = body?.unitId as string | undefined;
  if (!unitId) return NextResponse.json({ error: "unitId is required" }, { status: 400 });

  try {
    // 1) Progresso/conclusão (fonte de verdade para “concluída”)
    const progress = await prisma.userUnitProgress.findUnique({
      where: { userId_unitId: { userId, unitId } },
      select: { completedAt: true, status: true, lastViewedAt: true },
    });

    const isCompleted = !!progress?.completedAt;

    // 2) XP ganho nesta unidade (soma eventos desta unitId)
    const events = await prisma.userXPEvent.findMany({
      where: { userId, unitId },
      select: { xp: true },
    });
    const earnedXp = (events || []).reduce((acc: number, e: any) => acc + (e?.xp ?? 0), 0);

    // 3) Submission + attachments
    const submission = await (prisma as any).activitySubmission.findUnique({
      where: { userId_unitId: { userId, unitId } },
      select: {
        id: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        attachments: {
          select: {
            id: true,
            kind: true,
            url: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      isCompleted,
      earnedXp,
      submission: submission
        ? {
            id: submission.id,
            notes: submission.notes ?? "",
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
            attachments: (submission.attachments ?? []).map((a: any) => ({
              id: a.id,
              kind: a.kind,
              url: a.url,
              fileName: a.fileName,
              mimeType: a.mimeType,
              sizeBytes: a.sizeBytes,
              createdAt: a.createdAt,
            })),
          }
        : null,
    });
  } catch (e) {
    console.error("activity/status error", e);
    return NextResponse.json({ error: "Failed to load activity status" }, { status: 500 });
  }
}
