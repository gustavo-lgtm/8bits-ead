// app/admin/modules/new/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewModuleForm from "./NewModuleForm";

export const dynamic = "force-dynamic";

export default async function NewModulePage() {
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;
  if (!userId) {
    redirect("/login?callback=" + encodeURIComponent("/admin/modules/new"));
  }

  return (
    <main className="min-h-dvh bg-white text-neutral-900">
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-10">
        <h1 className="text-2xl font-bold">Cadastrar módulo</h1>
        <p className="mt-1 text-neutral-600 text-sm">
          Preencha os campos abaixo para criar um novo módulo em um curso.
        </p>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 md:p-6 shadow-sm">
          <NewModuleForm />
        </div>
      </div>
    </main>
  );
}
