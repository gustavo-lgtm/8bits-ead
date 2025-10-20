// app/api/admin/units/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as database from "@/lib/db";
import { Prisma } from "@prisma/client";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

type Body = {
  moduleId: string;
  title: string;
  slug: string;
  description?: string | null;
  type: "VIDEO" | "DOC" | "LINK";
  youtubeId?: string | null;
  driveFileId?: string | null;
  url?: string | null;
  durationSec?: number | null;
  thresholdPct?: number | null;
  sortIndex?: number | null;
  requiresCompletedPrevious?: boolean;
  isWelcome?: boolean;
  posterUrl?: string | null;
  isOptional?: boolean;
  isExtra?: boolean;
  xpMode?: "FIXED" | "QUIZ_PARTIAL";
  xpValue?: number | null;
  xpMax?: number | null;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // validação básica
  if (!body.moduleId) return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
  if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!body.slug?.trim()) return NextResponse.json({ error: "slug is required" }, { status: 400 });
  if (!["VIDEO", "DOC", "LINK"].includes(body.type)) {
    return NextResponse.json({ error: "invalid unit type" }, { status: 400 });
  }
  if (body.type === "VIDEO" && !body.youtubeId?.trim()) {
    return NextResponse.json({ error: "youtubeId is required for VIDEO" }, { status: 400 });
  }
  if (body.type === "DOC" && !body.driveFileId?.trim()) {
    return NextResponse.json({ error: "driveFileId is required for DOC" }, { status: 400 });
  }
  if (body.type === "LINK" && !body.url?.trim()) {
    return NextResponse.json({ error: "url is required for LINK" }, { status: 400 });
  }

  // garante módulo e curso (e pega slugs para montar a URL de retorno)
  const mod = await prisma.module.findUnique({
    where: { id: body.moduleId },
    select: {
      id: true, slug: true,
      course: { select: { id: true, slug: true } },
      units: { select: { id: true, sortIndex: true } },
    },
  });
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  // sortIndex: usa o informado ou joga para o final
  const sortIdx =
  typeof body.sortIndex === "number"
      ? body.sortIndex
      : (mod.units.reduce((acc: number, u: { sortIndex: number }) => Math.max(acc, u.sortIndex), -1) + 1);

  // normaliza numéricos
  const duration = body.durationSec == null ? null : Math.max(0, Math.floor(body.durationSec));
  const threshold = body.thresholdPct == null ? 85 : Math.min(100, Math.max(0, Math.floor(body.thresholdPct)));
  const xpVal = body.xpValue == null ? 30 : Math.max(0, Math.floor(body.xpValue));
  const xpMax = body.xpMax == null ? null : Math.max(0, Math.floor(body.xpMax));

  try {
    const created = await prisma.unit.create({
      data: {
        moduleId: body.moduleId,
        title: body.title.trim(),
        slug: body.slug.trim(),
        description: body.description?.trim() || null,
        type: body.type as any,
        youtubeId: body.youtubeId?.trim() || null,
        driveFileId: body.driveFileId?.trim() || null,
        url: body.url?.trim() || null,
        durationSec: duration,
        // estes campos assumem que você já adicionou no schema:
        thresholdPct: threshold as any, // se não existir no schema, remova esta linha
        sortIndex: sortIdx,
        requiresCompletedPrevious: !!body.requiresCompletedPrevious,
        isWelcome: !!body.isWelcome,
        posterUrl: body.posterUrl?.trim() || null,
        isOptional: !!body.isOptional,
        isExtra: !!body.isExtra,
        xpMode: (body.xpMode ?? "FIXED") as any,
        xpValue: xpVal,
        xpMax: xpMax,
      },
    });

    const unitPath = `/c/${mod.course.slug}/${mod.slug}/${created.slug}`;
    return NextResponse.json({ ok: true, unitPath });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Slug já existe neste módulo." }, { status: 409 });
    }
    console.error("create unit error", err);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
