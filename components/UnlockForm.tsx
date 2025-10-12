"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code }),
      });
      const data = await res.json();

      // ✅ Corrigido: a API usa "success" e não "ok"
      if (!res.ok || !data.success) {
        alert(data.error ?? "Falha ao validar");
        setLoading(false);
        return;
      }

      // ✅ Tudo certo
      alert(`Curso "${slug}" desbloqueado com sucesso!`);
      router.push("/painel");
    } catch (err) {
      console.error("Erro de rede ou execução:", err);
      alert("Erro de rede, tente novamente.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block text-sm font-medium">
        Código secreto
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
          placeholder="Digite o código da sua box"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        disabled={!code || loading}
        className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Validando..." : "Desbloquear"}
      </button>
    </form>
  );
}
