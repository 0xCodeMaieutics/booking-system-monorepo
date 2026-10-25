import { formatDate, formatTime } from "@tsami/booking/time";
import type { ReactNode } from "react";

import { type Locale, dictionaries } from "@/i18n";

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
