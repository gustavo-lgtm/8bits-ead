// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Rotas públicas (não exigem login).
 * Adicione aqui qualquer página pública adicional que você tiver.
 */
const PUBLIC_ROUTES: (string | RegExp)[] = [
  "/login",
  "/register",
  "/verify",
  "/responsavel/consentir",
  "/aguardando-consentimento",
  /^\/api\/auth\/.*/,               // Endpoints internos do NextAuth
  /^\/_next\/.*/,                   // Assets gerados pelo Next
  /^\/favicon\.ico$/, /^\/logo\.png$/,
  /^\/images\/.*/, /^\/public\/.*/, /^\/assets\/.*/,
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((p) =>
    typeof p === "string" ? pathname === p || pathname.startsWith(p + "/") : p.test(pathname)
  );
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Se a rota é pública, libera
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Verifica token de sessão (NextAuth)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Não autenticado
  if (!token) {
    // Para APIs, devolve 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Para páginas, redireciona para login com retorno à página original
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    // >>> usa 'callback' (compatível com sua tela de login)
    loginUrl.searchParams.set("callback", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // Regras de acesso a /admin e /api/admin (somente ADMIN/STAFF)
  const role = (token as any).role;
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminArea && !["ADMIN", "STAFF"].includes(role)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const to = req.nextUrl.clone();
    to.pathname = "/painel";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return NextResponse.next();
}

// Aplica o middleware em (quase) tudo, exceto estáticos do Next
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
