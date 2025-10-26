import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || "").slice(0, 4) + "…" + (process.env.GOOGLE_CLIENT_ID || "").slice(-4),
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  // lista os providers “vistos” pelo NextAuth
  const providers = (authOptions.providers || []).map((p: any) => p.id);

  return NextResponse.json({ env, providers });
}
