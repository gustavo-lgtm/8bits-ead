// app/dev/proto/board/page.tsx (wireframe)
export default function BoardCourse() {
  const columns = [
    { title: "Próximas", items: ["Intro", "Setup"] },
    { title: "Em andamento", items: ["Explorar"] },
    { title: "Concluídas", items: ["Tutorial", "Desafio"] },
  ];
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Campanha — Quadro de Missões</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {columns.map((col, i) => (
          <section key={i} className="rounded-2xl border bg-white">
            <div className="p-3 border-b font-medium">{col.title}</div>
            <ul className="p-3 space-y-2">
              {col.items.map((it, j) => (
                <li key={j} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                  {it}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
