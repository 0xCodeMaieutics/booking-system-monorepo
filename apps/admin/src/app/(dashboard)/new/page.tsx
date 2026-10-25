"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isLocalDate, toLocalDate } from "@tsami/booking/time";
import { Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AppointmentForm } from "@/components/appointment-form";
import { useTRPC } from "@/trpc/client";

export default function NewAppointmentPage() {
  return (
    <Suspense>
      <NewAppointment />
    </Suspense>
  );
}

function NewAppointment() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const dateParam = useSearchParams().get("date");
  const [today] = useState(() => toLocalDate(new Date()));
  const date = dateParam && isLocalDate(dateParam) ? dateParam : today;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/?date=${date}`}>← უკან</Link>
        </Button>
        <h1 className="text-3xl">ახალი ვიზიტი</h1>
      </div>
      <Card>
        <CardContent>
          <AppointmentForm
            initialDate={date}
            onDone={async (created) => {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: trpc.appointments.pathKey() }),
                queryClient.invalidateQueries({ queryKey: trpc.attention.pathKey() }),
              ]);
              router.push(`/?date=${toLocalDate(created.startsAt)}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
