import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ManageAppointment } from "@/components/manage-appointment";
import { isLocale } from "@/i18n";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ManagePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  return <ManageAppointment locale={locale} token={token} />;
}
