// app/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Entrar - 8bits",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh grid place-items-center">
          <div className="text-center text-neutral-600">
            Carregando página de login...
          </div>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
