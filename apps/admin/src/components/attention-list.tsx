import { formatDate, formatTime, toLocalDate } from "@tsami/booking/time";
import { Card, CardContent } from "@tsami/ui";
import Link from "next/link";

import { attentionLabel } from "@/lib/labels";
import type { AdminOutputs } from "@/trpc/types";

/** Future Appointments that no longer fit this Practitioner's setup. */
export function AttentionList({ rows }: { rows: AdminOutputs["attention"]["list"] }) {
  if (!rows.length) return null;

  return (
    <Card className="ring-danger/30 bg-danger/5">
      <CardContent>
        <h2 className="mb-2 text-lg">ეს ვიზიტები აღარ ემთხვევა განრიგს</h2>
        <p className="mb-3 text-sm text-ink-soft">
          ცვლილებები არსებულ ვიზიტებს არ ეხება. გადაიტანეთ ან გააუქმეთ ისინი „ვიზიტების“ გვერდზე.
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          {rows.map((row) => (
            <li key={row.appointment.id}>
              {formatDate(row.appointment.startsAt, "ka")} {formatTime(row.appointment.startsAt)} ·{" "}
              {row.patient.fullName} ·{" "}
              <Link
                href={`/?date=${toLocalDate(row.appointment.startsAt)}&appointmentId=${row.appointment.id}`}
                className="underline"
              >
                {row.treatment.nameKa}
              </Link>{" "}
              — <span className="text-danger">{row.reasons.map((r) => attentionLabel[r]).join(", ")}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
