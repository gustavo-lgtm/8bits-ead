// app/dev/proto/course/page.tsx
// ⚠️ PROTÓTIPO VISUAL (sem DB) — só para sentir layout/estilo.
// A ideia é testar visual e UX. Depois plugar na sua lógica real.

import Link from "next/link";

type Unit = {
  id: string;
  title: string;
  type: "VIDEO" | "DOC" | "LINK";
  duration: string;
  locked?: boolean;
  completed?: boolean;
};

type Module = {
  id: string;
  title: string;
  units: Unit[];
};

const MOCK: { course: { title: string; slug: string }, modules: Module[], progressPct: number } = {
  course: { title: "Curso 8bits — Lógica Criativa", slug: "logica-criativa" },
  progressPct: 42,
  modules: [
    {
      id: "m1",
      title: "Base & Setup",
      units: [
        { id: "u1", title: "Bem-vindo!", type: "VIDEO", duration: "3 min", completed: true },
        { id: "u2", title: "Seu primeiro desafio", type: "DOC", duration: "5 min" },
        { id: "u3", title: "Explorando ideias", type: "LINK", duration: "4 min" },
      ]
    },
    {
      id: "m2",
      title: "Missão: Criar algo!",
      units: [
        { id: "u4", title: "Inspiração rápida", type: "VIDEO", duration: "6 min" },
        { id: "u5", title: "Checklist criativo", type: "DOC", duration: "4 min", locked: true },
        { id: "u6", title: "Compartilhe com o mundo", type: "LINK", duration: "2 min", locked: true },
      ]
    },
  ],
};

function UnitIcon({ type }: { type: Unit["type"] }) {
  if (type === "VIDEO") return <span aria-hidden>🎬</span>;
  if (type === "DOC") return <span aria-hidden>📄</span>;
  if (type === "LINK") return <span aria-hidden>🔗</span>;
  return <span aria-hidden>📦</span>;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex justify-between text-xs mb-1 font-medium text-gray-700">
        <span>Progresso</span><span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function UnitCard({ unit, href }: { unit: Unit; href: string }) {
  const state = unit.completed ? "done" : unit.locked ? "locked" : "open";

  const styles = {
    done:    "bg-emerald-50 border-emerald-200",
    locked:  "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed",
    open:    "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm",
  }[state];

  const chip = unit.completed ? "Concluída" : unit.locked ? "Bloqueada" : "Disponível";

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col items-center text-center transition-transform duration-200 ${styles}`}
    >
      <div className="text-3xl">{<UnitIcon type={unit.type} />}</div>
      <div className="mt-2 text-sm font-medium line-clamp-2">{unit.title}</div>
      <div className="mt-1 text-xs text-gray-500">{unit.duration}</div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
          unit.completed
            ? "bg-emerald-100 border-emerald-300 text-emerald-700"
            : unit.locked
            ? "bg-gray-100 border-gray-300 text-gray-600"
            : "bg-sky-50 border-sky-200 text-sky-700"
        }`}>
          {chip}
        </span>

        {state === "open" && (
          <Link
            href={href}
            className="text-xs rounded-lg bg-black text-white px-3 py-1"
          >
            Abrir
          </Link>
        )}
        {state === "done" && (
          <Link
            href={href}
            className="text-xs rounded-lg border px-3 py-1 hover:bg-gray-50"
          >
            Rever
          </Link>
        )}
        {state === "locked" && (
          <span className="text-xs text-gray-400">🔒</span>
        )}
      </div>
    </div>
  );
}

export default function CoursePrototypePage() {
  const { course, modules, progressPct } = MOCK;

  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho local do protótipo */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Protótipo</div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{course.title}</h1>
          </div>
          <Link href="/" className="text-sm underline">Início real</Link>
        </div>

        <div className="mt-6">
          <ProgressBar pct={progressPct} />
        </div>

        <div className="mt-10 space-y-10">
          {modules.map((m) => (
            <section key={m.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base md:text-lg font-semibold">{m.title}</h2>
                <Link href={`/c/${course.slug}`} className="text-xs underline">Ir para curso real</Link>
              </div>

              {m.units.length === 0 ? (
                <div className="text-sm text-gray-500">Sem aulas neste módulo.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {m.units.map((u) => (
                    <UnitCard
                      key={u.id}
                      unit={u}
                      href={`/c/${course.slug}/${m.title.toLowerCase().replace(/\s+/g, "-")}/${u.title.toLowerCase().replace(/\s+/g, "-")}`}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
