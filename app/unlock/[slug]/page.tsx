// app/unlock/[slug]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UnlockForm from "@/components/UnlockForm";

export default async function UnlockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    const callback = encodeURIComponent(`/unlock/${slug}`);
    return (
      <main className="min-h-dvh p-6 md:p-10">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold">Login necessário</h1>
          <p className="text-sm text-gray-500 mt-2">Entre na sua conta para desbloquear este curso.</p>
          <a href={`/login?callback=${callback}`} className="inline-block mt-4 rounded-lg bg-black px-4 py-2 text-white">
            Fazer login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl md:text-3xl font-bold">Unlock course</h1>
        <p className="text-sm text-gray-500 mt-2">Course: <span className="font-medium">{slug}</span></p>
        <UnlockForm slug={slug} />
      </div>
    </main>
  );
}
