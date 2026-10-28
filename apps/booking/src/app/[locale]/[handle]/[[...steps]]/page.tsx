import { addDays } from "@tsami/booking/time";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ANY_PRACTITIONER, bookingPath, parseBookingSteps } from "@/booking-path";
import { clinicPath, dictionaries, isLocale } from "@/i18n";
import { todayInClinic } from "@/lib/dates";
import { MANAGE_TOKEN_COOKIE } from "@/manage-token";
import { findClinic, findOrNull, serverCaller } from "@/server/caller";

import { BookingConfirmation, BookingFlow } from "./page.client";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; handle: string; steps?: string[] }>;
  searchParams: Promise<{ treatment?: string }>;
}) {
  const { locale, handle, steps = [] } = await params;
  const selection = isLocale(locale) ? parseBookingSteps(steps) : undefined;
  const clinic = await findClinic(handle);
  if (!isLocale(locale) || !selection || !clinic) notFound();
  const { treatment } = await searchParams;
  if (treatment && steps.length === 0) {
    redirect(clinicPath(handle, locale, bookingPath({ treatmentId: treatment })));
  }

  const api = await serverCaller();

  if (selection.confirmed) {
    const manageToken = (await cookies()).get(MANAGE_TOKEN_COOKIE)?.value;
    if (!manageToken) redirect(clinicPath(handle, locale, bookingPath({ ...selection, confirmed: false })));
    const appointment = await findOrNull(api.appointment({ handle, token: manageToken }));
    return (
      <BookingConfirmation
        locale={locale}
        handle={handle}
        manageToken={manageToken}
        appointment={appointment}
      />
    );
  }

  if (clinic.closed) {
    const t = dictionaries[locale];
    return (
      <p className="text-ink-soft">
        {t.closed(locale === "ka" ? clinic.nameKa : clinic.nameEn)}{" "}
        <a href={`tel:${clinic.clinicPhone}`}>{clinic.clinicPhone}</a>
      </p>
    );
  }

  const treatments = await api.treatments({ handle });
  const treatmentId = treatments.find((x) => x.id === selection.treatmentId)?.id;
  const practitioners = treatmentId ? await api.practitioners({ handle, treatmentId }) : null;
  const practitionerId =
    selection.practitionerId === ANY_PRACTITIONER ||
    practitioners?.some((p) => p.id === selection.practitionerId)
      ? selection.practitionerId
      : undefined;
  const today = todayInClinic();
  const slots =
    treatmentId && practitionerId
      ? await api.slots({
          handle,
          treatmentId,
          practitionerId: practitionerId === ANY_PRACTITIONER ? null : practitionerId,
          from: today,
          to: addDays(today, 365),
        })
      : null;

  return (
    <BookingFlow
      locale={locale}
      handle={handle}
      treatments={treatments}
      practitioners={practitioners}
      slots={slots}
      clinicPhone={clinic.clinicPhone}
      smsAvailable={clinic.smsAvailable}
    />
  );
}
