import "../globals.css";
import { Wordmark } from "@tsami/ui";
import { Noto_Sans_Georgian } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { dictionaries, isLocale } from "@/i18n";
import { Providers } from "@/trpc/client";

const sans = Noto_Sans_Georgian({ subsets: ["georgian", "latin"], variable: "--font-noto-sans" });
export function generateStaticParams() {
  return [{ locale: "ka" }, { locale: "en" }];
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

  return (
    <html lang={locale} className={sans.variable}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
        <footer className="mx-auto flex max-w-3xl items-center gap-1.5 px-6 pb-8 text-xs text-ink-soft">
          {t.poweredBy}{" "}
          <a href="https://tsami.ge" className="hover:underline">
            <Wordmark />
          </a>
        </footer>
      </body>
    </html>
  );
}
