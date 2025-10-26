// components/auth/ResetPasswordView.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { validatePassword } from "@/lib/password";

export default function ResetPasswordView({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const v = validatePassword(password, confirm);
    if (!v.ok) {
      setErr(v.errors.join(" "));
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j?.error || "Não foi possível redefinir a senha.");
        return;
      }
      setOk(true);
      setTimeout(() => router.push("/login"), 1000);
    } catch (e: any) {
      setErr(e?.message ?? "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Redefinir senha</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Crie uma nova senha para continuar.
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="password"
            className="w-full rounded-lg border border-neutral-300 bg-[#e9f1ff] px-3 py-2 text-sm"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            className="w-full rounded-lg border border-neutral-300 bg-[#e9f1ff] px-3 py-2 text-sm"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />

          {err && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">
              Senha redefinida! Redirecionando…
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#ffab40] text-white font-semibold py-2 shadow disabled:opacity-60"
          >
            {busy ? "Salvando…" : "Salvar nova senha"}
          </button>
        </div>

        <div className="mt-4 text-sm">
          <a href="/login" className="text-neutral-700 hover:underline">
            Voltar ao login
          </a>
        </div>
      </form>
    </main>
  );
}
