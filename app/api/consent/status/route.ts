// app/api/consent/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function norm(e?: string) {
  return (e || "").toLowerCase().trim();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({} as any));
    const normalized = norm(email);
    if (!normalized) {
      return NextResponse.json({ error: "Email ausente." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: {
        consentStatus: true,
        guardianEmail: true,
        consentExpires: true,
      },
    });

    // Se não existe usuário, ou não está pendente, respondemos pending:false
    if (!user || user.consentStatus !== "PENDING") {
      return NextResponse.json({ pending: false }, { status: 200 });
    }

    return NextResponse.json({
      pending: true,
      guardianEmail: user.guardianEmail ?? "",
      expiresAt: user.consentExpires ? user.consentExpires.toISOString() : "",
    });
  } catch (e) {
    return NextResponse.json({ error: "Falha ao consultar status." }, { status: 500 });
  }
}
