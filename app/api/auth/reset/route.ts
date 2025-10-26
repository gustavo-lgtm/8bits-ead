// app/api/auth/reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verify as argonVerify, hash as argonHash } from "@node-rs/argon2";
import { validatePassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }
    const v = validatePassword(String(password || ""));
    if (!v.ok) {
      return NextResponse.json({ error: v.errors.join(" ") }, { status: 400 });
    }

    const now = new Date();

    // Localiza token válido
    const t = await prisma.passwordResetToken.findFirst({
      where: { token, expires: { gt: now } },
      select: { id: true, userId: true },
    });
    if (!t) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
    }

    // Evita reuso: opcionalmente checar se nova senha é igual à antiga
    const user = await prisma.user.findUnique({
      where: { id: t.userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 400 });
    }

    if (user.passwordHash) {
      // Se for igual à senha atual, recuse (opcional, mas comum)
      const same = await argonVerify(user.passwordHash, password);
      if (same) {
        return NextResponse.json(
          { error: "A nova senha não pode ser igual à anterior." },
          { status: 400 }
        );
      }
    }

    // Grava nova senha
    const newHash = await argonHash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Invalida todos os tokens de reset do usuário
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // (Opcional) registra evento de auditoria
    try {
      await prisma.authEvent.create({
        data: {
          userId: user.id,
          type: "password_changed",
        },
      });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Erro ao redefinir senha." }, { status: 500 });
  }
}
