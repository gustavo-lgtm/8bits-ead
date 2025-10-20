// components/modules/ModulesPageView.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Stars, CircleDashed } from "lucide-react";
import type { ModulesPageData } from "@/lib/modulesData";

const BRAND = "#ffab40";

function pct(x: number, t: number) {
  return t > 0 ? Math.min(110, Math.round((x / t) * 100)) : 0;
}

export default function ModulesPageView({ data }: { data: ModulesPageData }) {
  const [index, setIndex] = useState(data.selectedIndex);
  const modules = data.modules;
  const selected = modules[index];

  // ----- flags do módulo selecionado -----
  const sel: any = selected as any;
  const hasConcluido =
    selected.totalRequiredUnits > 0 &&
    selected.completedRequiredUnits >= selected.totalRequiredUnits;

  const hasAnyExtras = (sel.totalExtraUnits ?? 0) > 0;
  const hasExtrasDone =
    (sel.totalExtraUnits ?? 0) > 0 &&
    (sel.completedExtraUnits ?? 0) >= (sel.totalExtraUnits ?? 0);

  const hasAnyOptional = (sel.totalOptionalUnits ?? 0) > 0;
  const hasOptionalDone =
    (sel.totalOptionalUnits ?? 0) > 0 &&
    (sel.completedOptionalUnits ?? 0) >= (sel.totalOptionalUnits ?? 0);

  // ----- carrossel sem setas (auto-scroll nos cantos) -----
  const stripRef = useRef<HTMLDivElement>(null);
  const edgeDirRef = useRef<(-1 | 0 | 1)>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const step = () => {
      const el = stripRef.current;
      if (el && edgeDirRef.current !== 0) {
        el.scrollLeft += edgeDirRef.current * 6;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const onMouseMoveStrip = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const EDGE = 36;
    edgeDirRef.current = x < EDGE ? -1 : x > r.width - EDGE ? 1 : 0;
  };
  const onMouseLeaveStrip = () => (edgeDirRef.current = 0);

  return (
    <section className="text-neutral-900">
      {/* topo: voltar */}
      <div className="mb-2 flex items-center justify-end">
        <Link
          href="/cursos"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
          title="Voltar para o projeto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M15 19a1 1 0 0 1-.7-.29l-6-6a1 1 0 0 1 0-1.42l6-6A1 1 0 0 1 16.7 6.7L11.41 12l5.3 5.3A1 1 0 0 1 15 19z" />
          </svg>
          Voltar para o projeto
        </Link>
      </div>

      {/* detalhes (sem card agrupador) */}
      <div className="md:w-[462px]">
        <div className="text-xs text-neutral-500">MÓDULO • {data.course.title}</div>
        <div className="mt-1 text-2xl font-bold">{selected.title}</div>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
          {selected.description || "Sem descrição."}
        </p>

        {/* XP principal */}
        <div className="mt-4 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-neutral-900">XP do módulo</span>
            <span className="text-[13px] font-semibold text-neutral-900">
              {selected.xpPrimary}
              {selected.xpTargetPrimary > 0 ? ` / ${selected.xpTargetPrimary}` : ""} XP
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-2 rounded-full transition-[width] duration-500"
              style={{
                width: `${pct(selected.xpPrimary, selected.xpTargetPrimary)}%`,
                backgroundColor: BRAND,
              }}
            />
          </div>
          <div className="mt-2 text-xs text-neutral-700">
            XP Opcional:{" "}
            <span className="font-semibold text-neutral-900">
              {selected.xpOptional} / {selected.xpTargetOptional} XP
            </span>
          </div>
        </div>

        {/* conquistas do módulo */}
        <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="text-xs text-neutral-500 mb-2">Conquistas do módulo</div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`h-5 w-5 ${hasConcluido ? "" : "text-neutral-400"}`}
                style={hasConcluido ? { color: "#f59e0b" } : {}}
              />
              <span>Módulo Concluído</span>
            </div>

            {hasAnyExtras && (
              <div className="flex items-center gap-2">
                <Stars
                  className={`h-5 w-5 ${hasExtrasDone ? "" : "text-neutral-400"}`}
                  style={hasExtrasDone ? { color: "#0ea5e9" } : {}}
                />
                <span>Extras</span>
              </div>
            )}

            {hasAnyOptional && (
              <div className="flex items-center gap-2">
                <CircleDashed
                  className={`h-5 w-5 ${hasOptionalDone ? "" : "text-neutral-400"}`}
                  style={hasOptionalDone ? { color: "#10b981" } : {}}
                />
                <span>Opcionais</span>
              </div>
            )}
          </div>
        </div>

        {/* botão */}
        <div className="mt-4">
          <Link
            href={`/c/${data.course.slug}/${selected.slug}`}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: BRAND, color: "#ffffff" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="#ffffff">
              <path d="M8 5l12 7-12 7V5z" />
            </svg>
            Acessar módulo
          </Link>
        </div>
      </div>

      {/* carrossel */}
      <div className="mt-6">
        <div className="mb-2 text-[18px] md:text-[20px] font-bold">Módulos</div>

        <div
          ref={stripRef}
          onMouseMove={onMouseMoveStrip}
          onMouseLeave={onMouseLeaveStrip}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        >
          {modules.map((m, i) => {
            const mAny: any = m as any;

            const active = i === index;
            const p = pct(m.xpPrimary, m.xpTargetPrimary);

            const concl =
              m.totalRequiredUnits > 0 &&
              m.completedRequiredUnits >= m.totalRequiredUnits;

            const hasAnyExtrasCard = (mAny.totalExtraUnits ?? 0) > 0;
            const extrasDone =
              (mAny.totalExtraUnits ?? 0) > 0 &&
              (mAny.completedExtraUnits ?? 0) >= (mAny.totalExtraUnits ?? 0);

            const hasAnyOptionalCard = (mAny.totalOptionalUnits ?? 0) > 0;
            const optionalDone =
              (mAny.totalOptionalUnits ?? 0) > 0 &&
              (mAny.completedOptionalUnits ?? 0) >= (mAny.totalOptionalUnits ?? 0);

            return (
              <button
                key={m.id}
                onClick={() => setIndex(i)}
                className={`relative aspect-video w-[280px] shrink-0 overflow-hidden rounded-2xl border bg-white shadow transition cursor-pointer ${
                  active ? "border-4" : "border"
                }`}
                style={active ? { borderColor: "#bf4eda" } : { borderColor: "#d4d4d8" }}

                title={m.title}
              >
                {/* imagem */}
                <div className="absolute inset-0 bg-neutral-100" />
                {m.posterUrl ? (
                  <img
                    src={m.posterUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400 bg-neutral-100">
                    sem imagem
                  </div>
                )}

                {/* badges canto superior direito */}
                <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold shadow">
                  {/* concluído */}
                  <span
                    className={`rounded-full px-1.5 py-0.5 ${
                      concl ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-400"
                    }`}
                    title="Módulo Concluído"
                  >
                    ✓
                  </span>

                  {/* extra: só se existir */}
                  {hasAnyExtrasCard && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 ${
                        extrasDone ? "bg-sky-100 text-sky-700" : "bg-neutral-100 text-neutral-400"
                      }`}
                      title="Extras concluídos"
                    >
                      ✦
                    </span>
                  )}

                  {/* opcional: só se existir */}
                  {hasAnyOptionalCard && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 ${
                        optionalDone ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"
                      }`}
                      title="Opcionais concluídos"
                    >
                      ○
                    </span>
                  )}
                </div>

                {/* Título branco + barra */}
                <div className="absolute left-3 right-3 bottom-5">
                  <div
                    className="mb-1 text-[16px] md:text-[17px] font-semibold text-white pl-1.5 text-left"
                    style={{
                      textShadow:
                        "0 1px 0 rgba(0,0,0,.95), 0 0 2px rgba(0,0,0,.85), 0 0 6px rgba(0,0,0,.55)",
                    }}
                  >
                    {m.title}
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p}%`, backgroundColor: BRAND }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
