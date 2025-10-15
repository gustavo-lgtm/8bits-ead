"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import YouTubeProgressPlayer from "@/components/video/YouTubeProgressPlayer";
import CompletionPopup from "@/components/CompletionPopup";
// se tiver um Lottie específico, importe o JSON:
// import trophyAnim from "@/assets/lottie/trophy.json";

const BRAND = "#ffab40";

type UnitClientProps = {
  courseSlug: string;
  moduleSlug: string;
  unit: {
    id: string;
    slug: string;
    title: string;
    description: string;
    youtubeId: string | null;
    thresholdPct: number;
    unitTypeLabel: "Obrigatória" | "Extra" | "Opcional";
    unitXP: number;
  };
  initialCompleted?: boolean;
};

export default function UnitClient({
  courseSlug,
  moduleSlug,
  unit,
  initialCompleted = false,
}: UnitClientProps) {
  const [watchedPct, setWatchedPct] = useState(0);
  const [canComplete, setCanComplete] = useState(initialCompleted);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isCompleting, setIsCompleting] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [awardedXp, setAwardedXp] = useState(initialCompleted ? unit.unitXP : 0);
  const [nextUnitSlug, setNextUnitSlug] = useState<string | null>(null);

  // debounce para salvar progresso
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef({ sec: 0, pct: 0 });

  const backHref = useMemo(() => `/c/${courseSlug}/${moduleSlug}`, [courseSlug, moduleSlug]);

  // NOVO: garantir persistência mesmo se o server não tiver sessão
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/units/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unitId: unit.id }),
        });
        if (!res.ok) return;
        const data: { isCompleted: boolean; watchedPct: number; unitXP: number } = await res.json();
        if (ignore) return;
        setIsCompleted(data.isCompleted);
        setCanComplete(data.isCompleted || data.watchedPct >= unit.thresholdPct);
        setAwardedXp(data.isCompleted ? (unit.unitXP ?? data.unitXP) : 0);
      } catch {}
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]); // roda 1x por unidade

  const onProgress = useCallback(
    (sec: number, pct: number) => {
      setWatchedPct(pct);
      if (!isCompleted && !canComplete && pct >= unit.thresholdPct) setCanComplete(true);

      // throttle debounced
      const secDelta = Math.floor(sec) - Math.floor(lastSentRef.current.sec);
      const pctDelta = pct - lastSentRef.current.pct;
      if (secDelta < 1 && pctDelta < 0.5) return;

      lastSentRef.current = { sec, pct };
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          await fetch("/api/units/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              unitId: unit.id,
              watchedSeconds: Math.floor(sec),
              watchedPct: pct,
            }),
          });
        } catch {}
      }, 400);
    },
    [canComplete, isCompleted, unit.id, unit.thresholdPct]
  );

  const onClickComplete = useCallback(async () => {
    if (!canComplete || isCompleting || isCompleted) return;
    setIsCompleting(true);
    try {
      const res = await fetch("/api/units/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: unit.id }),
      });
      if (!res.ok) { setIsCompleting(false); return; }
      const data: { awardedXp: number; nextUnitSlug: string | null } = await res.json();

      const xpToShow = data.awardedXp && data.awardedXp > 0 ? data.awardedXp : unit.unitXP;
      setAwardedXp(xpToShow);
      setNextUnitSlug(data.nextUnitSlug ?? unit.slug);
      setPopupOpen(true);
      setIsCompleted(true);
    } catch {
      setIsCompleting(false);
    }
  }, [canComplete, isCompleting, isCompleted, unit.id, unit.slug, unit.unitXP]);

  const goToNextUnits = useCallback(() => {
    const focus = nextUnitSlug ?? unit.slug;
    window.location.href = `/c/${courseSlug}/${moduleSlug}?focus=${encodeURIComponent(focus)}`;
  }, [courseSlug, moduleSlug, nextUnitSlug, unit.slug]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* topo: voltar */}
      <div className="mb-2 flex items-center justify-end">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
          title="Voltar para as unidades"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M15 19a1 1 0 0 1-.7-.29l-6-6a1 1 0 0 1 0-1.42l6-6A1 1 0 0 1 16.7 6.7L11.41 12l5.3 5.3A1 1 0 0 1 15 19z" />
          </svg>
          Voltar para as unidades
        </Link>
      </div>

      {/* título e descrição */}
      <div className="md:w-[620px]">
        <div className="text-xl font-bold">Unidade: {unit.title}</div>
        {unit.description ? (
          <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">{unit.description}</p>
        ) : (
          <p className="mt-1 text-[15px] leading-relaxed text-neutral-500">Sem descrição.</p>
        )}

        {/* XP da unidade */}
        <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-neutral-900">XP da Unidade</span>
            <span className="text-[16px] font-extrabold text-neutral-800">
              {isCompleted ? unit.unitXP : 0} / {unit.unitXP} XP
            </span>
          </div>
        </div>

        {/* tipo de unidade */}
        <div className="mt-3 text-sm text-neutral-700">
          Tipo de unidade: <span className="font-semibold">{unit.unitTypeLabel}</span>
        </div>

        {/* player SEM borda preta */}
        <div className="mt-4 rounded-3xl bg-neutral-100 p-2 sm:p-3">
          {unit.youtubeId ? (
            <div className="rounded-2xl overflow-hidden">
              <YouTubeProgressPlayer
                youtubeId={unit.youtubeId}
                thresholdPct={unit.thresholdPct}
                onProgress={onProgress}
                onThresholdReached={() => setCanComplete(true)}
                className="bg-transparent" // sem borda/sem fundo
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-neutral-200" />
          )}
        </div>

        {/* ação: botão ou badge */}
        <div className="mt-4">
          {isCompleted ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold shadow">
              <CheckCircle2 className="h-5 w-5" style={{ color: "#f59e0b" }} />
              <span>Unidade concluída</span>
            </div>
          ) : (
            <>
              <button
                onClick={onClickComplete}
                disabled={!canComplete || isCompleting}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition 
                  ${canComplete ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
                `}
                style={{
                  backgroundColor: canComplete ? BRAND : "#e5e7eb",
                  color: canComplete ? "#ffffff" : "#9ca3af",
                }}
              >
                {canComplete && <Check size={18} color="#ffffff" />}
                Concluir unidade
              </button>
              {!canComplete && (
                <div className="mt-2 text-xs text-neutral-500">
                  O botão habilita após assistir {unit.thresholdPct}% do vídeo.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* popup com Lottie opcional */}
      <CompletionPopup
        open={popupOpen}
        xp={awardedXp}
        onClose={() => setPopupOpen(false)}
        onGoNext={goToNextUnits}
        // lottieAnimation={trophyAnim}
      />
    </div>
  );
}
