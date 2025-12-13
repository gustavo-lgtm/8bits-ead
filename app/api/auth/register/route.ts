// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash as argonHash } from "@node-rs/argon2";
import { sendConsentEmail, sendVerifyEmail } from "@/lib/mail";

// helpers
function normEmail(e?: string) {
  return (e || "").toLowerCase().trim();
}
function calcAge(birthIso: string): number {
  const d = new Date(birthIso);
  if (Number.isNaN(d.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}
function randomToken(bytes = 32) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normEmail(body?.email);
    const password: string = `${body?.password || ""}`;
    const confirmPassword: string = `${body?.confirmPassword || ""}`;
    const name: string | undefined = body?.name ? String(body.name) : undefined;
    const nickname: string | undefined = body?.nickname ? String(body.nickname) : undefined;
    const birthDateStr: string | undefined = body?.birthDate ? String(body.birthDate) : undefined;
    const guardianEmailRaw: string | undefined = body?.guardianEmail ? String(body.guardianEmail) : undefined;

    if (!email || !password || !birthDateStr) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
    }

    const age = calcAge(birthDateStr);
    if (age < 0 || age > 130) {
      return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
    }

    const birthDate = new Date(birthDateStr);
    const hash = await argonHash(password);
    const isChild = age < 13;
    const now = new Date();

    const baseData: any = {
      email,
      name,
      nickname,
      passwordHash: hash,
      birthDate,
    };

    if (isChild) {
      const guardianEmail = normEmail(guardianEmailRaw);
      if (!guardianEmail) {
        return NextResponse.json(
          { error: "Informe o e-mail do responsável para menores de 13 anos." },
          { status: 400 }
        );
      }

      const token = randomToken(32);
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await prisma.user.create({
        data: {
          ...baseData,
          consentStatus: "PENDING",
          guardianEmail,
          consentToken: token,
          consentExpires: expires,
          consentMethod: null,
          consentAt: null,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://app.8bitsedu.com.br";
      const confirmUrl = `${baseUrl}/responsavel/consentir?token=${token}`;

      try {
        await sendConsentEmail({
          guardianEmail,
          studentNickname: nickname || name || null,
          studentEmail: email,
          confirmUrl,
          expiresAt: expires,
        });
      } catch (mailErr) {
        console.error("[Consent] Falha ao enviar e-mail (seguimos com PENDING):", mailErr);
      }

      return NextResponse.json({
        ok: true,
        next: "PENDING_CONSENT",
        pending: { guardianEmail, expiresAt: expires.toISOString() },
      });
    }

    // ≥13 → cria usuário e envia verificação de e-mail
    const verifyToken = randomToken(32);
    const verifyExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    await prisma.user.create({
      data: {
        ...baseData,
        consentStatus: "NONE",
      },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verifyToken,
        expires: verifyExpires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://app.8bitsedu.com.br";        
    const verifyUrl = `${baseUrl}/verify?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendVerifyEmail({ to: email, verifyUrl, expiresAt: verifyExpires });
    } catch (mailErr) {
      console.error("[VerifyEmail] Falha ao enviar e-mail:", mailErr);
    }

    return NextResponse.json({
      ok: true,
      next: "VERIFY_EMAIL",
    });
  } catch (e) {
    console.error("Register error", e);
    return NextResponse.json({ error: "Erro ao registrar. Tente novamente." }, { status: 500 });
  }
}
