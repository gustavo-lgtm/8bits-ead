// app/api/consent/resend/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendConsentEmail } from "@/lib/mail";

function randomToken(bytes = 32) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString("hex");
}

export async function POST(req: Request) {
  try {
    const { studentEmail } = await req.json();
    const email = (studentEmail || "").toLowerCase().trim();
    if (!email) return NextResponse.json({ error: "E-mail ausente." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.consentStatus !== "PENDING" || !user.guardianEmail) {
      return NextResponse.json({ error: "Nenhuma autorização pendente." }, { status: 400 });
    }

    const token = randomToken(32);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { consentToken: token, consentExpires: expires },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://app.8bitsedu.com.br";
    const confirmUrl = `${baseUrl}/responsavel/consentir?token=${token}`;

    await sendConsentEmail({
      guardianEmail: user.guardianEmail,
      studentNickname: user.nickname || user.name || null,
      studentEmail: user.email,
      confirmUrl,
      expiresAt: expires,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("consent/resend error", e);
    return NextResponse.json({ error: "Falha ao reenviar e-mail." }, { status: 500 });
  }
}
