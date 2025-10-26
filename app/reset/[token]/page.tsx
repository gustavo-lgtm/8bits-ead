// app/reset/[token]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json();
    if (!res.ok) return setErr(json?.error || "Erro");
    setOk(true);
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold">Redefinir senha</h1>
        <div className="mt-4 space-y-3">
          <input type="password" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="Nova senha (mín. 8)" value={password} onChange={(e)=>setPassword(e.target.value)} />
          {err && <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">{err}</div>}
          {ok && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">Senha alterada. Redirecionando…</div>}
          <button type="submit" className="w-full rounded-xl bg-amber-400 text-white font-semibold py-2 shadow">Salvar nova senha</button>
        </div>
      </form>
    </main>
  );
}
