// app/api/auth/verify/send/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVerifyEmail } from "@/lib/mail";

function randomToken(bytes = 32) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString("hex");
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const norm = (email || "").toLowerCase().trim();
    if (!norm) {
      return NextResponse.json({ error: "E-mail ausente." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: norm } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "E-mail já verificado." }, { status: 400 });
    }

    // cria novo token 24h e envia
    const token = randomToken(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { identifier: norm, token, expires },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";        
    const verifyUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;

    await sendVerifyEmail({ to: norm, verifyUrl, expiresAt: expires });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify/send error", e);
    return NextResponse.json({ error: "Erro ao reenviar verificação." }, { status: 500 });
  }
}
