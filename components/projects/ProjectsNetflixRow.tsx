"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Target, Stars } from "lucide-react";

type RowItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  posterWideUrl: string;
  posterNarrowUrl: string;

  // 🔹 novos
  category: "GAME_DEV" | "ROBOTIC" | "MAKER" | "AI" | "DIGITAL";
  level: "N1" | "N2" | "N3";

  xpPrimary: number;
  xpOptional: number;
  xpTargetPrimary: number;
  xpTargetOptional: number;

  totalRequiredUnits: number;
  completedRequiredUnits: number;
  totalExtraUnits: number;
  completedExtraUnits: number;

  href: string;
};

const BRAND = "#ffab40";
const ROW_H = 260;
const WIDE_W = Math.round(ROW_H * (16 / 9));
const NARROW_W = Math.round(ROW_H * (2 / 3));

function computePct(xp: number, target: number) {
  const pct = target > 0 ? Math.round((xp / target) * 100) : 0;
  return Math.max(0, Math.min(110, pct));
}
function levelFromPct(clampedPct: number) {
  if (clampedPct >= 100) return { lv: 5 as const, label: "Mythic" };
  if (clampedPct >= 75)  return { lv: 4 as const, label: "Elite" };
  if (clampedPct >= 50)  return { lv: 3 as const, label: "Vanguard" };
  if (clampedPct >= 25)  return { lv: 2 as const, label: "Ranger" };
  return { lv: 1 as const, label: "Scout" };
}
function LevelIconEmoji({ lv }: { lv: 1|2|3|4|5 }) {
  const map: Record<number, string> = { 1: "⭐", 2: "🛡️", 3: "🏅", 4: "👑", 5: "💎" };
  return <span className="text-base leading-none">{map[lv]}</span>;
}
function masteryTierFromPct(c: number): 0|1|2|3 { if (c>=110) return 3; if (c>=100) return 2; if (c>=80) return 1; return 0; }
function masteryColor(t: 0|1|2|3) { return ["text-neutral-400","text-emerald-600","text-violet-600","text-fuchsia-600"][t]; }

// 🔹 mapa de ícones p/ categoria
function categoryIcon(cat: RowItem["category"]) {
  switch (cat) {
    case "GAME_DEV": return "🎮";
    case "ROBOTIC": return "🤖";
    case "MAKER": return "🛠️";
    case "AI": return "🧠";
    case "DIGITAL": return "👾";    
    default: return "📦";
  }
}

export default function ProjectsNetflixRow({ items }: { items: RowItem[] }) {
  const projects = useMemo(() => items ?? [], [items]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = projects[selectedIndex];

  const rightScrollRef = useRef<HTMLDivElement>(null);
  const right = useMemo(() => projects.filter((_, i) => i !== selectedIndex), [projects, selectedIndex]);
  const handleSelectByIndex = (idx: number) => {
    setSelectedIndex(idx);
    if (rightScrollRef.current) rightScrollRef.current.scrollLeft = 0;
  };

  if (!projects.length) {
    return (
      <div className="rounded-xl border border-neutral-300 bg-white p-6 text-sm text-neutral-700 shadow-lg">
        Você ainda não tem projetos.
      </div>
    );
  }

  // dados selecionado
  const xp = selected.xpPrimary;
  const xpTarget = selected.xpTargetPrimary;
  const clamped = computePct(xp, xpTarget);
  const { lv, label } = levelFromPct(clamped);
  const overflow = clamped > 100 ? clamped - 100 : 0;

  const hasProjetoConcluido =
    selected.totalRequiredUnits > 0 &&
    selected.completedRequiredUnits >= selected.totalRequiredUnits;
  const masteryTier = masteryTierFromPct(clamped);
  const hasExtras =
    selected.totalExtraUnits > 0 &&
    selected.completedExtraUnits >= selected.totalExtraUnits;

  return (
    <section className="select-none text-neutral-900">
      {/* Desktop */}
      <div className="hidden md:flex gap-3">
        {/* Card estendido */}
        <button
          onClick={() => (window.location.href = selected.href)}
          className="relative overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-lg hover:shadow-xl transition"
          style={{ height: ROW_H, width: WIDE_W, flex: "0 0 auto" }}
          aria-label={`Abrir ${selected.title}`}
          title={selected.title}
        >
          <div className="absolute inset-0 bg-neutral-100" />
          {selected.posterWideUrl && (
            <img src={selected.posterWideUrl} alt={selected.title} className="absolute inset-0 h-full w-full object-cover" />
          )}
          {/* chip lv no card */}
          <div className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur px-2 py-1 text-[12px] border border-neutral-300 flex items-center gap-1 shadow-lg">
            <LevelIconEmoji lv={lv} />
            <span className="font-semibold">
              Lv {lv} • {label}{overflow>0?` (+${overflow}%)`:""}
            </span>
          </div>
        </button>

        {/* Posters à direita */}
        <div className="flex-1">
          <div
            ref={rightScrollRef}
            className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2"
            style={{ height: ROW_H }}
          >
            {right.map((it) => {
              const realIdx = projects.findIndex((p) => p.id === it.id);
              return (
                <button
                  key={it.id}
                  onClick={() => handleSelectByIndex(realIdx)}
                  className="relative overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-lg hover:shadow-xl transition"
                  style={{ height: ROW_H, width: NARROW_W, flex: "0 0 auto" }}
                  title={it.title}
                >
                  {it.posterNarrowUrl ? (
                    <img src={it.posterNarrowUrl} alt={it.title} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <div className="text-neutral-900 text-sm font-semibold">{it.title}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile (herói + carrossel) */}
      <div className="md:hidden">
        <button
          onClick={() => (window.location.href = selected.href)}
          className="relative w-full overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-lg"
          aria-label={`Abrir ${selected.title}`}
          title={selected.title}
        >
          <div className="aspect-video w-full bg-neutral-100">
            {selected.posterWideUrl && (
              <img src={selected.posterWideUrl} alt={selected.title} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur px-2 py-1 text-[12px] border border-neutral-300 flex items-center gap-1 shadow-lg">
            <LevelIconEmoji lv={lv} />
            <span className="font-semibold">
              Lv {lv} • {label}{overflow>0?` (+${overflow}%)`:""}
            </span>
          </div>
        </button>

        <div className="mt-3 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
          {projects.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setSelectedIndex(idx)}
              className={`snap-center shrink-0 overflow-hidden rounded-xl border bg-white shadow-md transition ${
                idx===selectedIndex ? "border-neutral-900" : "border-neutral-300"
              }`}
              style={{ width: 120 }}
              title={it.title}
            >
              <div className="h-40 w-full bg-neutral-100">
                {it.posterNarrowUrl && (
                  <img src={it.posterNarrowUrl} alt={it.title} className="h-full w-full object-cover" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detalhes (prefixa com Categoria + Nível) */}
      <div className="mt-5 md:w-[462px]">
        <div className="flex items-center gap-2 text-sm">
          {/* Ícone e categoria */}
          <span className="text-base">{categoryIcon(selected.category)}</span>
          <span className="font-semibold text-neutral-900">
            {selected.title}
          </span>
          {/* Chip de nível à frente do nome */}
          <span className="ml-2 inline-flex items-center rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-semibold shadow">
            {selected.level}
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
          {selected.description}
        </p>

        {/* XP principal */}
        <div className="mt-4 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-neutral-900">XP do projeto</span>
            <span className="text-[13px] font-semibold text-neutral-900">
              {selected.xpPrimary}{selected.xpTargetPrimary > 0 ? ` / ${selected.xpTargetPrimary}` : ""} XP
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-2 rounded-full transition-[width] duration-500"
              style={{ width: `${Math.min(110, computePct(selected.xpPrimary, selected.xpTargetPrimary))}%`, backgroundColor: BRAND }}
            />
          </div>
          <div className="mt-3 text-xs text-neutral-700">
            XP Opcional: <span className="text-neutral-900">{selected.xpOptional} / {selected.xpTargetOptional} XP</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="text-xs text-neutral-500 mb-2">Conquistas do projeto</div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={hasProjetoConcluido ? "h-5 w-5" : "h-5 w-5 text-neutral-400"} style={hasProjetoConcluido ? { color: "#f59e0b" } : {}} />
              <span className="text-neutral-800">Projeto Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className={`h-5 w-5 ${masteryColor(masteryTier)}`} />
              <span className="text-neutral-800">{masteryTier === 0 ? "Maestria" : `Maestria ${["","I","II","III"][masteryTier]}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Stars className={hasExtras ? "h-5 w-5" : "h-5 w-5 text-neutral-400"} style={hasExtras ? { color: "#0ea5e9" } : {}} />
              <span className="text-neutral-800">Extras</span>
            </div>
          </div>
        </div>

        {/* Botão */}
        <div className="mt-4">
          <Link
            href={selected.href}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg hover:opacity-95"
            style={{ backgroundColor: BRAND, color: "#ffffff" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="#ffffff">
              <path d="M8 5l12 7-12 7V5z" />
            </svg>
            Acessar projeto
          </Link>
        </div>
      </div>
    </section>
  );
}
