// app/register/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PendingConsent = { guardianEmail: string; expiresAt: string };

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState(""); // yyyy-mm-dd
  const [guardianEmail, setGuardianEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
    return a;
  }, [birthDate]);

  const isChild = age !== null && age < 13;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          name: name || undefined,
          nickname: nickname || undefined,
          birthDate, // yyyy-mm-dd
          guardianEmail: isChild ? guardianEmail : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Falha ao cadastrar.");
        return;
      }

      if (data.next === "PENDING_CONSENT") {
        const p: PendingConsent = data.pending;
        const qs = new URLSearchParams({
          email,
          guardianEmail: p.guardianEmail,
          expiresAt: p.expiresAt,
        });
        router.push(`/aguardando-consentimento?${qs.toString()}`);
        return;
      }

      if (data.next === "VERIFY_EMAIL") {
        // ≥13 → verificação de e-mail obrigatória
        router.push(`/login?email=${encodeURIComponent(email)}&info=verify`);
        return;
      }

      router.push(`/login?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Criar conta</h1>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-[#e9f1ff] px-3 py-2 text-sm"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-[#e9f1ff] px-3 py-2 text-sm"
                placeholder="Crie uma senha"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">Confirmar senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-[#e9f1ff] px-3 py-2 text-sm"
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
                placeholder="(opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">Apelido</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
                placeholder="(opcional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">Data de nascimento</label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
            {age !== null && (
              <div className="mt-1 text-xs text-neutral-600">
                Idade estimada: <span className="font-semibold">{age} anos</span>
              </div>
            )}
          </div>

          {isChild && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-sm font-semibold text-amber-900">
                Menores de 13 anos precisam de autorização do responsável.
              </div>
              <label className="block text-sm text-amber-900 mt-2 mb-1">E-mail do responsável</label>
              <input
                type="email"
                required
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                placeholder="responsavel@exemplo.com"
              />
              <div className="mt-2 text-xs text-amber-800">
                Enviaremos um pedido de autorização para este e-mail.
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 text-sm">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#ffab40] text-white font-semibold py-2 shadow disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </div>

        <div className="mt-4 text-sm">
          Já tem conta?{" "}
          <a href="/login" className="text-neutral-800 underline">Entrar</a>
        </div>
      </form>
    </main>
  );
}
