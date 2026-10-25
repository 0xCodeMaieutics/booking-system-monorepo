"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, formatDate, formatTime, toLocalDate } from "@tsami/booking/time";
import { Button, Card, CardContent, Input, cn } from "@tsami/ui";
import Link from "next/link";
import { useState } from "react";

import { attentionLabel, statusLabel, statusTone } from "@/lib/labels";
import { useTRPC } from "@/trpc/client";

import { AppointmentForm } from "./appointment-form";
import { errorMessage } from "./errors";

export function AppointmentsDay() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => toLocalDate(new Date()));
  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<string>();

  const day = useQuery(trpc.appointments.day.queryOptions({ date }));
  const attention = useQuery(trpc.attention.list.queryOptions());
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.appointments.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.attention.pathKey() }),
    ]);

  const setStatus = useMutation(trpc.appointments.setStatus.mutationOptions({ onSuccess: invalidate }));
  const [now] = useState(() => new Date());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">ვიზიტები</h1>
        <Button type="button" size="lg" onClick={() => setCreating((v) => !v)}>
          {creating ? "დახურვა" : "ახალი ვიზიტი"}
        </Button>
      </div>

      {creating && (
        <Card>
          <CardContent>
            <AppointmentForm
              initialDate={date}
              onDone={async (created) => {
                setCreating(false);
                setDate(toLocalDate(created.startsAt));
                await invalidate();
              }}
            />
          </CardContent>
        </Card>
      )}

      {(attention.data?.length ?? 0) > 0 && (
        <Card className="ring-danger/30 bg-danger/5">
          <CardContent>
            <h2 className="mb-3 text-lg">ყურადღება საჭიროა ({attention.data!.length})</h2>
            <p className="mb-3 text-sm text-ink-soft">
              ეს ვიზიტები აღარ ემთხვევა განრიგს. გადაიტანეთ ან გააუქმეთ — პაციენტი SMS-ს მიიღებს.
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {attention.data!.map((row) => (
                <li key={row.appointment.id} className="flex flex-wrap items-center gap-x-3">
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setDate(toLocalDate(row.appointment.startsAt))}
                  >
                    {formatDate(row.appointment.startsAt, "ka")} {formatTime(row.appointment.startsAt)}
                  </button>
                  <span>
                    {row.patient.fullName} · {row.treatment.nameKa} · {row.practitioner.nameKa}
                  </span>
                  <span className="text-danger">{row.reasons.map((r) => attentionLabel[r]).join(", ")}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setDate(addDays(date, -1))}>
          ←
        </Button>
        <Input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="w-44"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => setDate(addDays(date, 1))}>
          →
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDate(toLocalDate(new Date()))}>
          დღეს
        </Button>
      </div>

      {setStatus.error && <p className="text-sm text-danger">{errorMessage(setStatus.error)}</p>}

      <div className="flex flex-col gap-3">
        {day.isPending && <p className="text-ink-soft">იტვირთება…</p>}
        {day.data?.length === 0 && <p className="text-ink-soft">ამ დღეს ვიზიტები არ არის.</p>}
        {day.data?.map(({ appointment: a, patient, practitioner, treatment, createdBy }) => (
          <Card size="sm" key={a.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {formatTime(a.startsAt)}–{formatTime(a.endsAt)} · {treatment.nameKa}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {practitioner.nameKa} ·{" "}
                    <Link href={`/patients/${patient.id}`} className="underline">
                      {patient.fullName}
                    </Link>{" "}
                    · <a href={`tel:${patient.phone}`}>{patient.phone}</a>
                  </span>
                  {a.note && <span className="text-sm">„{a.note}“</span>}
                  <span className="text-xs text-ink-soft">
                    {createdBy?.name ? `დაჯავშნა: ${createdBy.name}` : "დაჯავშნა: პაციენტი (ონლაინ)"}
                    {a.cancelledBy && ` · გააუქმა: ${a.cancelledBy === "patient" ? "პაციენტმა" : "კლინიკამ"}`}
                    {a.cancellationReason && ` (${a.cancellationReason})`}
                  </span>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs", statusTone[a.status])}>
                  {statusLabel[a.status]}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {a.status === "booked" && a.startsAt <= now && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus.mutate({ id: a.id, status: "completed" })}
                    >
                      დასრულდა
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus.mutate({ id: a.id, status: "no_show" })}
                    >
                      არ გამოცხადდა
                    </Button>
                  </>
                )}
                {a.status === "booked" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setMoving(moving === a.id ? undefined : a.id)}
                    >
                      გადატანა
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const reason = window.prompt("გაუქმების მიზეზი (არასავალდებულო)");
                        if (reason === null) return;
                        setStatus.mutate({ id: a.id, status: "cancelled", reason: reason || undefined });
                      }}
                    >
                      გაუქმება
                    </Button>
                  </>
                )}
                {a.status !== "booked" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus.mutate({ id: a.id, status: "booked" })}
                  >
                    აღდგენა
                  </Button>
                )}
              </div>

              {moving === a.id && (
                <AppointmentForm
                  move={{ id: a.id, treatmentId: treatment.id, practitionerId: practitioner.id }}
                  initialDate={toLocalDate(a.startsAt)}
                  onDone={async (moved) => {
                    setMoving(undefined);
                    setDate(toLocalDate(moved.startsAt));
                    await invalidate();
                  }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
