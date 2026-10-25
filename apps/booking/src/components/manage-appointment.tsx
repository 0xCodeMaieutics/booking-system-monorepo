"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime } from "@tsami/booking/time";
import { Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";
import type { ReactNode } from "react";

import { type Locale, dictionaries, localePath } from "@/i18n";
import { useTRPC } from "@/trpc/client";

export function ManageAppointment({ locale, token }: { locale: Locale; token: string }) {
  const t = dictionaries[locale];
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const appointment = useQuery(trpc.appointment.queryOptions({ token }, { retry: false }));
  const cancel = useMutation(
    trpc.cancel.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.appointment.queryKey({ token }) }),
    }),
  );

  if (appointment.isPending) return <p className="text-ink-soft">{t.time.loading}</p>;
  if (!appointment.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4">
          <p>{t.manage.notFound}</p>
          <BookAgain locale={locale} />
        </CardContent>
      </Card>
    );
  }

  const a = appointment.data;

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
            <Button
              type="button"
              size="lg"
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => {
                if (window.confirm(t.manage.confirmCancel)) cancel.mutate({ token });
              }}
            >
              {t.manage.cancel}
            </Button>
          ) : (
            <p className="text-sm text-ink-soft">
              {t.manage.tooLate(a.cancellationCutoffHours)}{" "}
              <a href={`tel:${a.clinicPhone}`} className="underline underline-offset-2">
                {a.clinicPhone}
              </a>
            </p>
          ))}
        {cancel.isError && <p className="text-sm text-danger">{t.errors.generic}</p>}
        {a.status === "cancelled" && <BookAgain locale={locale} />}
      </CardContent>
    </Card>
  );
}

type Named = { nameKa: string; nameEn: string };

export function AppointmentDetails({
  locale,
  appointment: a,
  children,
}: {
  locale: Locale;
  appointment: { treatment: Named; practitioner: Named; startsAt: Date; endsAt: Date };
  children?: ReactNode;
}) {
  const t = dictionaries[locale];
  const name = (x: Named) => (locale === "ka" ? x.nameKa : x.nameEn);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      <dt className="text-ink-soft">{t.steps.treatment}</dt>
      <dd>{name(a.treatment)}</dd>
      <dt className="text-ink-soft">{t.steps.practitioner}</dt>
      <dd>{name(a.practitioner)}</dd>
      <dt className="text-ink-soft">{t.steps.time}</dt>
      <dd>
        {formatDate(a.startsAt, locale)}, {formatTime(a.startsAt)}–{formatTime(a.endsAt)}
      </dd>
      {children}
    </dl>
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
