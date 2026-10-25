"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type LocalDate, addDays, formatTime, isLocalDate, toLocalDate } from "@tsami/booking/time";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Textarea,
  cn,
} from "@tsami/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { attentionLabel, statusLabel, statusTone } from "@/lib/labels";
import { useTRPC } from "@/trpc/client";

import { AppointmentForm } from "./appointment-form";
import { errorMessage } from "./errors";

export function AppointmentsDay() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [today] = useState(() => toLocalDate(new Date()));
  const date = dateParam && isLocalDate(dateParam) ? dateParam : today;
  const setDate = (next: LocalDate) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", next);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
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
  const attentionById = new Map(attention.data?.map((row) => [row.appointment.id, row.reasons]));

  const highlightId = searchParams.get("appointmentId");
  const scrolledTo = useRef<string>(null);
  useEffect(() => {
    if (!highlightId || !day.data || scrolledTo.current === highlightId) return;
    const el = document.getElementById(`appointment-${highlightId}`);
    if (!el) return;
    scrolledTo.current = highlightId;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, day.data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">ვიზიტები</h1>
        <Button asChild size="lg">
          <Link href={`/new?date=${date}`}>ახალი ვიზიტი</Link>
        </Button>
      </div>

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
        {date !== today && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setDate(today)}>
            დღეს
          </Button>
        )}
      </div>

      {setStatus.error && <p className="text-sm text-danger">{errorMessage(setStatus.error)}</p>}

      <div className="flex flex-col gap-3">
        {day.isPending && <p className="text-ink-soft">იტვირთება…</p>}
        {day.data?.length === 0 && <p className="text-ink-soft">ამ დღეს ვიზიტები არ არის.</p>}
        {day.data?.map(({ appointment: a, patient, practitioner, treatment, createdBy }) => {
          const reasons = attentionById.get(a.id);
          return (
            <Card
              size="sm"
              key={a.id}
              id={`appointment-${a.id}`}
              className={cn(
                a.status === "completed" && "ring-success",
                reasons && "ring-danger/30 bg-danger/5",
                a.id === highlightId && "ring-2 ring-brand",
              )}
            >
              <CardContent className="flex flex-col gap-3">
                {reasons && (
                  <p className="text-sm text-danger">
                    ყურადღება საჭიროა: {reasons.map((r) => attentionLabel[r]).join(", ")}. გადაიტანეთ ან
                    გააუქმეთ — პაციენტი SMS-ს მიიღებს.
                  </p>
                )}
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
                      {a.cancelledBy &&
                        ` · გააუქმა: ${a.cancelledBy === "patient" ? "პაციენტმა" : "კლინიკამ"}`}
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
                        className="bg-success hover:bg-success/80"
                        onClick={() => setStatus.mutate({ id: a.id, status: "completed" })}
                      >
                        დასრულდა
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-600/80"
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
                      <CancelAppointmentDialog id={a.id} onCancelled={invalidate} />
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
                    move={{
                      id: a.id,
                      treatmentId: treatment.id,
                      practitionerId: practitioner.id,
                    }}
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
          );
        })}
      </div>
    </div>
  );
}

function CancelAppointmentDialog({ id, onCancelled }: { id: string; onCancelled: () => Promise<unknown> }) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cancel = useMutation(
    trpc.appointments.setStatus.mutationOptions({
      onSuccess: async () => {
        await onCancelled();
        onOpenChange(false);
      },
    }),
  );
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setReason("");
      cancel.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="text-danger">
          გაუქმება
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            cancel.mutate({ id, status: "cancelled", reason: reason.trim() || undefined });
          }}
        >
          <DialogHeader>
            <DialogTitle>ვიზიტის გაუქმება</DialogTitle>
            <DialogDescription>პაციენტი SMS-ს მიიღებს.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="გაუქმების მიზეზი (არასავალდებულო)"
            aria-label="გაუქმების მიზეზი"
          />
          {cancel.error && <p className="text-sm text-danger">{errorMessage(cancel.error)}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                უკან
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={cancel.isPending}>
              გაუქმება
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
