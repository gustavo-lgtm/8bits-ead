//app/api/activity/save/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as database from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { del } from "@vercel/blob";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

type Body = {
  unitId: string;
  notes?: string | null;
  attachments?: Array<{
    url: string;
    pathname: string;
    fileName: string;
    mimeType: string | null;
    sizeBytes: number | null;
    kind: "FILE" | "IMAGE" | "VIDEO";
  }>;
  deletePathnames?: string[];
};

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const unitId = (body.unitId || "").trim();
  if (!unitId) return NextResponse.json({ error: "unitId is required" }, { status: 400 });

  const notes = (body.notes ?? "").toString();
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  const deletePathnames = Array.isArray(body.deletePathnames) ? body.deletePathnames : [];

  // validação: max 5, max 25MB
  if (attachments.length > 5) {
    return NextResponse.json({ error: "Max 5 attachments." }, { status: 400 });
  }
  for (const a of attachments) {
    if (!a?.url || !a?.fileName || !a?.pathname) {
      return NextResponse.json({ error: "Invalid attachment payload." }, { status: 400 });
    }
    if (typeof a.sizeBytes === "number" && a.sizeBytes > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Attachment too large (max 25MB)." }, { status: 400 });
    }
  }

  // garante que a unidade existe e é ACTIVITY
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { id: true, type: true },
  });
  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  if (unit.type !== "ACTIVITY") {
    return NextResponse.json({ error: "Not an ACTIVITY unit" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const submission = await tx.activitySubmission.upsert({
        where: { userId_unitId: { userId, unitId } },
        update: { notes },
        create: { userId, unitId, notes },
        select: { id: true },
      });

      // substitui anexos (MVP)
      await tx.activityAttachment.deleteMany({
        where: { submissionId: submission.id },
      });

      if (attachments.length > 0) {
        await tx.activityAttachment.createMany({
          data: attachments.map((a) => ({
            submissionId: submission.id,
            kind: a.kind,
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
          })),
        });
      }
    });

    // delete blobs (fora de transaction)
    // importante: isso exige BLOB_READ_WRITE_TOKEN no ambiente
    for (const p of deletePathnames) {
      const pathname = (p || "").trim();
      if (!pathname) continue;

      try {
        await del(pathname);
      } catch {
        // MVP: não falha a request se não conseguir deletar o blob
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("activity/save error", e);
    return NextResponse.json({ error: "Failed to save activity" }, { status: 500 });
  }
}
