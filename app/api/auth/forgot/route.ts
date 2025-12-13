// app/api/auth/forgot/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { addMinutes } from "date-fns";
import { limitOrThrow } from "@/lib/limit";
import { sendResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "ip";
    await limitOrThrow({ key: `ip:${ip}|path:/api/auth/forgot`, capacity: 5, windowMs: 10 * 60_000 });

    const { email } = await req.json();
    const em = (email || "").toLowerCase().trim();
    if (!em) return NextResponse.json({ ok: true }); // resposta genérica

    const user = await prisma.user.findUnique({ where: { email: em } });
    if (!user) return NextResponse.json({ ok: true }); // não revelar se existe

    // invalida tokens antigos
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires: addMinutes(new Date(), 15),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://app.8bitsedu.com.br";
    const link = `${baseUrl}/reset/${token}`;

    // envia o e-mail
    try {
      await sendResetEmail({ to: user.email, resetUrl: link });
    } catch (err) {
      console.error("Erro ao enviar e-mail de reset:", err);
      // Mantém resposta genérica para não vazar estado
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? "Erro" }, { status });
  }
}
