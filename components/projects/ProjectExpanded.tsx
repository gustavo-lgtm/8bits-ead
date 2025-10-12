// components/projects/ProjectExpanded.tsx
"use client";

import type { Project } from "./ProjectsClient";

export default function ProjectExpanded({
  project,
  onContinue,
}: {
  project: Project;
  onContinue: () => void;
}) {
  const pct = Math.min(100, Math.round(project.gamification.xpPrimary)); // placeholder; depois mapeamos para meta real

  return (
    <section className="rounded-2xl border overflow-hidden">
      {/* imagem grande (expandido) */}
      <div className="aspect-[16/9] w-full bg-gray-200">
        {/* quando tiver posterWideUrl, use aqui */}
        {/* <img src={project.posterWideUrl!} alt="" className="h-full w-full object-cover" /> */}
      </div>

      {/* bloco de detalhes */}
      <div className="p-4 md:p-5 space-y-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">{project.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{project.description}</p>
        </div>

        {/* área de gamificação resumida */}
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>Pontuação principal</span>
            <span>{project.gamification.xpPrimary} XP</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-2 rounded-full bg-black transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Opcional: {project.gamification.xpOptional} XP
          </div>
        </div>

        {/* badges recentes (placeholder) */}
        {project.gamification.badgesTop && project.gamification.badgesTop.length > 0 && (
          <div className="flex gap-2">
            {project.gamification.badgesTop.map((b) => (
              <div key={b.id} className="rounded-lg border px-2 py-1 text-xs">
                {b.icon} {b.name}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="pt-2">
          <button
            onClick={onContinue}
            className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          >
            Continuar projeto
          </button>
        </div>
      </div>
    </section>
  );
}
