import { type NextRequest, NextResponse } from "next/server";

import { LOCALE_HEADER } from "@/i18n";

const MARKETING_SITE_URL = "https://tsami.ge";

/**
 * Each Clinic's Booking Site lives under its Handle: Georgian at `/{handle}`, English at
 * `/{handle}/en` (docs/adr/0008). Internally every page lives under `/[locale]/[handle]`,
 * so public paths are rewritten there. `/` and `/en` belong to no Clinic.
 */
export function proxy(request: NextRequest) {
  const [handle, ...rest] = request.nextUrl.pathname.split("/").filter(Boolean);
  if (!handle || (handle === "en" && rest.length === 0)) return NextResponse.redirect(MARKETING_SITE_URL);

  const locale = rest[0] === "en" ? "en" : "ka";
  if (locale === "en") rest.shift();

  const url = request.nextUrl.clone();
  url.pathname = `/${[locale, handle, ...rest].join("/")}`;
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
