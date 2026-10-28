"use client";

import { useMutation } from "@tanstack/react-query";
import { formatTime, localInstant, parseMinute } from "@tsami/booking/time";
import {
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  Textarea,
  cn,
} from "@tsami/ui";
import { type FormEvent, useEffect, useId, useState } from "react";

import { useTRPC, useTRPCClient } from "@/trpc/client";
import type { AdminInputs, AdminOutputs } from "@/trpc/types";

import { errorMessage } from "./errors";

const ANY = "";

/**
 * Creates an Appointment, or moves one when `move` is given. It doesn't refresh
 * the route itself: `onDone` navigates or refreshes.
 */
export function AppointmentForm({
  move,
  initialDate,
  treatments,
  practitioners,
  onDone,
}: {
  move?: { id: string; treatmentId: string; practitionerId: string };
  initialDate: string;
  treatments: AdminOutputs["treatments"]["list"];
  practitioners: AdminOutputs["practitioners"]["list"];
  onDone: (result: { startsAt: Date }) => void;
}) {
  const fieldId = useId();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const [treatmentId, setTreatmentId] = useState(move?.treatmentId ?? "");
  const [practitionerId, setPractitionerId] = useState(move?.practitionerId ?? ANY);
  const [date, setDate] = useState(initialDate);
  const [startsAt, setStartsAt] = useState<Date>();
  const [override, setOverride] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [patient, setPatient] = useState({
    fullName: "",
    channel: "sms" as "sms" | "email",
    phone: "",
    email: "",
    note: "",
    locale: "ka" as "ka" | "en",
  });

  const byEmail = patient.channel === "email";

  const qualified = practitioners.filter(
    (p) => !p.archivedAt && (!treatmentId || p.treatmentIds.includes(treatmentId)),
  );
  const slots = useSlots(
    trpcClient,
    treatmentId && !override
      ? { treatmentId, practitionerId: practitionerId || null, date, excludeAppointmentId: move?.id }
      : null,
  );
  const uniqueSlots = [...new Map((slots ?? []).map((s) => [s.startsAt.getTime(), s.startsAt])).values()];

  const create = useMutation(trpc.appointments.create.mutationOptions());
  const moveMutation = useMutation(trpc.appointments.move.mutationOptions());
  const mutation = move ? moveMutation : create;

  const chosenStart = override && manualTime ? localInstant(date, parseMinute(manualTime)) : startsAt;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!chosenStart || !treatmentId) return;
    if (move) {
      await moveMutation.mutateAsync({ id: move.id, practitionerId, startsAt: chosenStart, override });
    } else {
      await create.mutateAsync({
        treatmentId,
        practitionerId: practitionerId || null,
        startsAt: chosenStart,
        ...patient,
        override,
      });
    }
    onDone({ startsAt: chosenStart });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {!move && (
          <Field>
            <FieldLabel htmlFor={`${fieldId}-1`}>პროცედურა</FieldLabel>
            <NativeSelect
              id={`${fieldId}-1`}
              required
              value={treatmentId}
              onChange={(e) => {
                setTreatmentId(e.target.value);
                setStartsAt(undefined);
              }}
            >
              <NativeSelectOption value="">—</NativeSelectOption>
              {treatments
                .filter((t) => !t.archivedAt)
                .map((t) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.nameKa} ({t.durationMinutes} წთ)
                  </NativeSelectOption>
                ))}
            </NativeSelect>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor={`${fieldId}-2`}>სპეციალისტი</FieldLabel>
          <NativeSelect
            id={`${fieldId}-2`}
            value={practitionerId}
            required={override || !!move}
            onChange={(e) => {
              setPractitionerId(e.target.value);
              setStartsAt(undefined);
            }}
          >
            {!move && <NativeSelectOption value={ANY}>ნებისმიერი</NativeSelectOption>}
            {qualified.map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.nameKa}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-3`}>თარიღი</FieldLabel>
          <Input
            id={`${fieldId}-3`}
            type="date"
            required
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setStartsAt(undefined);
            }}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
        განრიგის გარეთ (მაგ. შესვენების დროს). სპეციალისტის ორ ვიზიტს ერთდროულად მაინც ვერ დაჯავშნით.
      </label>

      {override ? (
        <Field className="max-w-40">
          <FieldLabel htmlFor={`${fieldId}-4`}>დრო</FieldLabel>
          <Input
            id={`${fieldId}-4`}
            type="time"
            step={300}
            required
            value={manualTime}
            onChange={(e) => setManualTime(e.target.value)}
          />
        </Field>
      ) : (
        treatmentId && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">თავისუფალი დრო</span>
            {slots === undefined ? (
              <span className="text-sm text-ink-soft">იტვირთება…</span>
            ) : uniqueSlots.length === 0 ? (
              <span className="text-sm text-ink-soft">თავისუფალი დრო არ არის.</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {uniqueSlots.map((s) => (
                  <button
                    key={s.getTime()}
                    type="button"
                    onClick={() => setStartsAt(s)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm",
                      startsAt?.getTime() === s.getTime()
                        ? "border-brand bg-brand text-paper"
                        : "border-ink/15 bg-paper",
                    )}
                  >
                    {formatTime(s)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {!move && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${fieldId}-5`}>პაციენტის სახელი და გვარი</FieldLabel>
            <Input
              id={`${fieldId}-5`}
              required
              minLength={2}
              value={patient.fullName}
              onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={byEmail}
              onChange={(e) => setPatient({ ...patient, channel: e.target.checked ? "email" : "sms" })}
            />
            პაციენტს არ აქვს ქართული მობილურის ნომერი (შეტყობინებები ელფოსტით)
          </label>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-6`}>
              {byEmail ? "ტელეფონი (არასავალდებულო, ნებისმიერი ქვეყნის)" : "მობილური"}
            </FieldLabel>
            <Input
              id={`${fieldId}-6`}
              required={!byEmail}
              type="tel"
              value={patient.phone}
              onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
            />
            {!byEmail && (
              <FieldDescription>არსებული ნომრის შემთხვევაში ვიზიტი იმავე პაციენტს მიებმება</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-7`}>
              {byEmail ? "ელფოსტა" : "ელფოსტა (არასავალდებულო)"}
            </FieldLabel>
            <Input
              id={`${fieldId}-7`}
              required={byEmail}
              type="email"
              value={patient.email}
              onChange={(e) => setPatient({ ...patient, email: e.target.value })}
            />
            {byEmail && (
              <FieldDescription>
                არსებული ელფოსტის შემთხვევაში ვიზიტი იმავე პაციენტს მიებმება
              </FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-8`}>შეტყობინებების ენა</FieldLabel>
            <NativeSelect
              id={`${fieldId}-8`}
              value={patient.locale}
              onChange={(e) => setPatient({ ...patient, locale: e.target.value as "ka" | "en" })}
            >
              <NativeSelectOption value="ka">ქართული</NativeSelectOption>
              <NativeSelectOption value="en">English</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor={`${fieldId}-9`}>შენიშვნა</FieldLabel>
            <Textarea
              id={`${fieldId}-9`}
              value={patient.note}
              onChange={(e) => setPatient({ ...patient, note: e.target.value })}
            />
          </Field>
        </div>
      )}

      {mutation.error && <p className="text-sm text-danger">{errorMessage(mutation.error)}</p>}
      <Button size="lg" type="submit" disabled={!chosenStart || mutation.isPending} className="self-start">
        {move ? "გადატანა (პაციენტი შეტყობინებას მიიღებს)" : "ვიზიტის შექმნა"}
      </Button>
    </form>
  );
}

type SlotsInput = AdminInputs["appointments"]["slots"];
type Slot = AdminOutputs["appointments"]["slots"][number];

/** Available slots for the form's current choices; `undefined` while they load. */
function useSlots(client: ReturnType<typeof useTRPCClient>, input: SlotsInput | null) {
  const key = input && JSON.stringify(input);
  const [result, setResult] = useState<{ key: string; slots: Slot[] }>();

  useEffect(() => {
    if (!key) return;
    let current = true;
    client.appointments.slots.query(JSON.parse(key) as SlotsInput).then(
      (slots) => current && setResult({ key, slots }),
      () => current && setResult({ key, slots: [] }),
    );
    return () => {
      current = false;
    };
  }, [client, key]);

  return result && result.key === key ? result.slots : undefined;
}
