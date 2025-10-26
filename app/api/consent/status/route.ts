// app/api/consent/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({} as any));
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email ausente." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      // campos mínimos; se seus nomes forem ligeiramente diferentes, ajusto abaixo
      select: {
        consentStatus: true,
        guardianEmail: true,
        // se você tiver um campo com a expiração do link de consentimento, selecione aqui:
        // ex.: consentTokenExpiresAt
      } as any,
    });

    // Por padrão, não vaza existência de conta em outros estados.
    if (!user || (user as any).consentStatus !== "PENDING") {
      return NextResponse.json({ pending: false }, { status: 200 });
    }

    // Tenta localizar uma expiração, se houver:
    const expiresAt: string | null =
      (user as any).consentTokenExpiresAt?.toISOString?.() ??
      null;

    return NextResponse.json({
      pending: true,
      guardianEmail: (user as any).guardianEmail ?? null,
      expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar status." }, { status: 500 });
  }
}
