import { notFound, redirect } from "next/navigation";

import { bookingPath, parseBookingSteps } from "@/booking-path";
import { BookingFlow } from "@/components/booking-flow";
import { isLocale, localePath } from "@/i18n";
import { serverCaller } from "@/server/caller";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; steps?: string[] }>;
  searchParams: Promise<{ treatment?: string }>;
}) {
  const { locale, steps = [] } = await params;
  if (!isLocale(locale) || !parseBookingSteps(steps)) notFound();
  const { treatment } = await searchParams;
  if (treatment && steps.length === 0) redirect(localePath(locale, bookingPath({ treatmentId: treatment })));

  const api = await serverCaller();
  const [treatments, clinic] = await Promise.all([api.treatments(), api.clinic()]);

  return <BookingFlow locale={locale} treatments={treatments} clinicPhone={clinic.clinicPhone} />;
}
