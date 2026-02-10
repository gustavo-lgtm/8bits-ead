// app/c/[slug]/[module]/[unit]/UnitClient.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, ExternalLink } from "lucide-react";
import YouTubeProgressPlayer from "@/components/video/YouTubeProgressPlayer";
import CompletionPopup from "@/components/CompletionPopup";
import trophyAnim from "@/assets/lottie/trophy.json";

const BRAND = "#ffab40";

type UnitClientProps = {
  courseSlug: string;
  moduleSlug: string;
  unit: {
    id: string;
    slug: string;
    title: string;
    description: string;

    type: "VIDEO" | "DOC" | "LINK";
    youtubeId: string | null;
    thresholdPct: number;
    url: string | null;
    driveFileId: string | null;

    unitTypeLabel: "Obrigatória" | "Extra" | "Opcional";
    unitXP: number;
    moduleTitle?: string;
    courseTitle?: string;
  };
  initialCompleted?: boolean;
  initialWatchedPct?: number;
};

function extractUrlOrId(input: string) {
  const v = (input || "").trim();
  if (!v) return null;

  const looksUrl = /^https?:\/\//i.test(v);
  if (!looksUrl) {
    return { kind: "id" as const, id: v };
  }

  const m1 = v.match(/\/file\/d\/([^/]+)/i);
  if (m1?.[1]) return { kind: "id" as const, id: m1[1] };

  const m2 = v.match(/\/folders\/([^/?]+)/i);
  if (m2?.[1]) return { kind: "id" as const, id: m2[1] };

  const m3 = v.match(/[?&]id=([^&]+)/i);
  if (m3?.[1]) return { kind: "id" as const, id: decodeURIComponent(m3[1]) };

  return { kind: "url" as const, url: v };
}

function driveOpenLink(driveFileIdOrUrl: string) {
  const parsed = extractUrlOrId(driveFileIdOrUrl);
  if (!parsed) return null;
  if (parsed.kind === "url") return parsed.url;
  return `https://drive.google.com/open?id=${encodeURIComponent(parsed.id)}`;
}

// Remove pontuação comum no final de um link em texto
function splitTrailingPunctuation(raw: string) {
  // exemplo: "https://x.com/abc)." -> link="https://x.com/abc" tail=")."
  const m = raw.match(/^(.*?)([)\].,;:!?]+)$/);
  if (!m) return { link: raw, tail: "" };
  return { link: m[1], tail: m[2] };
}

function normalizeHref(raw: string) {
  const v = raw.trim();
  if (!v) return null;

  // já tem protocolo
  if (/^https?:\/\//i.test(v)) return v;

  // começa com www.
  if (/^www\./i.test(v)) return `https://${v}`;

  // domínios comuns sem protocolo (inclusive drive)
  if (/^(drive\.google\.com|docs\.google\.com)/i.test(v)) return `https://${v}`;

  return null;
}

function linkify(text: string): React.ReactNode[] {
  const t = text || "";
  if (!t.trim()) return [];

  // Captura:
  // - links com http/https
  // - links começando com www.
  // - links do Drive/Docs sem protocolo
  const urlRe =
    /((?:https?:\/\/|www\.)[^\s]+|(?:drive\.google\.com|docs\.google\.com)[^\s]+)/gi;

  const parts = t.split(urlRe);

  return parts.map((part, i) => {
    const hrefCandidate = normalizeHref(part);

    if (hrefCandidate) {
      const { link, tail } = splitTrailingPunctuation(hrefCandidate);
      const label = splitTrailingPunctuation(part).link; // mantém o que o usuário digitou (sem pontuação final)
      return (
        <span key={`u-${i}`}>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold text-neutral-800 hover:opacity-80"
          >
            {label}
          </a>
          {tail ? <span>{tail}</span> : null}
        </span>
      );
    }

    // texto normal, preserva quebras de linha
    const lines = part.split("\n");
    return (
      <span key={`t-${i}`}>
        {lines.map((ln, j) => (
          <span key={`l-${i}-${j}`}>
            {ln}
            {j < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </span>
    );
  });
}

export default function UnitClient({
  courseSlug,
  moduleSlug,
  unit,
  initialCompleted = false,
  initialWatchedPct = 0,
}: UnitClientProps) {
  const isVideo = unit.type === "VIDEO" && !!unit.youtubeId;

  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [watchedPct, setWatchedPct] = useState(initialWatchedPct);

  const [canComplete, setCanComplete] = useState<boolean>(() => {
    if (!isVideo) return true;
    return initialCompleted || initialWatchedPct >= unit.thresholdPct;
  });

  const [isCompleting, setIsCompleting] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [awardedXp, setAwardedXp] = useState(initialCompleted ? unit.unitXP : 0);
  const [nextUnitSlug, setNextUnitSlug] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef({ sec: 0, pct: 0 });

  const backHref = useMemo(
    () => `/c/${courseSlug}/${moduleSlug}`,
    [courseSlug, moduleSlug]
  );

  const driveLink = useMemo(() => {
    if (!unit.driveFileId) return null;
    return driveOpenLink(unit.driveFileId);
  }, [unit.driveFileId]);

  const externalLink = useMemo(() => {
    const u = (unit.url || "").trim();
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u}`;
  }, [unit.url]);

  // Busca status real
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
        const data: {
          isCompleted: boolean;
          watchedPct: number;
          unitXP: number;
        } = await res.json();
        if (ignore) return;

        const pct = Math.max(0, Math.min(100, data.watchedPct ?? 0));
        setWatchedPct(pct);
        setIsCompleted(data.isCompleted);

        if (isVideo) {
          setCanComplete(data.isCompleted || pct >= unit.thresholdPct);
        } else {
          setCanComplete(true);
        }

        setAwardedXp(data.isCompleted ? unit.unitXP : 0);
      } catch {}
    })();
    return () => {
      ignore = true;
    };
  }, [unit.id, unit.thresholdPct, unit.unitXP, isVideo]);

  // Tracking vídeo
  const onProgress = useCallback(
    (sec: number, pct: number) => {
      if (!isVideo) return;
      if (isCompleted) return;

      const pctClamped = Math.max(0, Math.min(100, pct));
      setWatchedPct(pctClamped);

      if (!canComplete && pctClamped >= unit.thresholdPct) {
        setCanComplete(true);
      }

      const secDelta = Math.floor(sec) - Math.floor(lastSentRef.current.sec);
      const pctDelta = pctClamped - lastSentRef.current.pct;
      if (secDelta < 1 && pctDelta < 0.5) return;

      lastSentRef.current = { sec, pct: pctClamped };
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await fetch("/api/units/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              unitId: unit.id,
              watchedSeconds: Math.floor(sec),
              watchedPct: pctClamped,
            }),
          });
        } catch {}
      }, 400);
    },
    [isVideo, canComplete, isCompleted, unit.id, unit.thresholdPct]
  );

  // Concluir
  const onClickComplete = useCallback(async () => {
    if (!canComplete || isCompleting || isCompleted) return;

    setIsCompleting(true);
    try {
      const res = await fetch("/api/units/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: unit.id }),
      });
      if (!res.ok) {
        setIsCompleting(false);
        return;
      }
      const data: { awardedXp: number; nextUnitSlug: string | null } =
        await res.json();

      const xpToShow =
        data.awardedXp && data.awardedXp > 0 ? data.awardedXp : unit.unitXP;

      setAwardedXp(xpToShow);
      setNextUnitSlug(data.nextUnitSlug ?? unit.slug);

      setIsCompleted(true);
      setPopupOpen(true);
    } catch {
      setIsCompleting(false);
    }
  }, [canComplete, isCompleting, isCompleted, unit.id, unit.slug, unit.unitXP]);

  const goToNextUnits = useCallback(() => {
    const focus = nextUnitSlug ?? unit.slug;
    window.location.href = `/c/${courseSlug}/${moduleSlug}?focus=${encodeURIComponent(
      focus
    )}`;
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M15 19a1 1 0 0 1-.7-.29l-6-6a1 1 0 0 1 0-1.42l6-6A1 1 0 0 1 16.7 6.7L11.41 12l5.3 5.3A1 1 0 0 1 15 19z" />
          </svg>
          Voltar para as unidades
        </Link>
      </div>

      {/* cabeçalho hierárquico */}
      <div className="text-xs text-neutral-500">
        UNIDADE • {unit.courseTitle || "Curso"} • {unit.moduleTitle || "Módulo"}
      </div>

      {/* título e descrição */}
      <div className="md:w-[620px] mt-1">
        <div className="text-2xl font-bold">{unit.title}</div>

        {unit.description ? (
          <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
            {linkify(unit.description)}
          </p>
        ) : (
          <p className="mt-1 text-[15px] leading-relaxed text-neutral-500">
            Sem descrição.
          </p>
        )}

        {/* Materiais (Drive / Link) */}
        {(driveLink || externalLink) && (
          <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
            <div className="text-[13px] font-semibold text-neutral-900">
              Materiais da unidade
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {driveLink && (
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                >
                  <ExternalLink size={16} />
                  Abrir no Google Drive
                </a>
              )}

              {externalLink && (
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                >
                  <ExternalLink size={16} />
                  Abrir link
                </a>
              )}
            </div>

            <div className="mt-2 text-xs text-neutral-500">
              Dica: Acesse o conteúdo no Google Drive e baixe os arquivos
              desejados.
            </div>
          </div>
        )}

        {/* XP */}
        <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-neutral-900">
              XP da Unidade
            </span>
            <span className="text-[16px] font-extrabold text-neutral-800">
              {isCompleted ? unit.unitXP : 0} / {unit.unitXP} XP
            </span>
          </div>
        </div>

        {/* tipo */}
        <div className="mt-3 text-sm text-neutral-700">
          Tipo de unidade:{" "}
          <span className="font-semibold">{unit.unitTypeLabel}</span>
        </div>

        {/* Conteúdo */}
        {isVideo && (
          <div className="mt-4 rounded-2xl overflow-hidden">
            <YouTubeProgressPlayer
              youtubeId={unit.youtubeId!}
              thresholdPct={unit.thresholdPct}
              onProgress={onProgress}
              onThresholdReached={() => {}}
              className="bg-transparent"
            />
          </div>
        )}

        {/* ação */}
        <div className="mt-4">
          {isCompleted ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold shadow">
              <CheckCircle2
                className="h-5 w-5"
                style={{ color: "#f59e0b" }}
              />
              <span>Unidade concluída</span>
            </div>
          ) : (
            <>
              <button
                onClick={onClickComplete}
                disabled={!canComplete || isCompleting}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition ${
                  canComplete ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                }`}
                style={{
                  backgroundColor: canComplete ? BRAND : "#e5e7eb",
                  color: canComplete ? "#ffffff" : "#9ca3af",
                }}
                aria-disabled={!canComplete || isCompleting}
              >
                {canComplete && <Check size={18} color="#ffffff" />}
                Concluir unidade
              </button>

              {isVideo && !canComplete && (
                <div className="mt-2 text-xs text-neutral-500">
                  O botão habilita após assistir {unit.thresholdPct}% do vídeo.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* pop-up */}
      <CompletionPopup
        open={popupOpen}
        xp={awardedXp}
        onClose={() => setPopupOpen(false)}
        onGoNext={goToNextUnits}
        lottieAnimation={trophyAnim}
        lottieSize={128}
        lottieSpeed={0.6}
        xpDelayMs={1000}
        xpCountDurationMs={1200}
      />
    </div>
  );
}
