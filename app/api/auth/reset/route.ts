// app/api/auth/reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash as argonHash } from "@node-rs/argon2";
import { limitOrThrow } from "@/lib/limit";

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "ip";
    await limitOrThrow(`reset:${ip}`);

    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    if (`${password}`.length < 8) {
      return NextResponse.json({ error: "Senha fraca (mín. 8)" }, { status: 400 });
    }

    const prt = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!prt) {
      return NextResponse.json({ error: "Token inválido/expirado" }, { status: 400 });
    }
    // valida expiração sem date-fns, para evitar dependência
    if (prt.expires.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token inválido/expirado" }, { status: 400 });
    }

    // ✅ Usa defaults do @node-rs/argon2 (sem objeto de opções)
    const passwordHash = await argonHash(`${password}`);

    await prisma.$transaction([
      prisma.user.update({ where: { id: prt.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.delete({ where: { id: prt.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? "Erro" }, { status });
  }
}
