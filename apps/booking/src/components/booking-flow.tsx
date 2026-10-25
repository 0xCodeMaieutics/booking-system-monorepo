"use client";

import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { addDays, formatDate, formatTime, toLocalDate } from "@tsami/booking/time";
import { Button, Card, CardContent, Field, Input, Textarea, cn } from "@tsami/ui";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";

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

const ANY = "any";

export function BookingFlow({
  locale,
  treatments,
  clinicPhone,
  initialTreatmentId,
}: {
  locale: Locale;
  treatments: Treatment[];
  clinicPhone: string;
  initialTreatmentId?: string;
}) {
  const t = dictionaries[locale];
  const trpc = useTRPC();
  const name = (x: { nameKa: string; nameEn: string }) => (locale === "ka" ? x.nameKa : x.nameEn);

  const [treatmentId, setTreatmentId] = useState(initialTreatmentId);
  const [practitionerId, setPractitionerId] = useState<string>();
  const [date, setDate] = useState<string>();
  const [startsAt, setStartsAt] = useState<Date>();
  const [booked, setBooked] = useState<{ manageToken: string }>();

  const treatment = treatments.find((x) => x.id === treatmentId);

  const practitioners = useQuery(trpc.practitioners.queryOptions(treatmentId ? { treatmentId } : skipToken));
  const practitioner = practitioners.data?.find((p) => p.id === practitionerId);

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

  function reset(step: "treatment" | "practitioner" | "time") {
    if (step === "treatment") setTreatmentId(undefined);
    if (step !== "time") setPractitionerId(undefined);
    setDate(undefined);
    setStartsAt(undefined);
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
                reset("treatment");
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
                onClick={() => setTreatmentId(x.id)}
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
                  onClick={() => setPractitionerId(ANY)}
                />
              )}
              {practitioners.data?.map((p) => (
                <Choice
                  key={p.id}
                  title={name(p)}
                  hint={(locale === "ka" ? p.titleKa : p.titleEn) ?? undefined}
                  onClick={() => setPractitionerId(p.id)}
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
            <>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {[...slotsByDate.keys()].map((d) => {
                  const first = slotsByDate.get(d)![0]!;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDate(d)}
                      className={cn(
                        "shrink-0 rounded-xl border px-4 py-2 text-sm whitespace-nowrap",
                        d === date ? "border-brand bg-brand text-paper" : "border-ink/15 bg-paper",
                      )}
                    >
                      {formatDate(first, locale)}
                    </button>
                  );
                })}
              </div>
              {date && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slotsByDate.get(date)?.map((s) => (
                    <Button
                      type="button"
                      size="lg"
                      key={s.getTime()}
                      variant="outline"
                      onClick={() => setStartsAt(s)}
                    >
                      {formatTime(s)}
                    </Button>
                  ))}
                </div>
              )}
            </>
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
          onBooked={setBooked}
          onSlotGone={() => {
            setStartsAt(undefined);
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
          <Field label={t.details.fullName}>
            <Input
              required
              minLength={2}
              autoComplete="name"
              value={form.fullName}
              onChange={set("fullName")}
            />
          </Field>
          <Field label={t.details.phone} hint={t.details.phoneHint}>
            <Input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="5XX XX XX XX"
              value={form.phone}
              onChange={set("phone")}
            />
          </Field>
          <Field label={t.details.email}>
            <Input type="email" autoComplete="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label={t.details.note}>
            <Textarea value={form.note} onChange={set("note")} maxLength={1000} />
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
          <Field label={t.details.code}>
            <Input
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
