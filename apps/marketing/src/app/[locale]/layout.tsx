import "../globals.css";
import type { Metadata } from "next";
import { Noto_Sans_Georgian } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { dictionaries, isLocale } from "@/i18n";

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

  return (
    <html lang={locale} className={`${sans.variable} scroll-smooth`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
