"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { type Locale, dictionaries, isLocale, localePath } from "@/i18n";

/** Links to the current page in the other locale. */
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const other = locale === "ka" ? "en" : "ka";
  // The pathname may carry the internal `/ka` prefix from the proxy rewrite, so strip any locale.
  const segments = usePathname().split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) segments.shift();

  return (
    <Link
      href={localePath(other, `/${segments.join("/")}`)}
      className="text-sm text-ink-soft hover:text-ink"
      hrefLang={other}
    >
      {dictionaries[locale].otherLocale}
    </Link>
  );
}
