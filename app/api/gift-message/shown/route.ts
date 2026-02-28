// app/api/unlock/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await req.json();
    const { slug, code } = body ?? {};

    if (!slug || !code) {
      return NextResponse.json(
        { error: "Informe 'slug' do curso e 'code' de desbloqueio" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    // 1) valida código
    const unlock = await prisma.courseUnlockCode.findFirst({
      where: { courseId: course.id, code, status: "ACTIVE" },
    });
    if (!unlock) {
      return NextResponse.json(
        { error: "Código inválido ou já usado" },
        { status: 400 }
      );
    }

    // 2) busca gift message (se existir) para courseId + code
    const gift = await prisma.giftMessage.findUnique({
      where: { courseId_code: { courseId: course.id, code } },
      select: {
        id: true,
        fromName: true,
        message: true,
        shownAt: true,
      },
    });

    const now = new Date();

    // 3) transação: marca código como usado + matrícula + welcome
    await prisma.$transaction(async (tx) => {
      await tx.courseUnlockCode.update({
        where: { id: unlock.id },
        data: { status: "USED", usedAt: now },
      });

      await tx.userCourse.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        update: {},
        create: { userId, courseId: course.id },
      });

      const welcomeUnit = await tx.unit.findFirst({
        where: { module: { courseId: course.id }, isWelcome: true },
        select: { id: true },
      });

      if (welcomeUnit) {
        await tx.userUnitProgress.upsert({
          where: { userId_unitId: { userId, unitId: welcomeUnit.id } },
          update: { status: "COMPLETED", completedAt: now },
          create: {
            userId,
            unitId: welcomeUnit.id,
            status: "COMPLETED",
            completedAt: now,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Curso desbloqueado com sucesso!",
      giftMessage:
        gift && !gift.shownAt
          ? { id: gift.id, fromName: gift.fromName, message: gift.message }
          : null,
    });
  } catch (err) {
    console.error("Erro no /api/unlock:", err);
    return NextResponse.json({ error: "Falha interna no desbloqueio" }, { status: 500 });
  }
}