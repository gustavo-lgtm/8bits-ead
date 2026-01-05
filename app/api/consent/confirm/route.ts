// app/api/consent/confirm/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function confirmConsentToken(token: string) {
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
}

// Aceita POST (seu fluxo atual)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }
    return await confirmConsentToken(token);
  } catch (e) {
    console.error("Consent confirm error (POST)", e);
    return NextResponse.json(
      { error: "Erro ao confirmar consentimento." },
      { status: 500 }
    );
  }
}

// Aceita GET (para links e fluxos que chamam a API via querystring)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    if (!token) {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }
    return await confirmConsentToken(token);
  } catch (e) {
    console.error("Consent confirm error (GET)", e);
    return NextResponse.json(
      { error: "Erro ao confirmar consentimento." },
      { status: 500 }
    );
  }
}
