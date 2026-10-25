"use client";

import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { formatTime, localInstant, parseMinute } from "@tsami/booking/time";
import { Button, Field, Input, Select, Textarea, cn } from "@tsami/ui";
import { type FormEvent, useState } from "react";

import { useTRPC } from "@/trpc/client";

import { errorMessage } from "./errors";

const ANY = "";

/** Creates an Appointment, or moves one when `move` is given. */
export function AppointmentForm({
  move,
  initialDate,
  onDone,
}: {
  move?: { id: string; treatmentId: string; practitionerId: string };
  initialDate: string;
  onDone: (result: { startsAt: Date }) => void;
}) {
  const trpc = useTRPC();
  const treatments = useQuery(trpc.treatments.list.queryOptions());
  const practitioners = useQuery(trpc.practitioners.list.queryOptions());

  const [treatmentId, setTreatmentId] = useState(move?.treatmentId ?? "");
  const [practitionerId, setPractitionerId] = useState(move?.practitionerId ?? ANY);
  const [date, setDate] = useState(initialDate);
  const [startsAt, setStartsAt] = useState<Date>();
  const [override, setOverride] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [patient, setPatient] = useState({
    fullName: "",
    phone: "",
    email: "",
    note: "",
    locale: "ka" as "ka" | "en",
  });

  const qualified = (practitioners.data ?? []).filter(
    (p) => !p.archivedAt && (!treatmentId || p.treatmentIds.includes(treatmentId)),
  );
  const slots = useQuery(
    trpc.appointments.slots.queryOptions(
      treatmentId && !override
        ? { treatmentId, practitionerId: practitionerId || null, date, excludeAppointmentId: move?.id }
        : skipToken,
    ),
  );
  const uniqueSlots = [
    ...new Map((slots.data ?? []).map((s) => [s.startsAt.getTime(), s.startsAt])).values(),
  ];

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
          <Field label="პროცედურა">
            <Select
              required
              value={treatmentId}
              onChange={(e) => {
                setTreatmentId(e.target.value);
                setStartsAt(undefined);
              }}
            >
              <option value="">—</option>
              {treatments.data
                ?.filter((t) => !t.archivedAt)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameKa} ({t.durationMinutes} წთ)
                  </option>
                ))}
            </Select>
          </Field>
        )}
        <Field label="სპეციალისტი">
          <Select
            value={practitionerId}
            required={override || !!move}
            onChange={(e) => {
              setPractitionerId(e.target.value);
              setStartsAt(undefined);
            }}
          >
            {!move && <option value={ANY}>ნებისმიერი</option>}
            {qualified.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameKa}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="თარიღი">
          <Input
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
        <Field label="დრო" className="max-w-40">
          <Input
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
            {slots.isPending ? (
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
                        ? "border-accent bg-accent text-paper"
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
          <Field label="პაციენტის სახელი და გვარი">
            <Input
              required
              minLength={2}
              value={patient.fullName}
              onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
            />
          </Field>
          <Field label="მობილური" hint="არსებული ნომრის შემთხვევაში ვიზიტი იმავე პაციენტს მიებმება">
            <Input
              required
              type="tel"
              value={patient.phone}
              onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
            />
          </Field>
          <Field label="ელფოსტა (არასავალდებულო)">
            <Input
              type="email"
              value={patient.email}
              onChange={(e) => setPatient({ ...patient, email: e.target.value })}
            />
          </Field>
          <Field label="SMS-ის ენა">
            <Select
              value={patient.locale}
              onChange={(e) => setPatient({ ...patient, locale: e.target.value as "ka" | "en" })}
            >
              <option value="ka">ქართული</option>
              <option value="en">English</option>
            </Select>
          </Field>
          <Field label="შენიშვნა" className="sm:col-span-2">
            <Textarea
              value={patient.note}
              onChange={(e) => setPatient({ ...patient, note: e.target.value })}
            />
          </Field>
        </div>
      )}

      {mutation.error && <p className="text-sm text-danger">{errorMessage(mutation.error)}</p>}
      <Button type="submit" disabled={!chosenStart || mutation.isPending} className="self-start">
        {move ? "გადატანა (პაციენტი SMS-ს მიიღებს)" : "ვიზიტის შექმნა"}
      </Button>
    </form>
  );
}
