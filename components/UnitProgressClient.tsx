// components/UnitProgressClient.tsx
"use client";

import { useEffect, useState } from "react";

export default function UnitProgressClient({ unitId }: { unitId: string }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Marca início ao montar
  useEffect(() => {
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId, action: "start" }),
    }).catch(() => {});
  }, [unitId]);

  async function markComplete() {
    setSaving(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, action: "complete" }),
      });
      if (res.ok) {
        setDone(true);
        // esconde o banner após 2.5s
        setTimeout(() => setDone(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={markComplete}
        disabled={saving}
        className="inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Salvando..." : "Concluir aula"}
      </button>

      {done && (
        <div className="mt-3 rounded-xl border bg-green-50 px-4 py-2 text-sm">
          ✅ Aula concluída! Seu progresso foi atualizado.
        </div>
      )}
    </div>
  );
}
