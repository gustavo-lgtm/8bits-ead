// app/api/auth/verify/confirm/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token } = await req.json().catch(() => ({} as any));
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }

    // Token do NextAuth (identifier = email)
    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!vt) {
      return NextResponse.json({ error: "Token inválido ou já utilizado." }, { status: 400 });
    }
    if (vt.expires < new Date()) {
      // limpa token expirado
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json({ error: "Token expirado." }, { status: 400 });
    }

    const email = vt.identifier;

    // Marca e-mail verificado
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Remove todos os tokens daquele email (limpeza)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return NextResponse.json({ ok: true, email });
  } catch (e) {
    // Nunca retornar texto cru — sempre JSON
    return NextResponse.json({ error: "Falha ao confirmar e-mail." }, { status: 500 });
  }
}
