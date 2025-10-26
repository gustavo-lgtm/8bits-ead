// app/api/consent/change-guardian/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendConsentEmail } from "@/lib/mail";

function norm(e?: string) {
  return (e || "").toLowerCase().trim();
}
function randomToken(bytes = 32) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString("hex");
}

export async function POST(req: Request) {
  try {
    const { studentEmail, newGuardianEmail } = await req.json();
    const email = norm(studentEmail);
    const guardian = norm(newGuardianEmail);
    if (!email || !guardian) {
      return NextResponse.json({ error: "Dados ausentes." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.consentStatus !== "PENDING") {
      return NextResponse.json({ error: "Nenhuma autorização pendente." }, { status: 400 });
    }

    const token = randomToken(32);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { guardianEmail: guardian, consentToken: token, consentExpires: expires },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/responsavel/consentir?token=${token}`;

    await sendConsentEmail({
      guardianEmail: guardian,
      studentNickname: user.nickname || user.name || null,
      studentEmail: user.email,
      confirmUrl,
      expiresAt: expires,
    });

    return NextResponse.json({ ok: true, guardianEmail: guardian, expiresAt: expires.toISOString() });
  } catch (e) {
    console.error("change-guardian error", e);
    return NextResponse.json({ error: "Falha ao trocar e-mail do responsável." }, { status: 500 });
  }
}
