// app/api/admin/modules/create/route.ts
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
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    courseId,
    title,
    slug,
    description,
    posterUrl,
    icon,
    sortIndex,
    isOptional,
    bonusPercent,
  } = body ?? {};

  if (!courseId || !title || !slug) {
    return NextResponse.json({ error: "courseId, title e slug são obrigatórios" }, { status: 400 });
  }

  // garante que o curso existe
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { slug: true } });
  if (!course) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

  // sortIndex automático se não informado
  let finalSort = Number.isFinite(Number(sortIndex)) ? Number(sortIndex) : null;
  if (finalSort === null) {
    const count = await prisma.module.count({ where: { courseId } });
    finalSort = count; // próximo índice no final
  }

  try {
    const mod = await prisma.module.create({
      data: {
        courseId,
        title: String(title),
        slug: String(slug),
        description: description ?? null,
        posterUrl: posterUrl ?? null,
        icon: icon ?? null,
        sortIndex: finalSort,
        isOptional: !!isOptional,
        bonusPercent: Number.isFinite(Number(bonusPercent)) ? Number(bonusPercent) : 10,
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json({ ok: true, module: mod, courseSlug: course.slug });
  } catch (e: any) {
    // erro comum: UNIQUE courseId+slug
    return NextResponse.json(
      { error: e?.message ?? "Erro ao criar módulo" },
      { status: 400 }
    );
  }
}
