// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const info = params.get("info");

  const [hasGoogle, setHasGoogle] = useState(false);
  const [hasAzure, setHasAzure] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => {
        setHasGoogle(!!p.google);
        setHasAzure(!!p["azure-ad"]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const e = params.get("error");
    if (e) setErr("Falha ao entrar. Verifique seus dados ou tente outro método.");
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        // ⤵️ NOVO: checa se o email está pendente de consentimento
        try {
          const r = await fetch("/api/consent/status", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const j = await r.json().catch(() => null);

          if (j?.pending) {
            const guardianEmail = j.guardianEmail || "";
            const expiresAt = j.expiresAt || "";
            const qs = new URLSearchParams({
              email,
              guardianEmail,
              expiresAt,
            }).toString();
            router.push(`/aguardando-consentimento?${qs}`);
            return; // encerra aqui
          }
        } catch {
          // ignora erro da checagem e cai na mensagem genérica
        }

        setErr("Não foi possível entrar com e-mail e senha. Verifique seus dados ou confirme seu e-mail.");
        return;
      }

      // login OK → vai para a lista de projetos
      router.push("/cursos");
    } finally {
      setLoading(false);
    }
  };

  async function resendVerification() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/verify/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j?.error || "Não foi possível reenviar o e-mail de verificação.");
      else alert("Reenviamos o e-mail de verificação. Confira sua caixa de entrada.");
    } catch {
      setErr("Erro ao reenviar verificação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Entrar</h1>

        {info === "verify" && (
          <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 text-sm">
            Conta criada! Enviamos um e-mail para confirmar seu endereço. Verifique sua caixa de entrada.
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            className="w-full rounded-lg border border-neutral-300 bg-[#e9f1ff] px-3 py-2 text-sm"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            className="w-full rounded-lg border border-neutral-300 bg-[#e9f1ff] px-3 py-2 text-sm"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {err && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
              {err}
              <div className="mt-2 text-xs">
                Se você acabou de se cadastrar e tem 13 anos ou mais, confirme seu e-mail.{" "}
                <button
                  type="button"
                  onClick={resendVerification}
                  className="underline font-semibold cursor-pointer"
                >
                  Reenviar verificação
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#ffab40] text-white font-semibold py-2 shadow disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </div>

        {(hasGoogle || hasAzure) && (
          <div className="my-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-500">ou</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
        )}

        <div className="space-y-2">
          {hasGoogle && (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/cursos" })}
              className="w-full rounded-xl bg-white border border-neutral-300 text-neutral-900 font-semibold py-2 shadow-sm hover:bg-neutral-50 cursor-pointer"
              title="Entrar com Google"
            >
              Entrar com Google
            </button>
          )}
          {hasAzure && (
            <button
              type="button"
              onClick={() => signIn("azure-ad", { callbackUrl: "/cursos" })}
              className="w-full rounded-xl bg-white border border-neutral-300 text-neutral-900 font-semibold py-2 shadow-sm hover:bg-neutral-50 cursor-pointer"
              title="Entrar com Microsoft"
            >
              Entrar com Microsoft
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <a href="/forgot" className="text-neutral-700 hover:underline">
            Esqueci minha senha
          </a>
          <a href="/register" className="text-neutral-700 hover:underline">
            Criar conta
          </a>
        </div>
      </form>
    </main>
  );
}
