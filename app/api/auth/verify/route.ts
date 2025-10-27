import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limitOrThrow, getClientIp } from "@/lib/limit";

export async function POST(req: Request) {
  try {
    //const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "ip";    
    const ip = getClientIp(req);
    await limitOrThrow({ key: `ip:${ip}|path:/api/auth/XYZ`, capacity: 5, windowMs: 10 * 60_000 });

    const { email, code } = await req.json();
    const em = (email || "").toLowerCase().trim();
    const c = (code || "").trim();

    if (!em || !c) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const vt = await prisma.verificationToken.findFirst({
      where: { identifier: em, token: c },
    });
    if (!vt || vt.expires.getTime() < Date.now()) {
      return NextResponse.json({ error: "Código inválido/expirado" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { email: em }, data: { emailVerified: new Date() } }),
      prisma.verificationToken.delete({ where: { token: vt.token } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? "Erro" }, { status });
  }
}
