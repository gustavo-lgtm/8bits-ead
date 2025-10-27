// app/aguardando-consentimento/AguardandoConsentimento.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AwaitConsentPage() {
  const router = useRouter();
  const q = useSearchParams();

  const email = q.get("email") || "";
  const guardianEmail = q.get("guardianEmail") || "";
  const expiresAt = q.get("expiresAt") || "";

  const expiresFmt = useMemo(() => {
    try {
      return new Date(expiresAt).toLocaleString("pt-BR");
    } catch {
      return expiresAt || "-";
    }
  }, [expiresAt]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newGuardian, setNewGuardian] = useState("");

  async function resend() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/consent/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentEmail: email }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j?.error || "Não foi possível reenviar o e-mail.");
      else alert("Reenviamos o e-mail ao responsável.");
    } catch {
      setErr("Falha ao reenviar.");
    } finally {
      setBusy(false);
    }
  }

  async function changeGuardian() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/consent/change-guardian", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentEmail: email, newGuardianEmail: newGuardian }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j?.error || "Falha ao atualizar o e-mail do responsável.");
      } else {
        alert("Atualizamos e reenviamos o pedido de autorização.");
        setShowModal(false);
      }
    } catch {
      setErr("Erro ao atualizar responsável.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">Aguardando autorização do responsável</h1>
          <p className="mt-2 text-neutral-700">
            Enviamos um e-mail para <strong>{guardianEmail}</strong> para autorizar o seu cadastro
            (<span className="font-mono">{email}</span>). Assim que ele(a) confirmar, seu acesso será liberado.
            <br />
            O link expira em: <strong>{expiresFmt}</strong>.
          </p>

          {err && (
            <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={resend}
              disabled={busy}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-neutral-50"
            >
              Reenviar e-mail
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-neutral-50"
            >
              Trocar e-mail do responsável
            </button>

            <button
              onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
              className="rounded-xl bg-[#ffab40] text-white px-4 py-2 text-sm font-semibold shadow hover:opacity-95"
            >
              Abrir tela de login
            </button>
          </div>
        </div>
      </div>

      {/* Modal Trocar responsável */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Alterar e-mail do responsável</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Informe o novo e-mail do responsável. Reenviaremos o pedido de autorização.
            </p>
            <input
              type="email"
              value={newGuardian}
              onChange={(e) => setNewGuardian(e.target.value)}
              placeholder="responsavel@exemplo.com"
              className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                onClick={changeGuardian}
                className="rounded-lg bg-[#ffab40] text-white px-3 py-1.5 text-sm font-semibold hover:opacity-95"
              >
                Salvar e reenviar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
