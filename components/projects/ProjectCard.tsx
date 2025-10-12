// components/projects/ProjectCard.tsx
"use client";

import type { Project } from "./ProjectsClient";
import clsx from "clsx";

export default function ProjectCard({
  project,
  selected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        "group text-left rounded-2xl border p-3 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20",
        selected && "border-black"
      )}
    >
      {/* imagem/card visual estreito */}
      <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-200">
        {/* quando tiver posterNarrowUrl, troque por <img ... /> ou next/image */}
        {/* <img src={project.posterNarrowUrl!} alt="" className="h-full w-full object-cover" /> */}
      </div>

      <div className="mt-3">
        <div className="line-clamp-2 text-sm font-semibold">{project.title}</div>
        <div className="mt-1 text-xs text-gray-500 line-clamp-2">{project.teaser}</div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
          <span>XP {project.gamification.xpPrimary}</span>
          <span className="opacity-70">Opcional {project.gamification.xpOptional}</span>
        </div>
      </div>
    </button>
  );
}
