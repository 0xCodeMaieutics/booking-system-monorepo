import "../globals.css";
import { Wordmark } from "@visita/ui";
import type { Metadata } from "next";
import { Noto_Sans_Georgian } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { dictionaries, isLocale, localePath } from "@/i18n";
import { Providers } from "@/trpc/client";

const sans = Noto_Sans_Georgian({ subsets: ["georgian", "latin"], variable: "--font-noto-sans" });
export function generateStaticParams() {
  return [{ locale: "ka" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dictionaries[locale];
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { languages: { ka: "/", en: "/en" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionaries[locale];
  const other = locale === "ka" ? "en" : "ka";

  return (
    <html lang={locale} className={sans.variable}>
      <body className="min-h-dvh">
        <header className="border-b border-ink/10 bg-paper/70">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href={localePath(locale)} className="text-lg font-semibold">
              {t.clinic}
            </Link>
            <Link href={localePath(other)} className="text-sm text-ink-soft hover:text-ink" hrefLang={other}>
              {t.otherLocale}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">
          <Providers>{children}</Providers>
        </main>
        <footer className="mx-auto flex max-w-3xl items-center gap-1.5 px-6 pb-8 text-xs text-ink-soft">
          {t.poweredBy} <Wordmark />
        </footer>
      </body>
    </html>
  );
}
