"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime } from "@visita/booking/time";
import { Button, Card } from "@visita/ui";
import Link from "next/link";

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
      <Card className="flex flex-col items-start gap-4">
        <p>{t.manage.notFound}</p>
        <BookAgain locale={locale} />
      </Card>
    );
  }

  const a = appointment.data;
  const name = (x: { nameKa: string; nameEn: string }) => (locale === "ka" ? x.nameKa : x.nameEn);

  return (
    <Card className="flex flex-col items-start gap-5">
      <h1 className="text-3xl">{t.manage.title}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-ink-soft">{t.steps.treatment}</dt>
        <dd>{name(a.treatment)}</dd>
        <dt className="text-ink-soft">{t.steps.practitioner}</dt>
        <dd>{name(a.practitioner)}</dd>
        <dt className="text-ink-soft">{t.steps.time}</dt>
        <dd>
          {formatDate(a.startsAt, locale)}, {formatTime(a.startsAt)}–{formatTime(a.endsAt)}
        </dd>
        <dt className="text-ink-soft">{t.manage.statusLabel}</dt>
        <dd>{t.manage.status[a.status]}</dd>
      </dl>

      {a.status === "booked" &&
        (a.canCancel ? (
          <Button
            variant="danger"
            disabled={cancel.isPending}
            onClick={() => {
              if (window.confirm(t.manage.confirmCancel)) cancel.mutate({ token });
            }}
          >
            {t.manage.cancel}
          </Button>
        ) : (
          <p className="text-sm text-ink-soft">
            {t.manage.tooLate(a.cancellationCutoffHours)} <a href={`tel:${a.clinicPhone}`}>{a.clinicPhone}</a>
          </p>
        ))}
      {cancel.isError && <p className="text-sm text-danger">{t.errors.generic}</p>}
      {a.status === "cancelled" && <BookAgain locale={locale} />}
    </Card>
  );
}

function BookAgain({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath(locale)}>
      <Button variant="secondary">{dictionaries[locale].manage.bookAgain}</Button>
    </Link>
  );
}
