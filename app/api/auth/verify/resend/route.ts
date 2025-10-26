import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limitOrThrow } from "@/lib/limit";

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "ip";
    await limitOrThrow(`verify:resend:${ip}`);

    const { email } = await req.json();
    const em = (email || "").toLowerCase().trim();
    if (!em) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: em } });
    if (!user) return NextResponse.json({ ok: true }); // resposta genérica

    // limpa códigos antigos
    await prisma.verificationToken.deleteMany({ where: { identifier: em } });

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.verificationToken.create({
      data: { identifier: em, token: code, expires },
    });

    // TODO: enviar e-mail com o code
    // await sendEmailVerification(em, code);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? "Erro" }, { status });
  }
}
