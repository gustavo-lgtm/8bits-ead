// app/api/admin/courses/list/route.ts
import { NextResponse } from "next/server";
import * as database from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;
  if (!userId) return NextResponse.json([], { status: 200 }); // por enquanto liberado

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true },
  });
  return NextResponse.json(courses);
}
