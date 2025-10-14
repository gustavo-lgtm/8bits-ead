// app/c/[slug]/[module]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import UnitsPageView from "@/components/units/UnitsPageView";
import { getUnitsPageData } from "@/lib/unitsData";
import AppHeader from "@/components/AppHeader";

export default async function ModuleUnitsPage({
  params,
}: { params: { slug: string; module: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    redirect(`/login?callback=${encodeURIComponent(`/c/${params.slug}/${params.module}`)}`);
  }

  const data = await getUnitsPageData(userId, params.slug, params.module);
  if (!data) return notFound();

  return (
    <>
      <AppHeader />
      <main className="min-h-dvh bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
          <UnitsPageView data={data} />
        </div>
      </main>
    </>
  );
}
