import { headers } from "next/headers";

import { LOCALE_HEADER, dictionaries, isLocale } from "@/i18n";

export default async function NotFound() {
  // not-found receives no params, so read the Locale from the proxy's rewrite.
  const locale = (await headers()).get(LOCALE_HEADER);
  const t = dictionaries[locale && isLocale(locale) ? locale : "ka"];
  return <main className="mx-auto max-w-3xl px-6 py-20 text-ink-soft">{t.notFound}</main>;
}
