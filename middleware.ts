// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Rotas públicas (não exigem login).
 * Inclui:
 * - páginas de autenticação
 * - páginas públicas específicas
 * - APIs do NextAuth / debug / unlock
 * - assets estáticos (imagens, ícones etc.)
 */
const PUBLIC_ROUTES: (string | RegExp)[] = [
  "/login",
  "/register",
  "/verify",
  "/responsavel/consentir",
  "/aguardando-consentimento",

  // Páginas de desbloqueio da box (a própria página trata o caso logado/não logado)
  /^\/unlock\/.*/,

  // Endpoints internos do NextAuth
  /^\/api\/auth\/.*/,

  // APIs específicas que podem ser públicas
  /^\/api\/unlock\/.*/,
  /^\/api\/debug\/.*/,

  // Assets gerados pelo Next
  /^\/_next\/.*/,

  // Qualquer arquivo estático em /public (png, jpg, svg, ico, etc.)
  /^\/.*\.(png|jpe?g|gif|svg|ico|webp)$/i,
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (typeof route === "string") return route === pathname;
    return route.test(pathname);
  });
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = isPublicPath(pathname);

  // Token JWT do NextAuth (pode ser null se não estiver logado)
  const token = await getToken({ req });
  const isLoggedIn = !!token;

  // - Se for rota pública, deixa passar sempre
  if (isPublic) {
    // Pequena regra extra: se já está logado e tentar ir para /login ou /register,
    // redireciona para o painel/cursos para evitar loop bobo.
    if (
      isLoggedIn &&
      (pathname === "/login" || pathname === "/register" || pathname === "/")
    ) {
      const to = req.nextUrl.clone();
      to.pathname = "/cursos"; // ou "/painel", se preferir
      to.search = "";
      return NextResponse.redirect(to);
    }

    return NextResponse.next();
  }

  // - Se NÃO está logado e a rota NÃO é pública: manda para login com callback
  if (!isLoggedIn) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";

    // callback = rota original + query string
    const callback = pathname + (search || "");
    loginUrl.searchParams.set("callback", callback);

    return NextResponse.redirect(loginUrl);
  }

  // - Se está logado, podemos aplicar regras extras para áreas restritas
  const role = (token as any)?.role as "ADMIN" | "STAFF" | "USER" | undefined;

  // Protege /admin para ADMIN/STAFF apenas
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN" && role !== "STAFF") {
      // sem permissão - redireciona para o painel
      const to = req.nextUrl.clone();
      to.pathname = "/painel";
      to.search = "";
      return NextResponse.redirect(to);
    }
  }

  // Se usuário logado cair em "/", manda para /cursos
  if (pathname === "/") {
    const to = req.nextUrl.clone();
    to.pathname = "/cursos";
    to.search = "";
    return NextResponse.redirect(to);
  }

  // Qualquer outra rota segue normalmente
  return NextResponse.next();
}

// Aplica o middleware em tudo, exceto os assets internos do Next
export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

