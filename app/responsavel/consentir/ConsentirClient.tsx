// app/responsavel/consentir/ConsentirClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type State =
  | { kind: "loading" }
  | { kind: "ok"; email: string }
  | { kind: "error"; message: string };

export default function ConsentirClient() {
  const params = useSearchParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState({ kind: "error", message: "Token ausente." });
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/consent/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const j = await r.json();
        if (!r.ok) {
          setState({ kind: "error", message: j?.error || "Falha ao confirmar." });
          return;
        }
        setState({ kind: "ok", email: j.email });
      } catch {
        setState({ kind: "error", message: "Erro inesperado." });
      }
    })();
  }, [params]);

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        {state.kind === "loading" && <div>Confirmando autorização…</div>}

        {state.kind === "ok" && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Autorização confirmada!</h1>
            <p className="text-neutral-700">
              Obrigado(a). A conta foi liberada e já pode ser usada.
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Não foi possível confirmar</h1>
            <p className="text-neutral-700">{state.message}</p>
          </div>
        )}
      </div>
    </main>
  );
}
