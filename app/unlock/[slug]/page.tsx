// app/unlock/[slug]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UnlockForm from "@/components/UnlockForm";

export default async function UnlockPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const prettySlug = slug?.toUpperCase();

  // Quando não está logado: mensagem amigável + botão para login
  if (!session) {
    const callback = encodeURIComponent(`/unlock/${slug}`);

    return (
      <main className="min-h-dvh flex items-center justify-center bg-neutral-50 px-4 py-10">
        <section className="w-full max-w-md rounded-2xl bg-white px-6 py-6 md:px-8 md:py-8 shadow">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Entre para desbloquear sua box
          </h1>

          <p className="mt-2 text-sm text-neutral-600">
            Para ativar a box{" "}
            <span className="font-semibold">{prettySlug}</span>, primeiro faça
            login na sua conta 8bits.
          </p>

          <a
            href={`/login?callback=${callback}`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#ffab40] px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90"
          >
            Fazer login
          </a>

          <p className="mt-3 text-xs text-neutral-500 text-center">
            Se ainda não tem conta, você pode criar na próxima tela.
          </p>
        </section>
      </main>
    );
  }

  // Quando já está logado: tela de desbloqueio da box
  return (
    <main className="min-h-dvh flex items-center justify-center bg-neutral-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white px-6 py-6 md:px-8 md:py-8 shadow">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
          Desbloquear sua box
        </h1>

        <p className="mt-2 text-sm text-neutral-600">
          Box <span className="font-semibold">{prettySlug}</span>
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Digite o código secreto que veio no card da sua box para liberar o
          acesso às missões.
        </p>

        <UnlockForm slug={slug} />
      </section>
    </main>
  );
}
