// app/api/admin/units/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as database from "@/lib/db";
import { Prisma, UnitType } from "@prisma/client";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

type Body = {
  moduleId: string;
  title: string;
  slug: string;
  description?: string | null;
  type: "VIDEO" | "DOC" | "LINK" | "ACTIVITY";
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

const ALLOWED_TYPES: Body["type"][] = ["VIDEO", "DOC", "LINK", "ACTIVITY"];

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // validação básica
  if (!body.moduleId) {
    return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!body.slug?.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "invalid unit type" }, { status: 400 });
  }

  if (body.type === "VIDEO" && !body.youtubeId?.trim()) {
    return NextResponse.json(
      { error: "youtubeId is required for VIDEO" },
      { status: 400 }
    );
  }
  if (body.type === "DOC" && !body.driveFileId?.trim()) {
    return NextResponse.json(
      { error: "driveFileId is required for DOC" },
      { status: 400 }
    );
  }
  if (body.type === "LINK" && !body.url?.trim()) {
    return NextResponse.json(
      { error: "url is required for LINK" },
      { status: 400 }
    );
  }

  // garante módulo e curso (e pega slugs para montar a URL de retorno)
  const mod = await prisma.module.findUnique({
    where: { id: body.moduleId },
    select: {
      id: true,
      slug: true,
      course: { select: { id: true, slug: true } },
      units: { select: { id: true, sortIndex: true } },
    },
  });
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // sortIndex: usa o informado ou joga para o final
  const sortIdx =
    typeof body.sortIndex === "number"
      ? body.sortIndex
      : mod.units.reduce(
          (acc: number, u: { sortIndex: number }) => Math.max(acc, u.sortIndex),
          -1
        ) + 1;

  // normaliza numéricos
  const duration =
    body.durationSec == null ? null : Math.max(0, Math.floor(body.durationSec));

  // No seu schema, thresholdPct e Int NOT NULL com default 85.
  // Então NUNCA envie null.
  const threshold =
    body.type === "VIDEO"
      ? body.thresholdPct == null
        ? 85
        : Math.min(100, Math.max(0, Math.floor(body.thresholdPct)))
      : 85;

  const xpVal =
    body.xpValue == null ? 30 : Math.max(0, Math.floor(body.xpValue));
  const xpMax =
    body.xpMax == null ? null : Math.max(0, Math.floor(body.xpMax));

  // IMPORTANT: aqui precisa que o Prisma Client já conheça UnitType.ACTIVITY
  // Isso depende do schema.prisma + prisma generate.
  const prismaType = body.type as UnitType;

  try {
    const created = await prisma.unit.create({
      data: {
        // FIX CRITICO:
        // Em alguns estados do Prisma Client, ele exige relation connect ao invés de FK direto.
        // Isso elimina o erro "Argument `module` is missing" sem mexer em schema/banco.
        module: { connect: { id: body.moduleId } },

        title: body.title.trim(),
        slug: body.slug.trim(),
        description: body.description?.trim() || null,

        type: prismaType,

        youtubeId:
          body.type === "VIDEO" ? body.youtubeId?.trim() || null : null,
        driveFileId:
          body.type === "DOC" ? body.driveFileId?.trim() || null : null,
        url: body.type === "LINK" ? body.url?.trim() || null : null,

        durationSec: duration,
        thresholdPct: threshold,

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
      select: { slug: true },
    });

    const unitPath = `/c/${mod.course.slug}/${mod.slug}/${created.slug}`;
    return NextResponse.json({ ok: true, unitPath });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Slug já existe neste módulo." },
        { status: 409 }
      );
    }
    console.error("create unit error", err);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
