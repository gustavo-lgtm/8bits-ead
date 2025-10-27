// app/verify/page.tsx
import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export const metadata = {
  title: "Verificação - 8bits",
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
      <VerifyClient />
    </Suspense>
  );
}
