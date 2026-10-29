import { Button } from "@tsami/ui";
import { headers } from "next/headers";

import { LOCALE_HEADER, dictionaries, isLocale } from "@/i18n";

const MARKETING_SITE_URL = "https://tsami.ge";

export default async function NotFound() {
  // not-found receives no params, so read the Locale from the proxy's rewrite.
  const locale = (await headers()).get(LOCALE_HEADER);
  const t = dictionaries[locale && isLocale(locale) ? locale : "ka"];
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">{t.notFound.title}</h1>
        <p className="text-ink-soft">{t.notFound.body}</p>
      </div>
      <Button asChild>
        <a href={MARKETING_SITE_URL}>{t.notFound.home}</a>
      </Button>
    </main>
  );
}
