"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GiftMessage = {
  id: string;
  fromName: string;
  message: string;
};

export default function UnlockForm({ slug }: { slug: string }) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [giftOpen, setGiftOpen] = useState(false);
  const [gift, setGift] = useState<GiftMessage | null>(null);

  const canSubmit = useMemo(() => code.trim().length > 0 && !loading, [code, loading]);

  const closeGift = () => {
    setGiftOpen(false);
  };

  const goToCourses = () => {
    // Ajuste solicitado: vai para /cursos
    router.push("/cursos");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        alert(data?.error ?? "Falha ao validar");
        setLoading(false);
        return;
      }

      const giftMessage: GiftMessage | null = data?.giftMessage ?? null;

      // Se tem gift message, abre o modal e só redireciona quando o aluno clicar
      if (giftMessage?.message) {
        setGift(giftMessage);
        setGiftOpen(true);
        setLoading(false);
        return;
      }

      // Se não tem gift message, segue fluxo normal
      router.push("/cursos");
    } catch (err) {
      console.error("Erro de rede ou execução:", err);
      alert("Erro de rede, tente novamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-neutral-800">
          Código secreto
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-200"
            placeholder="Digite o código da sua box"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Validando..." : "Desbloquear"}
        </button>
      </form>

      {/* Modal Gift Message */}
      {giftOpen && gift ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeGift}
            aria-hidden="true"
          />

          {/* dialog */}
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <button
              type="button"
              onClick={closeGift}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 cursor-pointer"
              aria-label="Fechar"
              title="Fechar"
            >
              ✕
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                {/* ícone simples (pode trocar por animação depois) */}
                <span className="text-xl">🎁</span>
              </div>

              <div className="min-w-0">
                <div className="text-base font-bold text-neutral-900">
                  Você recebeu um presente!
                </div>
                <div className="mt-0.5 text-sm text-neutral-600">
                  De: <span className="font-semibold">{gift.fromName}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm text-neutral-800 whitespace-pre-line">
                {gift.message}

                {/* 2 linhas + remetente no final */}
                {"\n\n"}
                <span className="text-neutral-700 font-semibold">{gift.fromName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={goToCourses}
              className="mt-4 w-full rounded-xl bg-[#ffab40] px-4 py-3 text-sm font-bold text-white shadow hover:opacity-95 cursor-pointer"
            >
              Abrir minha box
            </button>

            <div className="mt-2 text-center text-xs text-neutral-500">
              Ao continuar, você será direcionado para a sua missão.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}