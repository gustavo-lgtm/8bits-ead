"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Save,
} from "lucide-react";
import YouTubeProgressPlayer from "@/components/video/YouTubeProgressPlayer";
import CompletionPopup from "@/components/CompletionPopup";
import trophyAnim from "@/assets/lottie/trophy.json";

const BRAND = "#ffab40";
const MAX_FILES = 5;
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

type UnitClientProps = {
  courseSlug: string;
  moduleSlug: string;
  unit: {
    id: string;
    slug: string;
    title: string;
    description: string;

    type: "VIDEO" | "DOC" | "LINK" | "ACTIVITY";
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
  if (!looksUrl) return { kind: "id" as const, id: v };

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

function splitTrailingPunctuation(raw: string) {
  const m = raw.match(/^(.*?)([)\].,;:!?]+)$/);
  if (!m) return { link: raw, tail: "" };
  return { link: m[1], tail: m[2] };
}

function normalizeHref(raw: string) {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^www\./i.test(v)) return `https://${v}`;
  if (/^(drive\.google\.com|docs\.google\.com)/i.test(v)) return `https://${v}`;
  return null;
}

function linkify(text: string): React.ReactNode[] {
  const t = text || "";
  if (!t.trim()) return [];

  const urlRe =
    /((?:https?:\/\/|www\.)[^\s]+|(?:drive\.google\.com|docs\.google\.com)[^\s]+)/gi;

  const parts = t.split(urlRe);

  return parts.map((part, i) => {
    const hrefCandidate = normalizeHref(part);

    if (hrefCandidate) {
      const { link, tail } = splitTrailingPunctuation(hrefCandidate);
      const label = splitTrailingPunctuation(part).link;
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

/* =========================
   ACTIVITY helpers
========================= */

type UploadedBlob = {
  url: string;
  pathname: string; // chave estável para deletar no Blob
  contentType: string;
  sizeBytes: number;
  fileName: string;
  kind: "FILE" | "IMAGE" | "VIDEO";
};

function kindFromMime(mime: string | null | undefined): UploadedBlob["kind"] {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "IMAGE";
  if (m.startsWith("video/")) return "VIDEO";
  return "FILE";
}

function kindIcon(kind: UploadedBlob["kind"]) {
  if (kind === "IMAGE") return <ImageIcon className="h-5 w-5" />;
  if (kind === "VIDEO") return <VideoIcon className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function fmtMB(bytes: number) {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb * 10) / 10} MB`;
}

export default function UnitClient({
  courseSlug,
  moduleSlug,
  unit,
  initialCompleted = false,
  initialWatchedPct = 0,
}: UnitClientProps) {
  const isVideo = unit.type === "VIDEO" && !!unit.youtubeId;
  const isActivity = unit.type === "ACTIVITY";

  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [watchedPct, setWatchedPct] = useState(initialWatchedPct);

  const [earnedXp, setEarnedXp] = useState<number>(() =>
    initialCompleted ? unit.unitXP : 0
  );

  const [canComplete, setCanComplete] = useState<boolean>(() => {
    if (isActivity) return false;
    if (!isVideo) return true;
    return initialCompleted || initialWatchedPct >= unit.thresholdPct;
  });

  const [isCompleting, setIsCompleting] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [awardedXp, setAwardedXp] = useState(0);
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

  // =========================
  // ACTIVITY state
  // =========================
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activityNotes, setActivityNotes] = useState("");
  const [activityUploads, setActivityUploads] = useState<UploadedBlob[]>([]);
  const [activityBusy, setActivityBusy] = useState(false);
  const [activitySaving, setActivitySaving] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityInfo, setActivityInfo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // MVP: editável mesmo após concluir (até professor corrigir).
  // No futuro, você vai trocar isso por um flag vindo do backend (ex.: submission.reviewStatus).
  const activityEditable = isActivity;

  useEffect(() => {
    if (!isActivity) return;
    setCanComplete(activityUploads.length > 0 && !activityBusy && !isCompleting);
  }, [isActivity, activityUploads.length, activityBusy, isCompleting]);

  const validateFiles = useCallback(
    (files: File[]) => {
      const remaining = Math.max(0, MAX_FILES - activityUploads.length);
      if (remaining <= 0) {
        return {
          ok: false as const,
          message: `Limite atingido: no máximo ${MAX_FILES} arquivos.`,
        };
      }

      const take = files.slice(0, remaining);
      for (const f of take) {
        if (f.size > MAX_BYTES) {
          return {
            ok: false as const,
            message: `Arquivo grande demais: "${f.name}" (${fmtMB(
              f.size
            )}). Máximo ${fmtMB(MAX_BYTES)}.`,
          };
        }
      }

      return { ok: true as const, files: take };
    },
    [activityUploads.length]
  );

  const uploadOne = useCallback(
    async (file: File) => {
      setActivityError(null);
      setActivityInfo(null);
      setActivityBusy(true);

      try {
        const fd = new FormData();
        fd.append("unitId", unit.id);
        fd.append("file", file);

        const res = await fetch("/api/activity/upload", {
          method: "POST",
          body: fd,
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            json?.error ||
            (res.status === 413
              ? `Arquivo grande demais (máx ${fmtMB(MAX_BYTES)}).`
              : `Falha no upload (${res.status}).`);
          throw new Error(msg);
        }

        const blob = json?.blob as Partial<UploadedBlob> | undefined;
        if (!blob?.url || !blob?.pathname) {
          throw new Error("Falha no upload: resposta inválida.");
        }

        const contentType = String(blob.contentType || file.type || "");
        const fileName = String(blob.fileName || file.name || "arquivo");

        const normalized: UploadedBlob = {
          url: String(blob.url),
          pathname: String(blob.pathname),
          contentType,
          sizeBytes: Number(blob.sizeBytes ?? file.size ?? 0),
          fileName,
          kind: (blob.kind as any) || kindFromMime(contentType),
        };

        setActivityUploads((prev) => [normalized, ...prev]);
      } catch (e: any) {
        setActivityError(String(e?.message || e));
      } finally {
        setActivityBusy(false);
      }
    },
    [unit.id]
  );

  const onAddFiles = useCallback(
    async (filesRaw: FileList | File[]) => {
      const files = Array.from(filesRaw || []);
      if (files.length === 0) return;

      const v = validateFiles(files);
      if (!v.ok) {
        setActivityError(v.message || "Arquivos inválidos.");
        return;
      }

      for (const f of v.files!) {
        await uploadOne(f);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadOne, validateFiles]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!isActivity || !activityEditable) return;

      const dt = e.dataTransfer;
      if (!dt?.files?.length) return;

      await onAddFiles(dt.files);
    },
    [isActivity, onAddFiles, activityEditable]
  );

  // remove (DB + Blob) via /api/activity/save (vamos criar no passo 2)
  const removeAttachment = useCallback(
    async (pathname: string) => {
      if (!activityEditable) return;
      setActivityError(null);
      setActivityInfo(null);

      // otimista
      setActivityUploads((prev) => prev.filter((u) => u.pathname !== pathname));

      try {
        const remaining = activityUploads
          .filter((u) => u.pathname !== pathname)
          .map((u) => ({
            url: u.url,
            pathname: u.pathname,
            fileName: u.fileName,
            mimeType: u.contentType || null,
            sizeBytes: u.sizeBytes || null,
            kind: u.kind,
          }));

        const res = await fetch("/api/activity/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitId: unit.id,
            notes: activityNotes || "",
            attachments: remaining,
            deletePathnames: [pathname],
          }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || "Falha ao remover o anexo.");
        }
        setActivityInfo("Entrega atualizada.");
      } catch (e: any) {
        setActivityError(String(e?.message || e));
      }
    },
    [activityEditable, activityNotes, activityUploads, unit.id]
  );

  const saveSubmission = useCallback(
    async () => {
      if (!isActivity || !activityEditable) return;

      setActivitySaving(true);
      setActivityError(null);
      setActivityInfo(null);

      try {
        const res = await fetch("/api/activity/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitId: unit.id,
            notes: activityNotes || "",
            attachments: activityUploads.map((u) => ({
              url: u.url,
              pathname: u.pathname,
              fileName: u.fileName,
              mimeType: u.contentType || null,
              sizeBytes: u.sizeBytes || null,
              kind: u.kind,
            })),
          }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || "Falha ao salvar a entrega.");
        }

        setActivityInfo("Entrega salva.");
      } catch (e: any) {
        setActivityError(String(e?.message || e));
      } finally {
        setActivitySaving(false);
      }
    },
    [isActivity, activityEditable, unit.id, activityNotes, activityUploads]
  );

  // =========================
  // Status hydrations
  // =========================

  useEffect(() => {
    if (!isActivity) return;

    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/activity/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unitId: unit.id }),
        });
        if (!res.ok) return;

        const data: {
          isCompleted: boolean;
          earnedXp: number;
          submission: null | {
            notes: string;
            attachments: Array<{
              url: string;
              fileName: string;
              mimeType: string | null;
              sizeBytes: number | null;
              kind: "FILE" | "IMAGE" | "VIDEO";
              pathname?: string | null;
            }>;
          };
        } = await res.json();

        if (ignore) return;

        setIsCompleted(!!data.isCompleted);
        setEarnedXp(Math.max(0, Math.floor(data.earnedXp || 0)));

        if (data.submission) {
          setActivityNotes(data.submission.notes || "");

          const mapped: UploadedBlob[] = (data.submission.attachments || []).map(
            (a) => {
              const contentType = a.mimeType || "";
              const pathname = (a.pathname || "")?.trim()
                ? String(a.pathname)
                : String(a.url); // fallback compatível com seu status atual

              return {
                url: a.url,
                pathname,
                contentType,
                sizeBytes: a.sizeBytes || 0,
                fileName: a.fileName,
                kind: a.kind || kindFromMime(contentType),
              };
            }
          );

          setActivityUploads(mapped);
        }
      } catch {}
    })();

    return () => {
      ignore = true;
    };
  }, [isActivity, unit.id]);

  useEffect(() => {
    if (isActivity) return;

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

        setEarnedXp(data.isCompleted ? unit.unitXP : 0);
      } catch {}
    })();

    return () => {
      ignore = true;
    };
  }, [unit.id, unit.thresholdPct, unit.unitXP, isVideo, isActivity]);

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
    if (!canComplete || isCompleting || (isActivity && activityBusy)) return;

    if (isActivity) {
      if (activityUploads.length === 0) {
        setActivityError("Anexe pelo menos um arquivo para concluir a atividade.");
        return;
      }

      // 1) salva entrega (notes + anexos)
      const saveRes = await fetch("/api/activity/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: unit.id,
          notes: activityNotes || "",
          attachments: activityUploads.map((u) => ({
            url: u.url,
            pathname: u.pathname,
            fileName: u.fileName,
            mimeType: u.contentType || null,
            sizeBytes: u.sizeBytes || null,
            kind: u.kind,
          })),
        }),
      });

      if (!saveRes.ok) {
        const j = await saveRes.json().catch(() => null);
        setActivityError(j?.error || "Falha ao salvar a entrega.");
        return;
      }
    }

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

      const xpAwarded = Math.max(0, Math.floor(data.awardedXp || 0));
      setAwardedXp(xpAwarded);
      setEarnedXp(xpAwarded);

      setNextUnitSlug(data.nextUnitSlug ?? unit.slug);
      setIsCompleted(true);
      setPopupOpen(true);
    } catch {
      setIsCompleting(false);
    }
  }, [
    canComplete,
    isCompleting,
    isActivity,
    activityBusy,
    activityUploads,
    activityNotes,
    unit.id,
    unit.slug,
  ]);

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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M15 19a1 1 0 0 1-.7-.29l-6-6a1 1 0 0 1 0-1.42l6-6A1 1 0 0 1 16.7 6.7L11.41 12l5.3 5.3A1 1 0 0 1 15 19z" />
          </svg>
          Voltar para as unidades
        </Link>
      </div>

      {/* cabeçalho */}
      <div className="text-xs text-neutral-500">
        UNIDADE • {unit.courseTitle || "Curso"} • {unit.moduleTitle || "Módulo"}
      </div>

      <div className="md:w-[620px] mt-1">
        <div className="text-2xl font-bold">{unit.title}</div>

        {unit.description ? (
          <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
            {linkify(unit.description)}
          </p>
        ) : (
          <p className="mt-1 text-[15px] leading-relaxed text-neutral-500">Sem descrição.</p>
        )}

        {(driveLink || externalLink) && (
          <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
            <div className="text-[13px] font-semibold text-neutral-900">Materiais da unidade</div>
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
              Dica: Acesse o conteúdo no Google Drive e baixe os arquivos desejados.
            </div>
          </div>
        )}

        {/* XP */}
        <div className="mt-3 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-neutral-900">XP da Unidade</span>
            <span className="text-[16px] font-extrabold text-neutral-800">
              {earnedXp} / {unit.unitXP} XP
            </span>
          </div>

          {isActivity ? (
            <div className="mt-2 text-xs text-neutral-500">
              Nesta atividade você recebe 50% do XP ao concluir. O restante depende da conferência do professor.
            </div>
          ) : null}
        </div>

        <div className="mt-3 text-sm text-neutral-700">
          Tipo de unidade: <span className="font-semibold">{unit.unitTypeLabel}</span>
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

        {/* ACTIVITY UI */}
        {isActivity && (
          <div className="mt-4 rounded-2xl border border-neutral-300 bg-white p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-neutral-900">Entrega da atividade</div>
              <div className="text-xs text-neutral-500">
                Máx {MAX_FILES} arquivos • {fmtMB(MAX_BYTES)} cada
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[13px] font-semibold text-neutral-900">Observações da entrega</div>
              <textarea
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Descreva sua entrega, o que você fez e qualquer detalhe importante."
                className="mt-2 w-full min-h-[110px] rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-200"
                disabled={!activityEditable}
              />
            </div>

            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => onAddFiles(e.target.files || [])}
                className="hidden"
                disabled={!activityEditable}
              />

              {/* LARANJA APENAS AQUI */}
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (activityEditable) setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (activityEditable) setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={onDrop}
                className={`mt-2 rounded-2xl border-2 p-4 transition ${
                  isDragging
                    ? "bg-orange-50"
                    : "bg-white"
                } ${activityEditable ? "" : "opacity-70"} `}
                style={{
                  borderColor: isDragging ? "#f59e0b" : BRAND,
                }}
              >
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-semibold text-neutral-900">Arraste e solte seus arquivos aqui</div>
                  <div className="text-xs text-neutral-500">Ou clique no botão abaixo para selecionar.</div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={activityBusy || !activityEditable || activityUploads.length >= MAX_FILES}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 cursor-pointer disabled:opacity-60"
                  >
                    <Upload size={16} />
                    Anexar arquivos
                  </button>
                </div>
              </div>

              {activityError ? <div className="mt-2 text-xs text-red-600">{activityError}</div> : null}
              {activityInfo ? <div className="mt-2 text-xs text-emerald-700">{activityInfo}</div> : null}

              <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-neutral-900">Arquivos anexados</div>
                  <div className="text-xs text-neutral-500">
                    {activityUploads.length} / {MAX_FILES}
                  </div>
                </div>

                {activityUploads.length === 0 ? (
                  <div className="mt-2 text-xs text-neutral-500">
                    Anexe pelo menos 1 arquivo para liberar “Concluir unidade”.
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {activityUploads.map((u) => (
                      <div
                        key={u.pathname}
                        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-neutral-700">{kindIcon(u.kind)}</div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-neutral-900 truncate">{u.fileName}</div>
                            <div className="text-xs text-neutral-500">
                              {u.contentType || "arquivo"} • {fmtMB(u.sizeBytes)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={u.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                            title="Abrir arquivo"
                          >
                            <ExternalLink size={14} />
                            Abrir
                          </a>

                          {activityEditable && (
                            <button
                              type="button"
                              onClick={() => removeAttachment(u.pathname)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                              title="Remover anexo"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FRASE EM VERMELHO */}
              <div className="mt-2 text-xs font-semibold text-red-600">
                Ao concluir, você ganha 50% do XP. O restante depende da conferência do professor.
              </div>

              {/* Salvar alterações (pós conclusão e também antes, se quiser) */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveSubmission}
                  disabled={!activityEditable || activitySaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 cursor-pointer disabled:opacity-60"
                  title="Salvar observações e anexos"
                >
                  <Save size={16} />
                  Salvar entrega
                </button>

                <div className="text-xs text-neutral-500">
                  Você pode editar até o professor corrigir (MVP).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ação */}
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
                disabled={!canComplete || isCompleting || (isActivity && activityBusy)}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition ${
                  canComplete && !(isActivity && activityBusy)
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-70"
                }`}
                style={{
                  backgroundColor: canComplete && !(isActivity && activityBusy) ? BRAND : "#e5e7eb",
                  color: canComplete && !(isActivity && activityBusy) ? "#ffffff" : "#9ca3af",
                }}
                aria-disabled={!canComplete || isCompleting || (isActivity && activityBusy)}
              >
                {canComplete && !(isActivity && activityBusy) && <Check size={18} color="#ffffff" />}
                Concluir unidade
              </button>

              {isVideo && !canComplete && (
                <div className="mt-2 text-xs text-neutral-500">
                  O botão habilita após assistir {unit.thresholdPct}% do vídeo.
                </div>
              )}

              {isActivity && activityUploads.length === 0 && (
                <div className="mt-2 text-xs text-neutral-500">
                  Anexe pelo menos 1 arquivo para habilitar o botão.
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
        key={`popup-${unit.id}-${popupOpen ? "open" : "closed"}`}
      />
    </div>
  );
}

