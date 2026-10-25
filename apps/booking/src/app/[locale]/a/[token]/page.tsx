import { Button, Card, CardContent } from "@tsami/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentDetails } from "@/components/appointment-details";
import { type Locale, dictionaries, isLocale, localePath } from "@/i18n";
import { findOrNull, serverCaller } from "@/server/caller";

import { CancelAppointment } from "./page.client";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ManagePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionaries[locale];
  const a = token.length >= 16 ? await findOrNull((await serverCaller()).appointment({ token })) : null;

  if (!a) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4">
          <p>{t.manage.notFound}</p>
          <BookAgain locale={locale} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-5">
        <h1 className="text-3xl">{t.manage.title}</h1>
        <AppointmentDetails locale={locale} appointment={a}>
          <dt className="text-ink-soft">{t.manage.statusLabel}</dt>
          <dd>{t.manage.status[a.status]}</dd>
        </AppointmentDetails>

        {a.status === "booked" &&
          (a.canCancel ? (
            <CancelAppointment locale={locale} token={token} />
          ) : (
            <p className="text-sm text-ink-soft">
              {t.manage.tooLate(a.cancellationCutoffHours)}{" "}
              <a href={`tel:${a.clinicPhone}`} className="underline underline-offset-2">
                {a.clinicPhone}
              </a>
            </p>
          ))}
        {a.status === "cancelled" && <BookAgain locale={locale} />}
      </CardContent>
    </Card>
  );
}

function BookAgain({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath(locale)}>
      <Button type="button" size="lg" variant="outline">
        {dictionaries[locale].manage.bookAgain}
      </Button>
    </Link>
  );
}
