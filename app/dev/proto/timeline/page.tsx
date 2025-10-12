// app/dev/proto/timeline/page.tsx (wireframe)
export default function TimelineCourse() {
  const chapters = [
    { title: "Cap. 1", steps: ["Intro", "Setup", "Explorar"] },
    { title: "Cap. 2", steps: ["Desafio", "Boss"] },
  ];
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Campanha — Timeline</h1>

      <div className="mt-8 space-y-10">
        {chapters.map((c, i) => (
          <section key={i}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">{c.title}</h2>
              <div className="text-xs text-gray-500">2/5 concluídas</div>
            </div>

            <div className="relative overflow-x-auto">
              <div className="flex items-center gap-6 pr-6">
                {c.steps.map((s, j) => (
                  <div key={j} className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-black" />
                    <div className="mt-2 rounded-xl border px-3 py-2 text-sm bg-white">{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
