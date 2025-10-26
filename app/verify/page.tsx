// app/verify/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Mode = "token" | "code";

export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();

  const token = params.get("token");
  const initialEmail = params.get("email") || "";
  const mode: Mode = token ? "token" : "code";

  // estados comuns
  const [email, setEmail] = useState(initialEmail);
  const [err, setErr] = useState<string | null>(null);

  // estados do fluxo "código"
  const [code, setCode] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // estados do fluxo "token"
  const [confirming, setConfirming] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  // Fluxo TOKEN: confirma automaticamente ao abrir
  useEffect(() => {
    if (mode !== "token" || !token) return;

    (async () => {
      setErr(null);
      setConfirming(true);
      try {
        const r = await fetch("/api/auth/verify/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const j = await r.json();
        if (!r.ok) {
          setErr(j?.error || "Não foi possível confirmar o e-mail.");
        } else {
          setConfirmedEmail(j?.email || initialEmail || null);
        }
      } catch (e: any) {
        setErr(e?.message ?? "Erro inesperado ao confirmar.");
      } finally {
        setConfirming(false);
      }
    })();
  }, [mode, token, initialEmail]);

  // SUBMIT do fluxo CÓDIGO
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok) setErr(json?.error || "Código inválido.");
      else {
        setOk(true);
        setTimeout(() => router.push(`/login?email=${encodeURIComponent(email)}`), 1000);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // REENVIAR no fluxo CÓDIGO
  const onResend = async () => {
    setErr(null);
    setResending(true);
    try {
      const res = await fetch("/api/auth/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) setErr(json?.error || "Erro ao reenviar.");
    } catch (e: any) {
      setErr(e?.message ?? "Erro inesperado.");
    } finally {
      setResending(false);
    }
  };

  // UI

  // 1) Fluxo TOKEN
  if (mode === "token") {
    return (
      <main className="min-h-dvh grid place-items-center bg-neutral-50">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow text-center">
          <h1 className="text-xl font-bold">Confirmar e-mail</h1>

          {confirming && <p className="mt-2 text-neutral-700">Confirmando…</p>}

          {!confirming && confirmedEmail && (
            <>
              <p className="mt-2 text-neutral-700">
                E-mail <span className="font-mono">{confirmedEmail}</span> confirmado com sucesso!
              </p>
              <button
                onClick={() =>
                  router.push(`/login?email=${encodeURIComponent(confirmedEmail)}`)
                }
                className="mt-5 w-full rounded-xl bg-amber-400 text-white font-semibold py-2 shadow hover:opacity-95"
              >
                Abrir tela de login
              </button>
            </>
          )}

          {!confirming && err && (
            <>
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
                {err}
              </div>
              <button
                onClick={() => router.push("/login")}
                className="mt-5 w-full rounded-xl bg-amber-400 text-white font-semibold py-2 shadow hover:opacity-95"
              >
                Abrir tela de login
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  // 2) Fluxo CÓDIGO (form atual)
  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold">Verificar e-mail</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Enviamos um código de 6 dígitos para seu e-mail.
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="email"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm tracking-widest text-center"
            placeholder="Código (6 dígitos)"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />

          {err && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">
              E-mail verificado! Redirecionando…
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400 text-white font-semibold py-2 shadow disabled:opacity-60"
          >
            {loading ? "Verificando…" : "Verificar"}
          </button>

          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="w-full rounded-xl bg-neutral-200 text-neutral-900 font-semibold py-2 shadow disabled:opacity-60"
          >
            {resending ? "Reenviando…" : "Reenviar código"}
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
