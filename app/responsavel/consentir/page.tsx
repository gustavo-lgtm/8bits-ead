// app/responsavel/consentir/page.tsx
import { Suspense } from "react";
import ConsentirClient from "./ConsentirClient";

export const metadata = {
  title: "Consentimento do Responsável - 8bits",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh grid place-items-center">
          <div className="text-center text-neutral-600">
            Carregando página de consentimento...
          </div>
        </main>
      }
    >
      <ConsentirClient />
    </Suspense>
  );
}
