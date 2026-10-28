import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { LocaleSwitch } from "@/components/locale-switch";
import { clinicPath, dictionaries, isLocale } from "@/i18n";
import { findClinic } from "@/server/caller";

type Params = Promise<{ locale: string; handle: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, handle } = await params;
  const clinic = isLocale(locale) ? await findClinic(handle) : null;
  if (!isLocale(locale) || !clinic) return {};
  const t = dictionaries[locale];
  return {
    title: t.meta.title(locale === "ka" ? clinic.nameKa : clinic.nameEn),
    description: t.meta.description,
    alternates: { languages: { ka: clinicPath(handle, "ka"), en: clinicPath(handle, "en") } },
  };
}

/** One Clinic's Booking Site: in Tsami's styling, headed by the Clinic's name (ADR 0005). */
export default async function ClinicLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { locale, handle } = await params;
  const clinic = isLocale(locale) ? await findClinic(handle) : null;
  if (!isLocale(locale) || !clinic) notFound();

  return (
    <>
      <header className="border-b border-ink/10 bg-paper/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href={clinicPath(handle, locale)} className="text-lg font-semibold">
            {locale === "ka" ? clinic.nameKa : clinic.nameEn}
          </Link>
          <LocaleSwitch locale={locale} />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </>
  );
}
