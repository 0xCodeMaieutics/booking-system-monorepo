import { type NextRequest, NextResponse } from "next/server";

/**
 * Georgian is served at `/`, English at `/en/`. Internally every page lives
 * under `/[locale]`, so un-prefixed paths are rewritten to `/ka`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/ka" || pathname.startsWith("/ka/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/ka${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
