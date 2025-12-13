// app/api/auth/verify/resend/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limitOrThrow, getClientIp } from "@/lib/limit";
import { sendVerifyEmail } from "@/lib/mail";

function normEmail(e?: string) {
  return (e || "").toLowerCase().trim();
}

export async function POST(req: Request) {
  try {
    // Rate limit por IP nesta rota (anti-spam de e-mails)
    const ip = getClientIp(req);
    await limitOrThrow({
      key: `ip:${ip}|path:/api/auth/verify/resend`,
      capacity: 5,
      windowMs: 10 * 60_000, // 10 minutos
    });

    const { email } = await req.json();
    const em = normEmail(email);

    // Para evitar user enumeration, retornaremos { ok: true } mesmo se o usuário não existir.
    // Mas internamente só enviaremos e-mail se as condições forem atendidas.
    if (!em) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: em },
      select: { id: true, emailVerified: true },
    });

    // Se não existir usuário ou já estiver verificado,
    // respondemos 200 OK sem enviar nada.
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    // Apaga tokens antigos desse e-mail (higiene)
    await prisma.verificationToken.deleteMany({
      where: { identifier: em },
    });

    // Cria novo token de verificação (24h)
    const now = Date.now();
    const expires = new Date(now + 24 * 60 * 60 * 1000);

    // Gera token aleatório - mesmo método usado no register (randomToken)
    // Reusamos Web Crypto API como no register:
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    const token = Buffer.from(b).toString("hex");

    await prisma.verificationToken.create({
      data: {
        identifier: em,
        token,
        expires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://app.8bitsedu.com.br";
    const verifyUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(em)}`;

    try {
      await sendVerifyEmail({ to: em, verifyUrl, expiresAt: expires });
    } catch (mailErr) {
      // Não expomos erro de envio (para não permitir enumeration por timing ou mensagens)
      console.error("[VerifyEmail][resend] Falha ao enviar e-mail:", mailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    const headers =
      status === 429 && e?.retryAfter
        ? { "Retry-After": String(e.retryAfter) }
        : undefined;

    return NextResponse.json(
      { error: e?.message || "Erro ao reenviar verificação." },
      { status, headers }
    );
  }
}
