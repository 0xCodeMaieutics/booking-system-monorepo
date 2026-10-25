"use client";

import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { addDays, formatDate, formatLongDate, formatTime, toLocalDate } from "@tsami/booking/time";
import {
  Button,
  Card,
  CardContent,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Textarea,
  cn,
} from "@tsami/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FormEvent, useId, useMemo, useState } from "react";

import {
  ANY_PRACTITIONER as ANY,
  type BookingSelection,
  bookingPath,
  parseBookingPathname,
} from "@/booking-path";
import { type Locale, dictionaries, localePath } from "@/i18n";
import { bookingCodeOf, useTRPC } from "@/trpc/client";

type Treatment = {
  id: string;
  nameKa: string;
  nameEn: string;
  descriptionKa: string | null;
  descriptionEn: string | null;
  durationMinutes: number;
  priceFromGel: number | null;
};

export function BookingFlow({
  locale,
  treatments,
  clinicPhone,
}: {
  locale: Locale;
  treatments: Treatment[];
  clinicPhone: string;
}) {
  const t = dictionaries[locale];
  const trpc = useTRPC();
  const name = (x: { nameKa: string; nameEn: string }) => (locale === "ka" ? x.nameKa : x.nameEn);

  const selection = parseBookingPathname(usePathname());
  const [booked, setBooked] = useState<{ manageToken: string }>();

  function navigate(next: BookingSelection, { replace = false } = {}) {
    const url = localePath(locale, bookingPath(next));
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  const treatment = treatments.find((x) => x.id === selection.treatmentId);
  const treatmentId = treatment?.id;

  const practitioners = useQuery(trpc.practitioners.queryOptions(treatmentId ? { treatmentId } : skipToken));
  const practitioner = practitioners.data?.find((p) => p.id === selection.practitionerId);
  const practitionerId =
    practitioners.data && (selection.practitionerId === ANY || practitioner)
      ? selection.practitionerId
      : undefined;

  const [today] = useState(() => toLocalDate(new Date()));
  const slots = useQuery(
    trpc.slots.queryOptions(
      treatmentId && practitionerId
        ? {
            treatmentId,
            practitionerId: practitionerId === ANY ? null : practitionerId,
            from: today,
            to: addDays(today, 365),
          }
        : skipToken,
    ),
  );
  const slotsByDate = useMemo(() => {
    const map = new Map<string, Date[]>();
    for (const s of slots.data ?? []) {
      const d = toLocalDate(s);
      map.set(d, [...(map.get(d) ?? []), s]);
    }
    return map;
  }, [slots.data]);

  const date = practitionerId ? selection.date : undefined;
  const startsAt = date ? slotsByDate.get(date)?.find((s) => formatTime(s) === selection.time) : undefined;

  function reset(step: "treatment" | "practitioner" | "time") {
    if (step === "treatment") navigate({});
    if (step === "practitioner") navigate({ treatmentId });
    if (step === "time") navigate({ treatmentId, practitionerId });
  }

  if (booked) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4">
          <h1 className="text-3xl">{t.done.title}</h1>
          <p className="text-ink-soft">{t.done.body}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={localePath(locale, `/a/${booked.manageToken}`)}>
              <Button type="button" size="lg">
                {t.done.manage}
              </Button>
            </Link>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => {
                setBooked(undefined);
                navigate({}, { replace: true });
              }}
            >
              {t.done.another}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {treatment && (
        <Card size="sm" className="bg-mist/50 text-sm">
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs tracking-widest text-ink-soft uppercase">{t.summary}</span>
            <SummaryRow
              label={t.steps.treatment}
              value={name(treatment)}
              onChange={() => reset("treatment")}
              t={t}
            />
            {practitionerId && (
              <SummaryRow
                label={t.steps.practitioner}
                value={practitioner ? name(practitioner) : t.practitioner.any}
                onChange={() => reset("practitioner")}
                t={t}
              />
            )}
            {startsAt && (
              <SummaryRow
                label={t.steps.time}
                value={`${formatDate(startsAt, locale)}, ${formatTime(startsAt)}`}
                onChange={() => reset("time")}
                t={t}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!treatment && (
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl">{t.treatment.title}</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {treatments.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => navigate({ treatmentId: x.id })}
                className="flex flex-col gap-1 rounded-2xl border border-ink/10 bg-paper p-5 text-left transition-colors hover:border-brand"
              >
                <span className="text-lg font-medium">{name(x)}</span>
                <span className="text-sm text-ink-soft">
                  {x.durationMinutes} {t.treatment.minutes}
                  {x.priceFromGel !== null && ` · ${t.treatment.price(x.priceFromGel)}`}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {treatment && !practitionerId && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl">{t.practitioner.title}</h2>
          {practitioners.isPending ? (
            <p className="text-ink-soft">{t.time.loading}</p>
          ) : practitioners.data?.length === 0 ? (
            <p className="text-ink-soft">
              {t.practitioner.none} <a href={`tel:${clinicPhone}`}>{clinicPhone}</a>
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(practitioners.data?.length ?? 0) > 1 && (
                <Choice
                  title={t.practitioner.any}
                  hint={t.practitioner.anyHint}
                  onClick={() => navigate({ treatmentId, practitionerId: ANY })}
                />
              )}
              {practitioners.data?.map((p) => (
                <Choice
                  key={p.id}
                  title={name(p)}
                  hint={(locale === "ka" ? p.titleKa : p.titleEn) ?? undefined}
                  onClick={() => navigate({ treatmentId, practitionerId: p.id })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {treatment && practitionerId && !startsAt && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl">{t.time.title}</h2>
          {slots.isPending ? (
            <p className="text-ink-soft">{t.time.loading}</p>
          ) : slotsByDate.size === 0 ? (
            <p className="text-ink-soft">{t.time.none}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {[...slotsByDate].map(([d, daySlots]) => (
                <DaySlots
                  key={d}
                  label={formatLongDate(daySlots[0]!, locale)}
                  slots={daySlots}
                  expanded={d === date}
                  onToggle={() =>
                    navigate(
                      { treatmentId, practitionerId, date: d === date ? undefined : d },
                      { replace: !!date },
                    )
                  }
                  onPick={(s) => navigate({ treatmentId, practitionerId, date: d, time: formatTime(s) })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {treatment && practitionerId && startsAt && (
        <DetailsStep
          locale={locale}
          booking={{
            treatmentId: treatment.id,
            practitionerId: practitionerId === ANY ? null : practitionerId,
            startsAt,
          }}
          onBooked={(result) => {
            setBooked(result);
            navigate({}, { replace: true });
          }}
          onSlotGone={() => {
            navigate({ treatmentId, practitionerId, date }, { replace: true });
            void slots.refetch();
          }}
        />
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: string;
  onChange: () => void;
  t: (typeof dictionaries)[Locale];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="text-ink-soft">{label}: </span>
        {value}
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={onChange}>
        {t.change}
      </Button>
    </div>
  );
}

function DaySlots({
  label,
  slots,
  expanded,
  onToggle,
  onPick,
}: {
  label: string;
  slots: Date[];
  expanded: boolean;
  onToggle: () => void;
  onPick: (slot: Date) => void;
}) {
  const panelId = useId();
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium transition-colors hover:bg-mist/40"
      >
        {label}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={cn("size-5 shrink-0 text-ink-soft transition-transform", expanded && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {expanded && (
        <div id={panelId} className="grid grid-cols-3 gap-3 border-t border-ink/10 p-5 sm:grid-cols-5">
          {slots.map((s) => (
            <button
              key={s.getTime()}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-lg bg-mist/60 py-3 font-semibold transition-colors hover:bg-brand hover:text-paper"
            >
              {formatTime(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Choice({ title, hint, onClick }: { title: string; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1 rounded-2xl border border-ink/10 bg-paper p-5 text-left transition-colors hover:border-brand"
    >
      <span className="text-lg font-medium">{title}</span>
      {hint && <span className="text-sm text-ink-soft">{hint}</span>}
    </button>
  );
}

function DetailsStep({
  locale,
  booking,
  onBooked,
  onSlotGone,
}: {
  locale: Locale;
  booking: { treatmentId: string; practitionerId: string | null; startsAt: Date };
  onBooked: (result: { manageToken: string }) => void;
  onSlotGone: () => void;
}) {
  const fieldId = useId();
  const t = dictionaries[locale];
  const trpc = useTRPC();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", note: "" });
  const [verificationId, setVerificationId] = useState<string>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  const requestCode = useMutation(trpc.requestCode.mutationOptions());
  const checkCode = useMutation(trpc.checkCode.mutationOptions());
  const book = useMutation(trpc.book.mutationOptions());
  const busy = requestCode.isPending || checkCode.isPending || book.isPending;

  function showError(e: unknown) {
    const bookingCode = bookingCodeOf(e);
    if (bookingCode === "SLOT_TAKEN" || bookingCode === "SLOT_UNAVAILABLE") onSlotGone();
    setError((bookingCode && (t.errors as Record<string, string>)[bookingCode]) || t.errors.generic);
  }

  async function onSendCode(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    try {
      const requested = await requestCode.mutateAsync({ phone: form.phone, locale });
      setVerificationId(requested.verificationId);
    } catch (err) {
      showError(err);
    }
  }

  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    if (!verificationId) return;
    setError(undefined);
    try {
      await checkCode.mutateAsync({ verificationId, phone: form.phone, code });
      const result = await book.mutateAsync({ ...booking, ...form, locale, verificationId });
      onBooked(result);
    } catch (err) {
      showError(err);
    }
  }

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl">{t.details.title}</h2>
      {!verificationId ? (
        <form onSubmit={onSendCode} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor={`${fieldId}-1`}>{t.details.fullName}</FieldLabel>
            <Input
              id={`${fieldId}-1`}
              required
              minLength={2}
              autoComplete="name"
              value={form.fullName}
              onChange={set("fullName")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-2`}>{t.details.phone}</FieldLabel>
            <Input
              id={`${fieldId}-2`}
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="5XX XX XX XX"
              value={form.phone}
              onChange={set("phone")}
            />
            <FieldDescription>{t.details.phoneHint}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-3`}>{t.details.email}</FieldLabel>
            <Input
              id={`${fieldId}-3`}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-4`}>{t.details.note}</FieldLabel>
            <Textarea id={`${fieldId}-4`} value={form.note} onChange={set("note")} maxLength={1000} />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button size="lg" type="submit" disabled={busy} className="self-start">
            {t.details.sendCode}
          </Button>
        </form>
      ) : (
        <form onSubmit={onConfirm} className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">
            {t.details.codeSentTo} {form.phone}
          </p>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-5`}>{t.details.code}</FieldLabel>
            <Input
              id={`${fieldId}-5`}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="max-w-40 text-lg tracking-widest"
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button size="lg" type="submit" disabled={busy}>
              {t.details.confirm}
            </Button>
            <Button type="button" size="lg" variant="ghost" onClick={() => setVerificationId(undefined)}>
              {t.details.resend}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
