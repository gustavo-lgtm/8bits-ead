// app/c/[slug]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModulesPageData } from "@/lib/modulesData";
import ModulesPageView from "@/components/modules/ModulesPageView";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CourseModulesPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await Promise.resolve(params); // (Next exige await em params)
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return (
      <>        
        <main className="min-h-dvh bg-white text-neutral-900">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h1 className="text-2xl md:text-3xl font-bold">Módulos</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Faça login para ver os módulos do projeto.
            </p>
            <div className="mt-4">
              <a
                href={`/login?callback=${encodeURIComponent(`/c/${slug}`)}`}
                className="inline-flex rounded bg-black px-4 py-2 text-white"
              >
                Fazer login
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  const data = await getModulesPageData(userId, slug);
  if (!data) return notFound();

  return (
    <>      
      <main className="min-h-dvh bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
          <ModulesPageView data={data} />
        </div>
      </main>
    </>
  );
}
