// app/forgot/page.tsx
"use client";

import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return setErr(json?.error || "Erro");
    setOk(true);
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold">Esqueci minha senha</h1>
        <p className="mt-1 text-sm text-neutral-600">Enviaremos um link de redefinição para o seu e-mail.</p>
        <div className="mt-4 space-y-3">
          <input type="email" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="Seu e-mail" value={email} onChange={(e)=>setEmail(e.target.value)} />
          {err && <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">{err}</div>}
          {ok && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">Se o e-mail existir em nossa base, enviaremos o link para você redefinir sua senha.</div>}
          <button type="submit" className="w-full rounded-xl bg-amber-400 text-white font-semibold py-2 shadow">Enviar link</button>
        </div>
        <div className="mt-4 text-sm">
          <a href="/login" className="text-neutral-700 hover:underline">Voltar ao login</a>
        </div>
      </form>
    </main>
  );
}
