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

type ActivityAttachmentInput = {
  url: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  kind: "FILE" | "IMAGE" | "VIDEO";
};

type Body = {
  unitId?: string;
  activity?: null | {
    notes?: string | null;
    attachments?: ActivityAttachmentInput[] | null;
  };
};

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const unitId = body?.unitId;
  if (!unitId) {
    return NextResponse.json({ error: "unitId is required" }, { status: 400 });
  }

  // Carrega unidade + contexto para nextSlug
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true, // UnitType (VIDEO|DOC|LINK|ACTIVITY)
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

  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const courseId = unit.module.courseId;
  const unitXP: number = typeof unit.xpValue === "number" ? unit.xpValue : 30;
  const xpType: XPType = unit.isOptional
    ? "OPTIONAL"
    : unit.isExtra
    ? "EXTRA"
    : "MANDATORY";

  // Idempotência: já concluída?
  const already = await prisma.userUnitProgress.findUnique({
    where: { userId_unitId: { userId, unitId: unit.id } },
    select: { completedAt: true },
  });

  if (already?.completedAt) {
    return NextResponse.json({
      awardedXp: 0,
      nextUnitSlug: nextSlug(unit),
      streakDelta: 0,
    });
  }

  const now = new Date();

  // Para ACTIVITY, damos 50% agora (MVP) e o resto fica para conferência do professor
  const awardedXp =
    unit.type === "ACTIVITY" ? Math.floor(unitXP * 0.5) : unitXP;

  const eventType = `unit_completed:${unit.id}`;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Se for ACTIVITY, garante que existe entrega salva com pelo menos 1 anexo.
      if (unit.type === "ACTIVITY") {
        // 1) Decide de onde vem a entrega:
        // - Prioriza payload (caso o frontend mande)
        // - Se não vier, usa o que já está salvo no banco
        const payloadAttachments = body?.activity?.attachments ?? null;
        const payloadNotes = body?.activity?.notes ?? null;

        let attachmentsToPersist: ActivityAttachmentInput[] = [];
        let notesToPersist: string | null = payloadNotes ? String(payloadNotes) : null;

        if (Array.isArray(payloadAttachments) && payloadAttachments.length > 0) {
          attachmentsToPersist = payloadAttachments
            .filter((a) => a && typeof a.url === "string" && a.url.trim())
            .map((a) => ({
              url: String(a.url).trim(),
              fileName: String(a.fileName || "arquivo"),
              mimeType: a.mimeType == null ? null : String(a.mimeType),
              sizeBytes: a.sizeBytes == null ? null : Number(a.sizeBytes),
              kind: a.kind,
            }));
        } else {
          const existing = await tx.activitySubmission.findUnique({
            where: { userId_unitId: { userId, unitId: unit.id } },
            select: {
              notes: true,
              attachments: {
                select: {
                  url: true,
                  fileName: true,
                  mimeType: true,
                  sizeBytes: true,
                  kind: true,
                },
              },
            },
          });

          if (existing) {
            if (!notesToPersist) notesToPersist = existing.notes ?? null;

            attachmentsToPersist = (existing.attachments || []).map((a) => ({
              url: a.url,
              fileName: a.fileName,
              mimeType: a.mimeType ?? null,
              sizeBytes: a.sizeBytes ?? null,
              kind: a.kind as any,
            }));
          }
        }

        // 2) Valida: precisa ter pelo menos 1 arquivo
        if (!attachmentsToPersist || attachmentsToPersist.length === 0) {
          // Isso explica seu 400 atual na prática
          throw Object.assign(new Error("ACTIVITY_REQUIRES_ATTACHMENT"), {
            code: "ACTIVITY_REQUIRES_ATTACHMENT",
          });
        }

        // 3) Upsert da submission e sincroniza anexos (MVP: replace total)
        const submission = await tx.activitySubmission.upsert({
          where: { userId_unitId: { userId, unitId: unit.id } },
          update: { notes: notesToPersist },
          create: { userId, unitId: unit.id, notes: notesToPersist },
          select: { id: true },
        });

        // Para manter simples e consistente: substitui a lista no momento da conclusão
        await tx.activityAttachment.deleteMany({
          where: { submissionId: submission.id },
        });

        await tx.activityAttachment.createMany({
          data: attachmentsToPersist.map((a) => ({
            submissionId: submission.id,
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType ?? null,
            sizeBytes: a.sizeBytes ?? null,
            kind: a.kind as any,
          })),
        });
      }

      // 1) Marca COMPLETED
      await tx.userUnitProgress.upsert({
        where: { userId_unitId: { userId, unitId: unit.id } },
        update: { status: "COMPLETED", completedAt: now, lastViewedAt: now },
        create: {
          userId,
          unitId: unit.id,
          status: "COMPLETED",
          completedAt: now,
          lastViewedAt: now,
        },
      });

      // 2) Evento XP (idempotente por unidade)
      try {
        await tx.userXPEvent.create({
          data: {
            userId,
            courseId,
            unitId: unit.id,
            eventType,
            xp: awardedXp,
            xpType,
            meta: {
              unitSlug: unit.slug,
              unitTitle: unit.title,
              awardedPct: unit.type === "ACTIVITY" ? 50 : 100,
            },
          },
        });
      } catch (err) {
        if (
          !(
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
          )
        ) {
          throw err;
        }
      }

      // 3) Recalcula saldos do curso
      type EventRow = { xp: number; xpType: XPType };
      const events = (await tx.userXPEvent.findMany({
        where: {
          userId,
          OR: [
            { courseId },
            { module: { courseId } },
            { unit: { module: { courseId } } },
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
      const xpExtra = sum.EXTRA | 0;
      const xpOptional = sum.OPTIONAL | 0;
      const xpBonus = sum.BONUS | 0;
      const xpWelcome = sum.WELCOME | 0;

      const xpPrimary = xpMandatory + (countExtra ? xpExtra : 0) + xpBonus + xpWelcome;
      const xpTotal = xpPrimary + xpOptional;

      await tx.userXPBalance.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { xpMandatory, xpExtra, xpOptional, xpBonus, xpWelcome, xpPrimary, xpTotal },
        create: { userId, courseId, xpMandatory, xpExtra, xpOptional, xpBonus, xpWelcome, xpPrimary, xpTotal },
      });
    });
  } catch (e: any) {
    // Se a validação de ACTIVITY falhar, devolve 400 com mensagem clara
    if (e?.code === "ACTIVITY_REQUIRES_ATTACHMENT") {
      return NextResponse.json(
        { error: "Anexe pelo menos 1 arquivo para concluir a atividade." },
        { status: 400 }
      );
    }

    console.error("units/complete error", e);
    return NextResponse.json({ error: "Failed to complete unit" }, { status: 500 });
  }

  return NextResponse.json({
    awardedXp,
    nextUnitSlug: nextSlug(unit),
    streakDelta: 0,
  });
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
