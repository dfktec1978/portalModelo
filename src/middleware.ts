import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // 🔐 Admin
  if (host.startsWith("admin.")) {
    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL(`/admin${pathname}`, req.url)
      );
    }
  }

  // 🏪 Lojista
  if (host.startsWith("lojista.")) {
    if (!pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(
        new URL(`/dashboard${pathname}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
