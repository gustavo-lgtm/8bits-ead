// app/login/LoginClient.tsx
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
        // Verifica pendência de consentimento
        try {
          const r = await fetch("/api/consent/status", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const j = await r.json().catch(() => null);
          if (j?.pending) {
            const qs = new URLSearchParams({
              email,
              guardianEmail: j.guardianEmail || "",
              expiresAt: j.expiresAt || "",
            }).toString();
            router.push(`/aguardando-consentimento?${qs}`);
            return;
          }
        } catch {
          // ignora e cai na mensagem genérica
        }

        setErr("Não foi possível entrar com e-mail e senha. Verifique seus dados ou confirme seu e-mail.");
        return;
      }

      router.push("/cursos"); // login OK → lista de projetos
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
              className="w-full inline-flex items-center justify-center gap-3 rounded-[4px] border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1f1f1f] shadow-sm hover:bg-[#f8f9fa] active:bg-[#f1f3f4] cursor-pointer"
              style={{ lineHeight: 1 }}
              aria-label="Entrar com Google"
            >
              {/* Ícone oficial “G” do Google (SVG recomendado) */}
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.9-6.9C35.9 2.2 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.06 6.26C12.2 13.7 17.59 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.21-.43-4.73H24v9h12.65c-.55 2.96-2.23 5.46-4.76 7.15l7.3 5.67C43.89 38.01 46.5 31.72 46.5 24.5z"/>
                <path fill="#FBBC05" d="M10.62 27.48A14.47 14.47 0 0 1 9.5 24c0-1.21.2-2.39.56-3.5l-8.06-6.26A24 24 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l8.06-6.26z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.91-5.84l-7.3-5.67c-2.02 1.37-4.61 2.18-8.61 2.18-6.41 0-11.8-4.2-13.38-9.98l-8.06 6.26C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Entrar com Google</span>
            </button>
          )}

          {hasAzure && (
            <button
              type="button"
              onClick={() => signIn("azure-ad", { callbackUrl: "/cursos" })}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-[14px] font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50 cursor-pointer"
              title="Entrar com Microsoft"
            >
              {/* opcional: ícone MS minimalista */}
              <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
                <rect width="10" height="10" x="1" y="1" fill="#f35325" />
                <rect width="10" height="10" x="12" y="1" fill="#81bc06" />
                <rect width="10" height="10" x="1" y="12" fill="#05a6f0" />
                <rect width="10" height="10" x="12" y="12" fill="#ffba08" />
              </svg>
              <span>Entrar com Microsoft</span>
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
