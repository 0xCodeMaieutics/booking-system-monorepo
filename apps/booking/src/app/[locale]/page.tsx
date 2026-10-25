import { notFound } from "next/navigation";

import { BookingFlow } from "@/components/booking-flow";
import { isLocale } from "@/i18n";
import { serverCaller } from "@/server/caller";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ treatment?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { treatment } = await searchParams;

  const api = await serverCaller();
  const [treatments, clinic] = await Promise.all([api.treatments(), api.clinic()]);

  return (
    <BookingFlow
      locale={locale}
      treatments={treatments}
      clinicPhone={clinic.clinicPhone}
      initialTreatmentId={treatments.some((t) => t.id === treatment) ? treatment : undefined}
    />
  );
}
