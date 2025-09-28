export default function PainelPage() {
  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold">Painel do Aluno</h1>
        <p className="text-sm md:text-base text-gray-500 mt-2">
          Aqui vamos listar cursos desbloqueados/bloqueados.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-xs uppercase text-gray-500">Projeto</div>
            <div className="font-semibold">Box 001 — Minecraft</div>
            <div className="text-xs mt-1">Status: <span className="font-medium">Bloqueado</span></div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs uppercase text-gray-500">Projeto</div>
            <div className="font-semibold">Demo — Bem-vindo</div>
            <div className="text-xs mt-1">Status: <span className="font-medium">Desbloqueado</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
