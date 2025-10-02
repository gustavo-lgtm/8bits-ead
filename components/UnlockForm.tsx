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

      if (!res.ok || !data.ok) {
        alert(data.error ?? "Falha ao validar");
        setLoading(false);
        return;
      }

      alert(`OK - course ${slug} unlocked`);
      router.push("/painel");
    } catch {
      alert("Erro de rede");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block text-sm font-medium">
        Secret code
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
          placeholder="Type the code from your box"
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
        {loading ? "Validando..." : "Unlock"}
      </button>
    </form>
  );
}
