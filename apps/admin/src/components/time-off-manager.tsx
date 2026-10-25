"use client";

import { addDays, formatDate, formatTime, localInstant, parseMinute, toLocalDate } from "@tsami/booking/time";
import {
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
} from "@tsami/ui";
import { type FormEvent, useId, useState } from "react";

import { useTRPC } from "@/trpc/client";
import type { AdminOutputs } from "@/trpc/types";
import { useRefreshingMutation } from "@/trpc/use-refreshing-mutation";

import { errorMessage } from "./errors";

function describe(startsAt: Date, endsAt: Date) {
  const lastDay = toLocalDate(new Date(endsAt.getTime() - 1));
  const wholeDays = formatTime(startsAt) === "00:00" && formatTime(endsAt) === "00:00";
  if (wholeDays) {
    const first = formatDate(startsAt, "ka");
    return lastDay === toLocalDate(startsAt)
      ? first
      : `${first} – ${formatDate(localInstant(lastDay), "ka")}`;
  }
  return `${formatDate(startsAt, "ka")} ${formatTime(startsAt)} – ${formatDate(endsAt, "ka")} ${formatTime(endsAt)}`;
}

/**
 * Lists and adds Time Off. With a `practitionerId`, it's scoped to that
 * Practitioner (Clinic-wide closures are shown too); without, the Admin picks
 * from `practitioners`.
 */
export function TimeOffManager({
  practitionerId,
  timeOff,
  practitioners,
}: {
  practitionerId?: string;
  timeOff: AdminOutputs["timeOff"]["list"];
  practitioners?: AdminOutputs["practitioners"]["list"];
}) {
  const fieldId = useId();
  const trpc = useTRPC();
  const create = useRefreshingMutation(trpc.timeOff.create.mutationOptions());
  const remove = useRefreshingMutation(trpc.timeOff.delete.mutationOptions());

  const [form, setForm] = useState(() => {
    const today = toLocalDate(new Date());
    return {
      who: practitionerId ?? "",
      from: today,
      to: today,
      allDay: true,
      startTime: "09:00",
      endTime: "18:00",
      note: "",
    };
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const startsAt = form.allDay
      ? localInstant(form.from)
      : localInstant(form.from, parseMinute(form.startTime));
    const endsAt = form.allDay
      ? localInstant(addDays(form.to, 1))
      : localInstant(form.to, parseMinute(form.endTime));
    create.mutate({ practitionerId: form.who || null, startsAt, endsAt, note: form.note || null });
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2 text-sm">
        {timeOff.length === 0 && <li className="text-ink-soft">დაგეგმილი არასამუშაო დრო არ არის.</li>}
        {timeOff.map(({ timeOff: t, practitioner }) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-mist/50 px-3 py-2"
          >
            <span>
              {describe(t.startsAt, t.endsAt)} · {practitioner?.nameKa ?? "მთელი კლინიკა"}
              {t.note && <span className="text-ink-soft"> — {t.note}</span>}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ id: t.id })}
            >
              წაშლა
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {!practitionerId && (
            <Field>
              <FieldLabel htmlFor={`${fieldId}-1`}>ვისთვის</FieldLabel>
              <NativeSelect
                id={`${fieldId}-1`}
                value={form.who}
                onChange={(e) => setForm({ ...form, who: e.target.value })}
              >
                <NativeSelectOption value="">მთელი კლინიკა (დახურულია)</NativeSelectOption>
                {practitioners
                  ?.filter((p) => !p.archivedAt)
                  .map((p) => (
                    <NativeSelectOption key={p.id} value={p.id}>
                      {p.nameKa}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor={`${fieldId}-2`}>დან</FieldLabel>
            <Input
              id={`${fieldId}-2`}
              type="date"
              required
              value={form.from}
              onChange={(e) =>
                setForm({
                  ...form,
                  from: e.target.value,
                  to: e.target.value > form.to ? e.target.value : form.to,
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-3`}>მდე</FieldLabel>
            <Input
              id={`${fieldId}-3`}
              type="date"
              required
              min={form.from}
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
          />
          მთელი დღე
        </label>
        {!form.allDay && (
          <div className="flex gap-4">
            <Field>
              <FieldLabel htmlFor={`${fieldId}-4`}>დაწყება</FieldLabel>
              <Input
                id={`${fieldId}-4`}
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-5`}>დასრულება</FieldLabel>
              <Input
                id={`${fieldId}-5`}
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </Field>
          </div>
        )}
        <Field>
          <FieldLabel htmlFor={`${fieldId}-6`}>შენიშვნა</FieldLabel>
          <Input
            id={`${fieldId}-6`}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <FieldDescription>მაგ. შვებულება, ავადმყოფობა, დღესასწაული</FieldDescription>
        </Field>
        {create.error && <p className="text-sm text-danger">{errorMessage(create.error)}</p>}
        <Button size="lg" type="submit" className="self-start" disabled={create.isPending}>
          დამატება
        </Button>
      </form>
    </div>
  );
}
