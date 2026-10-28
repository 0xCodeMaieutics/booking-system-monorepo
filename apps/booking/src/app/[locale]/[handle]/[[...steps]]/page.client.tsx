"use client";

import { useMutation } from "@tanstack/react-query";
import { formatDate, formatLongDate, formatTime, toLocalDate } from "@tsami/booking/time";
import {
  Avatar,
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
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useMemo, useState, useTransition } from "react";

import {
  ANY_PRACTITIONER as ANY,
  type BookingSelection,
  bookingPath,
  parseBookingPathname,
} from "@/booking-path";
import { AppointmentDetails } from "@/components/appointment-details";
import { type Locale, clinicPath, dictionaries } from "@/i18n";
import { forgetManageToken, rememberManageToken } from "@/manage-token";
import { bookingCodeOf, useTRPC } from "@/trpc/client";
import type { BookingOutputs } from "@/trpc/types";

export function BookingFlow({
  locale,
  handle,
  treatments,
  practitioners,
  slots,
  clinicPhone,
}: {
  locale: Locale;
  handle: string;
  treatments: BookingOutputs["treatments"];
  practitioners: BookingOutputs["practitioners"] | null;
  slots: BookingOutputs["slots"] | null;
  clinicPhone: string;
}) {
  const t = dictionaries[locale];
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const name = (x: { nameKa: string; nameEn: string }) => (locale === "ka" ? x.nameKa : x.nameEn);

  const selection = parseBookingPathname(usePathname());

  /**
   * Steps that change what the page fetches go through the router; picking a date
   * or time only updates the URL, since the slots are already loaded.
   */
  function navigate(next: BookingSelection, { replace = false } = {}) {
    const url = clinicPath(handle, locale, bookingPath(next));
    const shallow =
      !next.confirmed &&
      next.treatmentId === selection.treatmentId &&
      next.practitionerId === selection.practitionerId;
    if (shallow) window.history[replace ? "replaceState" : "pushState"](null, "", url);
    else startNavigation(() => (replace ? router.replace(url) : router.push(url)));
  }

  const treatment = treatments.find((x) => x.id === selection.treatmentId);
  const treatmentId = treatment?.id;

  const practitioner = practitioners?.find((p) => p.id === selection.practitionerId);
  const practitionerId =
    practitioners && (selection.practitionerId === ANY || practitioner)
      ? selection.practitionerId
      : undefined;

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Date[]>();
    for (const s of slots ?? []) {
      const d = toLocalDate(s);
      map.set(d, [...(map.get(d) ?? []), s]);
    }
    return map;
  }, [slots]);

  const date = practitionerId ? selection.date : undefined;
  const startsAt = date ? slotsByDate.get(date)?.find((s) => formatTime(s) === selection.time) : undefined;

  function reset(step: "treatment" | "practitioner" | "time") {
    if (step === "treatment") navigate({});
    if (step === "practitioner") navigate({ treatmentId });
    if (step === "time") navigate({ treatmentId, practitionerId });
  }

  return (
    <div
      aria-busy={isNavigating}
      className={cn(
        "flex flex-col gap-8 transition-opacity",
        isNavigating && "pointer-events-none opacity-60",
      )}
    >
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
                avatar={
                  <Avatar
                    src={practitioner?.photoUrl}
                    name={practitioner && name(practitioner)}
                    className="size-6 text-[10px]"
                  />
                }
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
          {practitioners?.length === 0 ? (
            <p className="text-ink-soft">
              {t.practitioner.none} <a href={`tel:${clinicPhone}`}>{clinicPhone}</a>
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(practitioners?.length ?? 0) > 1 && (
                <Choice
                  title={t.practitioner.any}
                  hint={t.practitioner.anyHint}
                  avatar={<Avatar />}
                  onClick={() => navigate({ treatmentId, practitionerId: ANY })}
                />
              )}
              {practitioners?.map((p) => (
                <Choice
                  key={p.id}
                  title={name(p)}
                  hint={(locale === "ka" ? p.titleKa : p.titleEn) ?? undefined}
                  avatar={<Avatar src={p.photoUrl} name={name(p)} />}
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
          {slotsByDate.size === 0 ? (
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
          handle={handle}
          booking={{
            treatmentId: treatment.id,
            practitionerId: practitionerId === ANY ? null : practitionerId,
            startsAt,
          }}
          disabled={isNavigating}
          onBooked={(result) => {
            const confirmed = { ...selection, confirmed: true };
            rememberManageToken(clinicPath(handle, locale, bookingPath(confirmed)), result.manageToken);
            navigate(confirmed, { replace: true });
          }}
          onSlotGone={() => {
            navigate({ treatmentId, practitionerId, date }, { replace: true });
            startNavigation(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}

export function BookingConfirmation({
  locale,
  handle,
  manageToken,
  appointment,
}: {
  locale: Locale;
  handle: string;
  manageToken: string;
  appointment: BookingOutputs["appointment"] | null;
}) {
  const t = dictionaries[locale];
  const router = useRouter();
  const confirmationUrl = clinicPath(handle, locale, bookingPath(parseBookingPathname(usePathname())));

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4">
        <h1 className="text-3xl">{t.done.title}</h1>
        <p className="text-ink-soft">{t.done.body}</p>
        {appointment && <AppointmentDetails locale={locale} appointment={appointment} />}
        <div className="flex flex-wrap gap-3">
          <Link href={clinicPath(handle, locale, `/a/${manageToken}`)}>
            <Button type="button" size="lg">
              {t.done.manage}
            </Button>
          </Link>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => {
              forgetManageToken(confirmationUrl);
              router.replace(clinicPath(handle, locale));
            }}
          >
            {t.done.another}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  avatar,
  onChange,
  t,
}: {
  label: string;
  value: string;
  avatar?: ReactNode;
  onChange: () => void;
  t: (typeof dictionaries)[Locale];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2">
        <span className="text-ink-soft">{label}:</span>
        {avatar}
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

function Choice({
  title,
  hint,
  avatar,
  onClick,
}: {
  title: string;
  hint?: string;
  avatar: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper p-5 text-left transition-colors hover:border-brand"
    >
      {avatar}
      <span className="flex flex-col gap-1">
        <span className="text-lg font-medium">{title}</span>
        {hint && <span className="text-sm text-ink-soft">{hint}</span>}
      </span>
    </button>
  );
}

function DetailsStep({
  locale,
  handle,
  booking,
  disabled,
  onBooked,
  onSlotGone,
}: {
  locale: Locale;
  handle: string;
  booking: { treatmentId: string; practitionerId: string | null; startsAt: Date };
  disabled: boolean;
  onBooked: (result: { manageToken: string }) => void;
  onSlotGone: () => void;
}) {
  const fieldId = useId();
  const t = dictionaries[locale];
  const trpc = useTRPC();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", note: "" });
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const contact = channel === "sms" ? { channel, phone: form.phone } : { channel, email: form.email };
  const [verificationId, setVerificationId] = useState<string>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  const requestCode = useMutation(trpc.requestCode.mutationOptions());
  const checkCode = useMutation(trpc.checkCode.mutationOptions());
  const book = useMutation(trpc.book.mutationOptions());
  const busy = disabled || requestCode.isPending || checkCode.isPending || book.isPending;

  function showError(e: unknown) {
    const bookingCode = bookingCodeOf(e);
    if (bookingCode === "SLOT_TAKEN" || bookingCode === "SLOT_UNAVAILABLE") onSlotGone();
    setError((bookingCode && (t.errors as Record<string, string>)[bookingCode]) || t.errors.generic);
  }

  async function onSendCode(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    try {
      const requested = await requestCode.mutateAsync({ handle, contact, locale });
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
      await checkCode.mutateAsync({ handle, verificationId, contact, code });
      const result = await book.mutateAsync({
        handle,
        ...booking,
        ...form,
        channel,
        locale,
        verificationId,
      });
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={channel === "email"}
              onChange={(e) => setChannel(e.target.checked ? "email" : "sms")}
            />
            {t.details.noGeorgianNumber}
          </label>
          {channel === "sms" ? (
            <>
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
            </>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor={`${fieldId}-3`}>{t.details.emailRequired}</FieldLabel>
                <Input
                  id={`${fieldId}-3`}
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                />
                <FieldDescription>{t.details.emailHint}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${fieldId}-2`}>{t.details.phoneAnyCountry}</FieldLabel>
                <Input
                  id={`${fieldId}-2`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+44 …"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </Field>
            </>
          )}
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
            {t.details.codeSentTo} {channel === "sms" ? form.phone : form.email}
          </p>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-5`}>
              {channel === "sms" ? t.details.code : t.details.emailCode}
            </FieldLabel>
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
              {channel === "sms" ? t.details.resend : t.details.resendEmail}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
