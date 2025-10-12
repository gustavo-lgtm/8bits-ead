// app/dev/proto/rpg-course/page.tsx
// M3-first + “pele” RPG/XP (suave). Protótipo isolado (sem DB).

import Link from "next/link";

type Status = "open" | "done" | "locked";
type Kind = "video" | "doc" | "link" | "quiz";

type Unit = { id: string; title: string; kind: Kind; duration: string; status: Status };
type Module = { id: string; title: string; units: Unit[] };

const MOCK: { title: string; xp: number; progress: number; modules: Module[] } = {
  title: "Campanha 8bits — Programação Criativa",
  xp: 420,
  progress: 64,
  modules: [
    {
      id: "m1",
      title: "Capítulo 1 — Primeira Jornada",
      units: [
        { id: "u1", title: "Briefing do Herói", kind: "video", duration: "3 min", status: "done" },
        { id: "u2", title: "Pergaminho de Setup", kind: "doc", duration: "6 min", status: "open" },
        { id: "u3", title: "Portal de Recursos", kind: "link", duration: "2 min", status: "locked" },
      ],
    },
    {
      id: "m2",
      title: "Capítulo 2 — O Guardião do Código",
      units: [
        { id: "u4", title: "Duelo de Lógica", kind: "quiz", duration: "5 min", status: "locked" },
        { id: "u5", title: "Checklist do Inventário", kind: "doc", duration: "4 min", status: "locked" },
      ],
    },
  ],
};

// ---------- Tokens simples (mapeados ao “espírito” M3) ----------
const role = {
  // primary para ações e indicador de progresso
  primary: {
    bg: "bg-blue-600",
    bgHover: "hover:bg-blue-700",
    textOn: "text-white",
  },
  // secondary/tonal para ações de menor ênfase
  tonal: {
    bg: "bg-blue-50",
    text: "text-blue-900",
    hover: "hover:bg-blue-100",
    border: "border-blue-200",
  },
  // sucesso/XP
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
    chip: "bg-emerald-100 border-emerald-300 text-emerald-800",
  },
  // bloqueado
  muted: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  // surface/outline
  surface: {
    card: "bg-white border border-gray-200 rounded-2xl",
  },
};

// ---------- Micro componentes ----------
function KindGlyph({ kind }: { kind: Kind }) {
  const map: Record<Kind, string> = {
    video: "🎬",
    doc: "📜",
    link: "🗝️",
    quiz: "🧩",
  };
  return <span aria-hidden className="text-xl">{map[kind]}</span>;
}

function AssistChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700">
      {children}
    </span>
  );
}

function TonalButton({ children, href = "#" }: { children: React.ReactNode; href?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium ${role.tonal.bg} ${role.tonal.text} ${role.tonal.border} border ${role.tonal.hover}`}
    >
      {children}
    </Link>
  );
}

function FilledButton({ children, href = "#" }: { children: React.ReactNode; href?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium ${role.primary.bg} ${role.primary.textOn} ${role.primary.bgHover}`}
    >
      {children}
    </Link>
  );
}

function XPBar({ xp, pct }: { xp: number; pct: number }) {
  return (
    <section className={`${role.surface.card} p-4`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">XP</div>
        <div className="text-xs text-gray-600">⭐ {xp} XP · {pct}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-600 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}

function UnitCard({ unit }: { unit: Unit }) {
  const state = unit.status;

  const container =
    state === "done"
      ? `${role.surface.card} border-emerald-300`
      : state === "locked"
      ? `${role.surface.card} ${role.muted.border} bg-gray-50 opacity-80`
      : `${role.surface.card} hover:bg-gray-50`;

  return (
    <li className={`${container} p-4 transition-colors`}>
      <div className="flex items-start gap-3">
        <KindGlyph kind={unit.kind} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{unit.title}</div>

          <div className="mt-1 flex items-center gap-2">
            <AssistChip>{unit.duration}</AssistChip>
            {state === "done" && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${role.success.chip}`}>
                +50 XP
              </span>
            )}
            {state === "locked" && <AssistChip>Bloqueada</AssistChip>}
          </div>
        </div>

        <div className="shrink-0">
          {state === "open" && <FilledButton>Jogar</FilledButton>}
          {state === "done" && <TonalButton>Rever</TonalButton>}
          {state === "locked" && <span className="text-xs text-gray-500">🔒</span>}
        </div>
      </div>
    </li>
  );
}

// ---------- Página ----------
export default function RPGCourseProto() {
  const { title, xp, progress, modules } = MOCK;

  return (
    <main className="min-h-dvh p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* App bar local do protótipo */}
        <header className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Protótipo M3 + RPG/XP</div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{title}</h1>
          </div>
          <Link href="/dev/links" className="text-sm underline">Voltar</Link>
        </header>

        {/* Barra de XP (usa linear progress M3 como base) */}
        <XPBar xp={xp} pct={progress} />

        {/* Módulos → surfaces empilhadas, cards consistentes */}
        <div className="space-y-8">
          {modules.map((m) => (
            <section key={m.id} className="space-y-3">
              <h2 className="text-base md:text-lg font-semibold">{m.title}</h2>

              {m.units.length === 0 ? (
                <div className="text-sm text-gray-500">Sem missões neste capítulo.</div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {m.units.map((u) => (
                    <UnitCard key={u.id} unit={u} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="pt-6 border-t">
          <div className="text-xs text-gray-500">
            Base M3: surfaces/outline, buttons filled/tonal, assist chips, linear progress. “Pele” RPG: ícones, XP, rótulos.
          </div>
        </footer>
      </div>
    </main>
  );
}
