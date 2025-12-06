// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot",
  "/verify",
  "/responsavel/consentir",
  "/unlock",          // qualquer slug depois disso continua público
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return false; // tratamos a raiz à parte
  // considera público se o caminho for exatamente igual
  // ou começar com um dos prefixos (ex.: /unlock/b001)
  return PUBLIC_PATHS.some((base) =>
    pathname === base || pathname.startsWith(base + "/")
  );
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // 1) Raiz sem login -> /login (sem callback feio)
    if (!token && pathname === "/") {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2) Páginas públicas -> segue o jogo
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    // 3) Não logado tentando acessar rota protegida -> manda para login com callback
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callback", req.nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }

    // 4) Já logado acessando /login -> manda para /cursos
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/cursos", req.url));
    }

    // 5) Qualquer outra coisa -> continua normal
    return NextResponse.next();
  },
  {
    callbacks: {
      // deixamos sempre "authorized", o controle real é feito acima
      authorized() {
        return true;
      },
    },
  }
);

// Evita rodar o middleware em assets estáticos e em /api/auth
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/auth).*)",
  ],
};
