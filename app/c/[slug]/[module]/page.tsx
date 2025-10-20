// app/c/[slug]/[module]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import UnitsPageView from "@/components/units/UnitsPageView";
import { getUnitsPageData } from "@/lib/unitsData";

export default async function ModuleUnitsPage({
  params,
}: {
  params: Promise<{ slug: string; module: string }>;
}) {
  // params pode ser Promise em versões recentes do App Router
  const { slug, module } = await params;

  // Tipagem flexível para evitar erro "Property 'user' does not exist on type '{}'"
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;

  if (!userId) {
    redirect(`/login?callback=${encodeURIComponent(`/c/${slug}/${module}`)}`);
  }

  const data = await getUnitsPageData(userId!, slug, module);
  if (!data) return notFound();

  return (
    <>      
      <main className="min-h-dvh bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
          <UnitsPageView data={data} />
        </div>
      </main>
    </>
  );
}
