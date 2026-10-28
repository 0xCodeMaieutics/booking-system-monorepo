"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { type Locale, clinicPath, dictionaries, parseSitePathname } from "@/i18n";

/** Links to the current page in the other locale. */
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const other = locale === "ka" ? "en" : "ka";
  const { handle, rest } = parseSitePathname(usePathname());

  return (
    <Link
      href={clinicPath(handle, other, `/${rest.join("/")}`)}
      className="text-sm text-ink-soft hover:text-ink"
      hrefLang={other}
    >
      {dictionaries[locale].otherLocale}
    </Link>
  );
}
