import "../globals.css";
import type { Metadata } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { dictionaries, isLocale, localePath } from "@/i18n";
import { Providers } from "@/trpc/client";

const sans = Noto_Sans_Georgian({ subsets: ["georgian", "latin"], variable: "--font-noto-sans" });
const serif = Noto_Serif_Georgian({ subsets: ["georgian", "latin"], variable: "--font-noto-serif" });

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
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <header className="border-b border-ink/10 bg-paper/70">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href={localePath(locale)} className="font-serif text-lg">
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
      </body>
    </html>
  );
}
