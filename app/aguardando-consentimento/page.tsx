// app/aguardando-consentimento/page.tsx
import { Suspense } from "react";
import AguardandoConsentClient from "./AguardandoConsentClient";

export const metadata = {
  title: "Aguardando consentimento - 8bits",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh grid place-items-center">
          <div className="text-center text-neutral-600">
            Carregando...
          </div>
        </main>
      }
    >
      <AguardandoConsentClient />
    </Suspense>
  );
}
