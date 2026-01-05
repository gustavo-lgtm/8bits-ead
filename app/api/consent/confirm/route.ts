// app/api/consent/confirm/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function extractTokenFromUrl(req: Request) {
  try {
    const url = new URL(req.url);
    return url.searchParams.get("token");
  } catch {
    return null;
  }
}

async function confirmToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      consentToken: token,
      consentExpires: { gt: new Date() },
      consentStatus: "PENDING",
    },
    select: { id: true, email: true },
  });

  if (!user) {
    return { ok: false as const, status: 400, body: { error: "Token inválido ou expirado." } };
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

  return { ok: true as const, status: 200, body: { ok: true, email: user.email } };
}

// GET /api/consent/confirm?token=...
export async function GET(req: Request) {
  try {
    const token = extractTokenFromUrl(req);
    if (!token) {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }

    const result = await confirmToken(token);
    return NextResponse.json(result.body, { status: result.status });
  } catch (e) {
    console.error("Consent confirm GET error", e);
    return NextResponse.json({ error: "Erro ao confirmar consentimento." }, { status: 500 });
  }
}

// POST { token }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token ausente." }, { status: 400 });
    }

    const result = await confirmToken(token);
    return NextResponse.json(result.body, { status: result.status });
  } catch (e) {
    console.error("Consent confirm POST error", e);
    return NextResponse.json({ error: "Erro ao confirmar consentimento." }, { status: 500 });
  }
}
