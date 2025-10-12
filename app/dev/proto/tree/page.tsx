// app/dev/proto/tree/page.tsx (wireframe)
export default function TreeCourse() {
  const chapters = [
    { title: "Cap. 1", nodes: ["Bem-vindo", "Primeiro Desafio", "Portal"] },
    { title: "Cap. 2", nodes: ["Puzzle", "Boss"] },
  ];
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Campanha — Árvore de Missões</h1>

      <div className="mt-8 space-y-16">
        {chapters.map((c, i) => (
          <section key={i} className="relative">
            <div className="mb-3 font-semibold">{c.title}</div>
            <div className="flex items-center gap-6">
              {c.nodes.map((n, j) => (
                <div key={j} className="relative">
                  {/* nó */}
                  <div className="rounded-2xl border px-4 py-3 bg-white text-sm shadow-sm">
                    {n}
                  </div>
                  {/* conector (linha) */}
                  {j < c.nodes.length - 1 && (
                    <div className="absolute left-full top-1/2 h-0.5 w-6 bg-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
