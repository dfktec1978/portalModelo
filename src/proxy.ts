import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // 🔐 Admin — redireciona apenas a raiz do host admin.*
  if (host.startsWith("admin.")) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL(`/admin`, req.url));
    }
  }

  // 🏪 Lojista — redireciona apenas a raiz do host lojista.*
  if (host.startsWith("lojista.")) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL(`/dashboard`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
