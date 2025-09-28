import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { slug, code } = (await request.json()) as { slug?: string; code?: string };
    const normalized = (code ?? "").trim().toUpperCase();

    console.log("[unlock] payload", { slug, code: normalized });

    if (!slug || !normalized) {
      return Response.json({ ok: false, error: "slug e code são obrigatórios" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { slug } });
    console.log("[unlock] course", course?.id, course?.slug);

    if (!course) {
      return Response.json({ ok: false, error: "Curso não encontrado" }, { status: 404 });
    }

    const unlock = await prisma.courseUnlockCode.findFirst({
      where: { courseId: course.id, code: normalized, status: "ACTIVE" },
    });
    console.log("[unlock] match", unlock?.id, unlock?.status);

    if (!unlock) {
      return Response.json({ ok: false, error: "Código inválido ou já usado" }, { status: 400 });
    }

    await prisma.courseUnlockCode.update({
      where: { id: unlock.id },
      data: { status: "USED", usedAt: new Date() },
    });

    console.log("[unlock] marked USED", unlock.id);
    return Response.json({ ok: true, message: "Código válido", courseId: course.id });
  } catch (e) {
    console.error("[unlock] error", e);
    return Response.json({ ok: false, error: "Erro ao processar" }, { status: 500 });
  }
}
