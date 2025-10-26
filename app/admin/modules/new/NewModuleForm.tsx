// app/admin/modules/new/NewModuleForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CourseOption = {
  id: string;
  title: string;
  slug: string;
};

type FormState = {
  courseId: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string; // agora texto (aceita relativo)
  icon: string;      // idem
  sortIndex: string;
  isOptional: boolean;
  bonusPercent: string;
};

const BRAND = "#ffab40";

function normalizePathOrUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  // aceita caminhos relativos ("/…") ou URLs http(s)
  const isHttp = /^https?:\/\//i.test(s);
  const isRel = s.startsWith("/");
  return isHttp || isRel ? s : s; // se quiser rejeitar algo não http/relativo, troque por: null
}

export default function NewModuleForm() {
  const router = useRouter();

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    courseId: "",
    title: "",
    slug: "",
    description: "",
    posterUrl: "",
    icon: "",
    sortIndex: "",
    isOptional: false,
    bonusPercent: "10",
  });

  useEffect(() => {
    let done = false;
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch("/api/admin/courses/list");
        if (!res.ok) throw new Error("Falha ao listar cursos");
        const data = (await res.json()) as CourseOption[];
        if (!done) setCourses(data);
      } catch (e: any) {
        if (!done) setErr(e?.message ?? "Erro ao carregar cursos");
      } finally {
        if (!done) setLoadingCourses(false);
      }
    })();
    return () => { done = true; };
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseId) ?? null,
    [courses, form.courseId]
  );

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as any;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);

    if (!form.courseId) return setErr("Selecione um curso.");
    if (!form.title.trim()) return setErr("Informe o título do módulo.");
    if (!form.slug.trim()) return setErr("Informe o slug do módulo (ex: introducao).");

    setSubmitting(true);
    try {
      const payload = {
        courseId: form.courseId,
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        posterUrl: normalizePathOrUrl(form.posterUrl),
        icon: normalizePathOrUrl(form.icon),
        sortIndex: form.sortIndex.trim() ? Number(form.sortIndex) : null,
        isOptional: !!form.isOptional,
        bonusPercent: form.bonusPercent.trim() ? Number(form.bonusPercent) : 10,
      };

      const res = await fetch("/api/admin/modules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao salvar módulo");
      setOkMsg("Módulo criado com sucesso!");
      if (selectedCourse) {
        setTimeout(() => router.push(`/c/${selectedCourse.slug}`), 500);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* curso */}
      <div>
        <label className="block text-sm font-semibold text-neutral-800">Curso</label>
        <select
          name="courseId"
          value={form.courseId}
          onChange={onChange}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">{loadingCourses ? "Carregando..." : "Selecione"}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* título */}
      <div>
        <label className="block text-sm font-semibold text-neutral-800">Título do módulo</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Ex.: Bem-vindo"
        />
      </div>

      {/* slug */}
      <div>
        <label className="block text-sm font-semibold text-neutral-800">Slug</label>
        <input
          type="text"
          name="slug"
          value={form.slug}
          onChange={onChange}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          placeholder="bem-vindo"
        />
        <p className="mt-1 text-xs text-neutral-500">
          URL: {selectedCourse ? `/c/${selectedCourse.slug}/` : "/c/<curso>/"}
          <span className="font-mono">{form.slug || "<slug>"}</span>
        </p>
      </div>

      {/* descrição */}
      <div>
        <label className="block text-sm font-semibold text-neutral-800">Descrição</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Resumo do módulo"
        />
      </div>

      {/* poster / icon (agora TEXT para aceitar caminho interno) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">
            Poster (16:9) – URL ou caminho interno
          </label>
          <input
            type="text"
            name="posterUrl"
            value={form.posterUrl}
            onChange={onChange}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="https://…/poster.jpg ou /images/modules/caveira.png"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-800">
            Ícone (opcional) – URL ou caminho interno
          </label>
          <input
            type="text"
            name="icon"
            value={form.icon}
            onChange={onChange}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="https://…/icon.png ou /images/icons/x.png"
          />
        </div>
      </div>

      {/* sort + flags */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Ordem (sortIndex)</label>
          <input
            type="number"
            name="sortIndex"
            value={form.sortIndex}
            onChange={onChange}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Deixe em branco p/ próximo"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <input
              type="checkbox"
              name="isOptional"
              checked={form.isOptional}
              onChange={onChange}
              className="h-4 w-4"
            />
            Opcional
          </label>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Bônus (%) ao concluir</label>
          <input
            type="number"
            name="bonusPercent"
            value={form.bonusPercent}
            onChange={onChange}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="10"
          />
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}
      {okMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {okMsg}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: BRAND, color: "#ffffff" }}
        >
          {submitting ? "Salvando..." : "Salvar módulo"}
        </button>
      </div>
    </form>
  );
}
