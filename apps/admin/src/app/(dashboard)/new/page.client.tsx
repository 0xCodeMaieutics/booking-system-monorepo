"use client";

import { toLocalDate } from "@tsami/booking/time";
import { useRouter } from "next/navigation";

import { AppointmentForm } from "@/components/appointment-form";
import type { AdminOutputs } from "@/trpc/types";

export function NewAppointmentForm({
  date,
  treatments,
  practitioners,
}: {
  date: string;
  treatments: AdminOutputs["treatments"]["list"];
  practitioners: AdminOutputs["practitioners"]["list"];
}) {
  const router = useRouter();
  return (
    <AppointmentForm
      initialDate={date}
      treatments={treatments}
      practitioners={practitioners}
      onDone={(created) => router.push(`/?date=${toLocalDate(created.startsAt)}`)}
    />
  );
}
