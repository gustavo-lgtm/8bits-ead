// app/admin/units/new/NewUnitForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const BRAND = "#ffab40";

type CourseOption = {
  id: string; title: string; slug: string;
  modules: { id: string; title: string; slug: string; sortIndex: number }[];
};

type ModuleFlat = {
  id: string; title: string; slug: string; sortIndex: number;
  course: { id: string; title: string; slug: string };
};

type Props = { courses: CourseOption[]; modulesFlat: ModuleFlat[]; };
type UnitType = "VIDEO" | "DOC" | "LINK";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

export default function NewUnitForm({ courses, modulesFlat }: Props) {
  const router = useRouter();

  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const modulesOfCourse = useMemo(
    () => courses.find((c) => c.id === courseId)?.modules ?? [],
    [courseId, courses]
  );
  const [moduleId, setModuleId] = useState(modulesOfCourse[0]?.id ?? "");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<UnitType>("VIDEO");

  const [youtubeId, setYoutubeId] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [url, setUrl] = useState("");

  const [durationSec, setDurationSec] = useState<number | "">("");
  const [thresholdPct, setThresholdPct] = useState<number | "">(85);
  const [sortIndex, setSortIndex] = useState<number | "">("");
  const [requiresPrev, setRequiresPrev] = useState(false);
  const [isWelcome, setIsWelcome] = useState(false);
  const [posterUrl, setPosterUrl] = useState("");

  const [isOptional, setIsOptional] = useState(false);
  const [isExtra, setIsExtra] = useState(false);
  const [xpMode, setXpMode] = useState<"FIXED" | "QUIZ_PARTIAL">("FIXED");
  const [xpValue, setXpValue] = useState<number | "">(30);
  const [xpMax, setXpMax] = useState<number | "">("");

  const moduleSelected = useMemo(
    () => modulesFlat.find((m) => m.id === moduleId),
    [moduleId, modulesFlat]
  );

  function onChangeTitle(v: string) {
    setTitle(v);
    if (!slug) setSlug(slugify(v));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!courseId) return alert("Selecione o curso.");
    if (!moduleId) return alert("Selecione o módulo.");
    if (!title.trim()) return alert("Informe o título.");
    if (!slug.trim()) return alert("Informe o slug.");

    if (type === "VIDEO" && !youtubeId.trim()) return alert("Para tipo VIDEO, informe o YouTube ID.");
    if (type === "DOC" && !driveFileId.trim()) return alert("Para tipo DOC, informe o Google Drive fileId.");
    if (type === "LINK" && !url.trim()) return alert("Para tipo LINK, informe a URL.");

    const payload: any = {
      moduleId,
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      type,
      youtubeId: youtubeId.trim() || null,
      driveFileId: driveFileId.trim() || null,
      url: url.trim() || null,
      durationSec: durationSec === "" ? null : Number(durationSec),
      thresholdPct: thresholdPct === "" ? null : Number(thresholdPct),
      sortIndex: sortIndex === "" ? null : Number(sortIndex),
      requiresCompletedPrevious: !!requiresPrev,
      isWelcome: !!isWelcome,
      posterUrl: posterUrl.trim() || null,
      isOptional: !!isOptional,
      isExtra: !!isExtra,
      xpMode,
      xpValue: xpValue === "" ? null : Number(xpValue),
      xpMax: xpMax === "" ? null : Number(xpMax),
    };

    const res = await fetch("/api/admin/units/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.error("create unit error", j);
      return alert(j?.error || "Erro ao criar unidade.");
    }

    const data: { ok: true; unitPath: string } = await res.json();
    alert("Unidade criada com sucesso!");
    router.push(data.unitPath);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      {/* Seleção de Curso / Módulo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Curso</label>
          <select
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              const first = courses.find((c) => c.id === e.target.value)?.modules?.[0]?.id ?? "";
              setModuleId(first);
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Módulo</label>
          <select
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
          >
            {modulesOfCourse.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Título / Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Título da unidade</label>
          <input
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Ex.: Introdução às variáveis"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Slug</label>
          <input
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="introducao-variaveis"
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-semibold text-neutral-800">Descrição</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Resumo breve da unidade…"
        />
      </div>

      {/* Tipo + campos condicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Tipo</label>
          <select
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as UnitType)}
          >
            <option value="VIDEO">Vídeo (YouTube)</option>
            <option value="DOC">Documento (Google Drive)</option>
            <option value="LINK">Link externo</option>
          </select>
        </div>

        {type === "VIDEO" && (
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-neutral-800">YouTube ID</label>
            <input className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
              value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} placeholder="ex.: dQw4w9WgXcQ" />
          </div>
        )}
        {type === "DOC" && (
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-neutral-800">Google Drive fileId</label>
            <input className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
              value={driveFileId} onChange={(e) => setDriveFileId(e.target.value)} placeholder="ID do arquivo no Drive" />
          </div>
        )}
        {type === "LINK" && (
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-neutral-800">URL</label>
            <input className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
              value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
        )}
      </div>

      {/* Duração / Threshold / Sort */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Duração (seg)</label>
          <input type="number" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={durationSec} onChange={(e) => setDurationSec(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="ex.: 420" min={0} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Threshold % (vídeo)</label>
          <input type="number" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={thresholdPct} onChange={(e) => setThresholdPct(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="ex.: 85" min={0} max={100} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Ordem (sortIndex)</label>
          <input type="number" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={sortIndex} onChange={(e) => setSortIndex(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="vazio = vai para o final" />
        </div>
      </div>

      {/* Flags + Gamificação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={requiresPrev} onChange={(e) => setRequiresPrev(e.target.checked)} />
          Exige anterior concluída
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isWelcome} onChange={(e) => setIsWelcome(e.target.checked)} />
          Unidade de boas-vindas
        </label>
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Poster (URL)</label>
          <input className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
            value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-300 bg-white p-3 shadow">
        <div className="text-[13px] font-semibold text-neutral-900 mb-2">Gamificação</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isOptional} onChange={(e) => setIsOptional(e.target.checked)} /> Opcional
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isExtra} onChange={(e) => setIsExtra(e.target.checked)} /> Extra
          </label>
          <div>
            <label className="block text-sm font-semibold text-neutral-800">XP Mode</label>
            <select className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
              value={xpMode} onChange={(e) => setXpMode(e.target.value as any)}>
              <option value="FIXED">FIXED</option>
              <option value="QUIZ_PARTIAL">QUIZ_PARTIAL</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-sm font-semibold text-neutral-800">XP (fixo)</label>
            <input type="number" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
              value={xpValue} onChange={(e) => setXpValue(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="ex.: 30" min={0} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800">XP Máx. (quiz)</label>
            <input type="number" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white p-2 text-sm"
              value={xpMax} onChange={(e) => setXpMax(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="ex.: 100" min={0} />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg hover:opacity-95 cursor-pointer"
          style={{ backgroundColor: BRAND, color: "#fff" }}
        >
          Salvar unidade
        </button>
        {moduleSelected && (
          <a href={`/c/${moduleSelected.course.slug}/${moduleSelected.slug}`}
             className="text-sm font-semibold text-neutral-700 hover:text-neutral-900">
            Voltar ao módulo
          </a>
        )}
      </div>
    </form>
  );
}
