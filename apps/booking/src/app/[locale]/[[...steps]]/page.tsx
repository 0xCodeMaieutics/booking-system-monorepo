import { addDays } from "@tsami/booking/time";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ANY_PRACTITIONER, bookingPath, parseBookingSteps } from "@/booking-path";
import { isLocale, localePath } from "@/i18n";
import { todayInClinic } from "@/lib/dates";
import { MANAGE_TOKEN_COOKIE } from "@/manage-token";
import { findOrNull, serverCaller } from "@/server/caller";

import { BookingConfirmation, BookingFlow } from "./page.client";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; steps?: string[] }>;
  searchParams: Promise<{ treatment?: string }>;
}) {
  const { locale, steps = [] } = await params;
  const selection = isLocale(locale) ? parseBookingSteps(steps) : undefined;
  if (!isLocale(locale) || !selection) notFound();
  const { treatment } = await searchParams;
  if (treatment && steps.length === 0) redirect(localePath(locale, bookingPath({ treatmentId: treatment })));

  const api = await serverCaller();

  if (selection.confirmed) {
    const manageToken = (await cookies()).get(MANAGE_TOKEN_COOKIE)?.value;
    if (!manageToken) redirect(localePath(locale, bookingPath({ ...selection, confirmed: false })));
    const appointment = await findOrNull(api.appointment({ token: manageToken }));
    return <BookingConfirmation locale={locale} manageToken={manageToken} appointment={appointment} />;
  }

  const [treatments, clinic] = await Promise.all([api.treatments(), api.clinic()]);
  const treatmentId = treatments.find((x) => x.id === selection.treatmentId)?.id;
  const practitioners = treatmentId ? await api.practitioners({ treatmentId }) : null;
  const practitionerId =
    selection.practitionerId === ANY_PRACTITIONER ||
    practitioners?.some((p) => p.id === selection.practitionerId)
      ? selection.practitionerId
      : undefined;
  const today = todayInClinic();
  const slots =
    treatmentId && practitionerId
      ? await api.slots({
          treatmentId,
          practitionerId: practitionerId === ANY_PRACTITIONER ? null : practitionerId,
          from: today,
          to: addDays(today, 365),
        })
      : null;

  return (
    <BookingFlow
      locale={locale}
      treatments={treatments}
      practitioners={practitioners}
      slots={slots}
      clinicPhone={clinic.clinicPhone}
    />
  );
}
