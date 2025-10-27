// app/cursos/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProjectsNetflixRow from "@/components/projects/ProjectsNetflixRow";
import { getProjectsRowItems } from "@/lib/projectsRows";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  // Sem sessão: envia para /login com retorno a /cursos (param 'callback', compatível com sua tela)
  if (!userId) {
    redirect(`/login?callback=${encodeURIComponent("/cursos")}`);
  }

  const items = await getProjectsRowItems(userId);

  return (
    <main className="min-h-dvh bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
        <h1 className="text-xl md:text-2xl font-bold mb-4">Meus projetos</h1>
        <ProjectsNetflixRow items={items} />
      </div>
    </main>
  );
}
