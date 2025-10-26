// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const mustBeAuthed = pathname.startsWith("/painel") || pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (mustBeAuthed) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callback", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      const role = (token as any).role;
      if (!["ADMIN", "STAFF"].includes(role)) {
        const url = req.nextUrl.clone();
        url.pathname = "/painel";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*", "/admin/:path*", "/api/admin/:path*"],
};
