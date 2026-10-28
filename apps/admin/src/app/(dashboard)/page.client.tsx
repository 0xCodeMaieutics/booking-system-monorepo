"use client";

import { type LocalDate, addDays, formatTime, toLocalDate } from "@tsami/booking/time";
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
import { useEffect, useRef, useState, useTransition } from "react";

import { AppointmentForm } from "@/components/appointment-form";
import { errorMessage } from "@/components/errors";
import { attentionLabel, statusLabel, statusTone } from "@/lib/labels";
import { useTRPC } from "@/trpc/client";
import type { AdminOutputs } from "@/trpc/types";
import { useRefreshingMutation } from "@/trpc/use-refreshing-mutation";

export function AppointmentsDay({
  date,
  today,
  highlightId,
  day,
  attention,
  treatments,
  practitioners,
}: {
  date: LocalDate;
  today: LocalDate;
  highlightId: string | null;
  day: AdminOutputs["appointments"]["day"];
  attention: AdminOutputs["attention"]["list"];
  treatments: AdminOutputs["treatments"]["list"];
  practitioners: AdminOutputs["practitioners"]["list"];
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isChangingDate, startDateChange] = useTransition();
  const setDate = (next: LocalDate) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", next);
    startDateChange(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  };
  const [moving, setMoving] = useState<string>();

  const setStatus = useRefreshingMutation(trpc.appointments.setStatus.mutationOptions());
  const [now] = useState(() => new Date());
  const attentionById = new Map(attention.map((row) => [row.appointment.id, row.reasons]));

  const scrolledTo = useRef<string>(null);
  useEffect(() => {
    if (!highlightId || scrolledTo.current === highlightId) return;
    const el = document.getElementById(`appointment-${highlightId}`);
    if (!el) return;
    scrolledTo.current = highlightId;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId]);

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

      <div className={cn("flex flex-col gap-3 transition-opacity", isChangingDate && "opacity-60")}>
        {day.length === 0 && <p className="text-ink-soft">ამ დღეს ვიზიტები არ არის.</p>}
        {day.map(({ appointment: a, patient, practitioner, treatment, createdBy }) => {
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
                    გააუქმეთ — პაციენტი შეტყობინებას მიიღებს.
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
                      {patient.phone && (
                        <>
                          · <a href={`tel:${patient.phone}`}>{patient.phone}</a>
                        </>
                      )}
                      {patient.channel === "email" && (
                        <>
                          {" "}
                          · <a href={`mailto:${patient.email}`}>{patient.email}</a>
                        </>
                      )}
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
                      <CancelAppointmentDialog id={a.id} />
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
                    treatments={treatments}
                    practitioners={practitioners}
                    onDone={(moved) => {
                      const movedTo = toLocalDate(moved.startsAt);
                      startDateChange(() => {
                        setMoving(undefined);
                        if (movedTo === date) router.refresh();
                        else setDate(movedTo);
                      });
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

function CancelAppointmentDialog({ id }: { id: string }) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cancel = useRefreshingMutation(
    trpc.appointments.setStatus.mutationOptions({ onSuccess: () => onOpenChange(false) }),
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
            <DialogDescription>პაციენტი შეტყობინებას მიიღებს.</DialogDescription>
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
