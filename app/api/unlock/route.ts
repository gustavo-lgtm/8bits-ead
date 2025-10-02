import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return Response.json({ ok: false, error: "Não autenticado" }, { status: 401 });
    }

    const { slug, code } = (await request.json()) as { slug?: string; code?: string };
    if (!slug || !code) {
      return Response.json({ ok: false, error: "slug e code são obrigatórios" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      return Response.json({ ok: false, error: "Curso não encontrado" }, { status: 404 });
    }

    const normalized = code.trim().toUpperCase();

    const unlock = await prisma.courseUnlockCode.findFirst({
      where: { courseId: course.id, code: normalized, status: "ACTIVE" },
    });

    if (!unlock) {
      return Response.json({ ok: false, error: "Código inválido ou já usado" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.courseUnlockCode.update({
        where: { id: unlock.id },
        data: { status: "USED", usedAt: new Date() },
      }),
      prisma.userCourse.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        update: {},
        create: { userId, courseId: course.id },
      }),
    ]);

    return Response.json({ ok: true, message: "Curso desbloqueado", courseId: course.id });
  } catch (e) {
    return Response.json({ ok: false, error: "Erro ao processar" }, { status: 500 });
  }
}
