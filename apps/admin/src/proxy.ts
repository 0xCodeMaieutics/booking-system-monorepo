import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/set-password", "/forgot-password"];

/**
 * Optimistic redirect to sign-in when there is no session cookie. The real
 * check happens in the tRPC context on every request.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
