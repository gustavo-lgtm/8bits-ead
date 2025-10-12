// components/projects/ProjectsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ProjectExpanded from "./ProjectExpanded";
import ProjectCard from "./ProjectCard";

export type Project = {
  id: string;
  slug: string;
  title: string;
  teaser: string;
  posterNarrowUrl: string | null;
  posterWideUrl: string | null;
  description: string;
  gamification: {
    xpPrimary: number;
    xpOptional: number;
    badgesTop?: { id: string; name: string; icon: string }[];
  };
  isLocked?: boolean;
  ctaHref: string;
};

export default function ProjectsClient({ projects }: { projects: Project[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Seleciona o primeiro por padrão
  useEffect(() => {
    if (projects.length && !selectedId) {
      setSelectedId(projects[0].id);
    }
  }, [projects, selectedId]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  return (
    <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(280px,1fr)_minmax(380px,2fr)]">
      {/* Coluna esquerda — expandido */}
      <div>
        {selected ? (
          <ProjectExpanded
            project={selected}
            onContinue={() => {
              window.location.href = selected.ctaHref;
            }}
          />
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-gray-500">
            Selecione um projeto à direita para ver detalhes.
          </div>
        )}
      </div>

      {/* Coluna direita — cards estreitos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            selected={p.id === selectedId}
            onSelect={() => setSelectedId(p.id)}
          />
        ))}
      </div>
    </section>
  );
}
