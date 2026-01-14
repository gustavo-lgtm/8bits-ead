// app/responsavel/consentir/ConsentirClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email?: string }
  | { status: "error"; message: string; details?: string };

export default function ConsentirClient() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "Token ausente. Verifique se você abriu o link completo do e-mail." });
      return;
    }

    let cancelled = false;

    async function run() {
      setState({ status: "loading" });

      try {
        // Opcao A: POST (mantém o que você já tinha)
        const r = await fetch("/api/consent/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
        });

        // Se cair em middleware por engano, você costuma ver redirect para /login.
        // Aqui vamos capturar o corpo como texto para mostrar o motivo real.
        const text = await r.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          // se nao for JSON, deixa text mesmo
        }

        if (!r.ok) {
          const msg =
            (json?.error as string) ||
            `Falha ao confirmar (HTTP ${r.status}).`;

          const details =
            typeof text === "string" && text.length > 0
              ? text.slice(0, 500)
              : undefined;

          if (!cancelled) setState({ status: "error", message: msg, details });
          return;
        }

        if (!cancelled) setState({ status: "success", email: json?.email });
      } catch (e: any) {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Falha de rede ao confirmar o consentimento.",
            details: e?.message || String(e),
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white px-6 py-6 md:px-8 md:py-8 shadow">
        {state.status === "loading" && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Confirmando autorização</h1>
            <p className="mt-2 text-sm text-neutral-600">Aguarde alguns segundos...</p>
          </>
        )}

        {state.status === "success" && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Autorização confirmada</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Pronto! O cadastro foi autorizado{state.email ? ` para ${state.email}` : ""}.
            </p>

            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#ffab40] px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90"
              >
                Ir para o login
              </Link>
            </div>
          </>
        )}

        {(state.status === "idle" || state.status === "error") && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Não foi possível confirmar</h1>
            <p className="mt-2 text-sm text-neutral-600">
              {state.status === "error" ? state.message : "Carregando..."}
            </p>

            {state.status === "error" && state.details && (
              <details className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
                <summary className="cursor-pointer font-semibold">Detalhes técnicos</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">{state.details}</pre>
              </details>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                Tentar novamente
              </button>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#ffab40] px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90"
              >
                Ir para o login
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
