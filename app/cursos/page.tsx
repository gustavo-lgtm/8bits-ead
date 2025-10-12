// app/cursos/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import ProjectsNetflixRow from "@/components/projects/ProjectsNetflixRow";
import { getProjectsRowItems } from "@/lib/projectsRows";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return (
      <>
        <AppHeader />
        <main className="min-h-dvh bg-white text-neutral-900">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h1 className="text-2xl md:text-3xl font-bold">Meus projetos</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Faça login para ver seus projetos.
            </p>
            <div className="mt-4">
              <a
                href="/login?callback=%2Fcursos"
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "#ffab40" }}
              >
                Fazer login
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  const items = await getProjectsRowItems(userId);

  return (
    <>
      <AppHeader />
      <main className="min-h-dvh bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Meus projetos</h1>
          <ProjectsNetflixRow items={items} />
        </div>
      </main>
    </>
  );
}
