// app/api/consent/confirm/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        consentToken: token,
        consentExpires: { gt: new Date() },
        consentStatus: "PENDING",
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado." },
        { status: 400 }
      );
    }

    // Apenas aprova o consentimento e libera login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        consentStatus: "APPROVED",
        consentAt: new Date(),
        consentMethod: "email_link",
        consentToken: null,
        consentExpires: null,
      },
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (e) {
    console.error("Consent confirm error", e);
    return NextResponse.json(
      { error: "Erro ao confirmar consentimento." },
      { status: 500 }
    );
  }
}
