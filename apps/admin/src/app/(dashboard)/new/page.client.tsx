"use client";

import { toLocalDate } from "@tsami/booking/time";
import { useRouter } from "next/navigation";

import { AppointmentForm } from "@/components/appointment-form";
import type { AdminOutputs } from "@/trpc/types";

export function NewAppointmentForm({
  date,
  treatments,
  practitioners,
  smsAvailable,
}: {
  date: string;
  treatments: AdminOutputs["treatments"]["list"];
  practitioners: AdminOutputs["practitioners"]["list"];
  smsAvailable: boolean;
}) {
  const router = useRouter();
  return (
    <AppointmentForm
      initialDate={date}
      treatments={treatments}
      practitioners={practitioners}
      smsAvailable={smsAvailable}
      onDone={(created) => router.push(`/?date=${toLocalDate(created.startsAt)}`)}
    />
  );
}
