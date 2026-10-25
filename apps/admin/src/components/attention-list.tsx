"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDate, formatTime } from "@visita/booking/time";
import { Card } from "@visita/ui";

import { attentionLabel } from "@/lib/labels";
import { useTRPC } from "@/trpc/client";

/** Future Appointments that no longer fit this Practitioner's setup. */
export function AttentionList({ practitionerId }: { practitionerId: string }) {
  const trpc = useTRPC();
  const attention = useQuery(trpc.attention.list.queryOptions({ practitionerId }));
  if (!attention.data?.length) return null;

  return (
    <Card className="border-danger/30 bg-danger/5">
      <h2 className="mb-2 text-lg">ეს ვიზიტები აღარ ემთხვევა განრიგს</h2>
      <p className="mb-3 text-sm text-ink-soft">
        ცვლილებები არსებულ ვიზიტებს არ ეხება. გადაიტანეთ ან გააუქმეთ ისინი „ვიზიტების“ გვერდზე.
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {attention.data.map((row) => (
          <li key={row.appointment.id}>
            {formatDate(row.appointment.startsAt, "ka")} {formatTime(row.appointment.startsAt)} ·{" "}
            {row.patient.fullName} · {row.treatment.nameKa} —{" "}
            <span className="text-danger">{row.reasons.map((r) => attentionLabel[r]).join(", ")}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
