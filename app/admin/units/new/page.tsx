// app/admin/units/new/page.tsx
import React from "react";
import * as database from "@/lib/db";
import NewUnitClient from "./NewUnitClient";

export const dynamic = "force-dynamic";

const prisma =
  (database as any).prisma ??
  (database as any).db ??
  (database as any).default;

export default async function Page() {
  // SSR: carrega cursos e módulos
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      modules: {
        orderBy: { sortIndex: "asc" },
        select: { id: true, title: true, slug: true, sortIndex: true },
      },
    },
  });

  const data = courses.map((c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    modules: c.modules.map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      sortIndex: m.sortIndex,
    })),
  }));

  return (
    <section className="p-6 max-w-3xl mx-auto text-neutral-900">
      <h1 className="text-2xl font-bold">Nova Unidade</h1>
      <p className="text-sm text-neutral-600 mt-1">
        Preencha os campos abaixo para cadastrar uma unidade. (Controle de acesso virá depois.)
      </p>

      <NewUnitClient initialData={data} />
    </section>
  );
}
