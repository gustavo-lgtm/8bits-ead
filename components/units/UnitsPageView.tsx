// components/units/UnitsPageView.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { UnitsPageData } from "@/lib/unitsData";
import { CheckCircle2, Stars, CircleDashed } from "lucide-react";

const BRAND = "#ffab40";

function pct(x: number, t: number) {
  return t > 0 ? Math.min(110, Math.round((x / t) * 100)) : 0;
}

export default function UnitsPageView({ data }: { data: UnitsPageData }) {
  const [i, setI] = useState(data.selectedIndex);
  const u = data.units[i];

  // ---- carrossel sem setas — auto-scroll ao encostar nas bordas ----
  const stripRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<(-1 | 0 | 1)>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const step = () => {
      const el = stripRef.current;
      if (el && dirRef.current !== 0) el.scrollLeft += dirRef.current * 6;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const EDGE = 36;
    dirRef.current = x < EDGE ? -1 : x > r.width - EDGE ? 1 : 0;
  };
  const onLeave = () => (dirRef.current = 0);

  // ---- badges de topo (detalhe) ----
  const isExtra = !!u.isExtra;
  const isOptional = !!u.isOptional;
  const isCompleted = !!u.completed;

  return (
    <section className="text-neutral-900">
      {/* voltar para o módulo */}
      <div className="mb-2 flex items-center justify-end">
        <Link
          href={`/c/${data.course.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
          title="Voltar para o módulo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M15 19a1 1 0 0 1-.7-.29l-6-6a1 1 0 0 1 0-1.42l6-6A1 1 0 0 1 16.7 6.7L11.41 12l5.3 5.3A1 1 0 0 1 15 19z" />
          </svg>
          Voltar para o módulo
        </Link>
      </div>

      {/* detalhes (largura como projetos/módulos) */}
      <div className="md:w-[462px]">
        <div className="text-xs text-neutral-500">
          UNIDADE • {data.course.title} · {data.module.title}
        </div>
        <div className="mt-1 text-2xl font-bold">{u.title}</div>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
          {u.description || "Sem descrição."}
        </p>

        {/* XP da unidade */}
        <div className="mt-4 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-neutral-900">XP da unidade</span>
            <span className="text-[13px] font-semibold text-neutral-900">
              {u.xpPrimary}
              {u.xpTargetPrimary > 0 ? ` / ${u.xpTargetPrimary}` : ""} XP
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-2 rounded-full transition-[width] duration-500"
              style={{ width: `${pct(u.xpPrimary, u.xpTargetPrimary)}%`, backgroundColor: BRAND }}
            />
          </div>
          <div className="mt-2 text-xs text-neutral-700">
            Tipo:{" "}
            {isOptional ? (
              <span title="Não conta para o XP principal do projeto" className="font-semibold">
                Opcional
              </span>
            ) : isExtra ? (
              <span title="Conta para o XP principal e é classificada como Extra" className="font-semibold">
                Extra
              </span>
            ) : (
              <span className="font-semibold">Obrigatória</span>
            )}
          </div>
        </div>

        {/* identificadores da unidade (igual lógica da página de módulos) */}
        <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="text-xs text-neutral-500 mb-2">Identificadores da unidade</div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2" title="Unidade concluída">
              <CheckCircle2
                className={`h-5 w-5 ${isCompleted ? "" : "text-neutral-400"}`}
                style={isCompleted ? { color: "#f59e0b" } : {}}
              />
              <span>Concluída</span>
            </div>

            {/* Extra: só renderiza se for extra */}
            {isExtra && (
              <div
                className="flex items-center gap-2"
                title="Esta unidade é Extra (vale XP principal)"
              >
                <Stars className="h-5 w-5" style={{ color: "#0ea5e9" }} />
                <span>Extra</span>
              </div>
            )}

            {/* Opcional: só renderiza se for opcional */}
            {isOptional && (
              <div
                className="flex items-center gap-2"
                title="Opcional (não entra no XP principal do projeto)"
              >
                <CircleDashed className="h-5 w-5" style={{ color: "#10b981" }} />
                <span>Opcional</span>
              </div>
            )}
          </div>
        </div>

        {/* botão acessar unidade */}
        <div className="mt-4">
          <Link
            href={`/c/${data.course.slug}/${data.module.slug}/${u.slug}`}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: BRAND, color: "#ffffff" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="#ffffff">
              <path d="M8 5l12 7-12 7V5z" />
            </svg>
            Acessar unidade
          </Link>
        </div>
      </div>

      {/* carrossel de unidades */}
      <div className="mt-6">
        <div className="mb-2 text-[18px] md:text-[20px] font-bold">Unidades</div>

        <div
          ref={stripRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        >
          {data.units.map((it, idx) => {
            const active = idx === i;
            const p = pct(it.xpPrimary, it.xpTargetPrimary);
            const itCompleted = !!it.completed;
            const itExtra = !!it.isExtra;
            const itOptional = !!it.isOptional;

            return (
              <button
                key={it.id}
                onClick={() => setI(idx)}
                className={`relative aspect-video w-[280px] shrink-0 overflow-hidden rounded-2xl border bg-white shadow transition cursor-pointer ${
                  active ? "border-4" : "border"
                }`}
                style={active ? { borderColor: "#bf4eda" } : { borderColor: "#d4d4d8" }}
                //style={active ? { borderColor: "#363636" } : { borderColor: "#d4d4d8" }}

                
                title={it.title}
              >
                {/* imagem */}
                <div className="absolute inset-0 bg-neutral-100" />
                {it.posterUrl ? (
                  <img src={it.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-neutral-400 text-sm bg-neutral-100">
                    sem imagem
                  </div>
                )}

                {/* badges canto superior direito (iguais aos módulos) */}
                <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold shadow">
                  {/* concluída: sempre mostramos o ✓ */}
                  <span
                    className={`rounded-full px-1.5 py-0.5 ${
                      itCompleted ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-400"
                    }`}
                    title={itCompleted ? "Unidade concluída" : "Unidade não concluída"}
                  >
                    ✓
                  </span>

                  {/* extra: só renderiza se for extra */}
                  {itExtra && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 ${
                        itCompleted ? "bg-sky-100 text-sky-700" : "bg-neutral-100 text-neutral-400"
                      }`}
                      title="Unidade Extra"
                    >
                      ✦
                    </span>
                  )}

                  {/* opcional: só renderiza se for opcional */}
                  {itOptional && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 ${
                        itCompleted ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"
                      }`}
                      title="Unidade Opcional"
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
                    {it.title}
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                    <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: BRAND }} />
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
