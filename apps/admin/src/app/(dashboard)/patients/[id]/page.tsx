import { formatDate, formatTime } from "@tsami/booking/time";
import { Card, CardContent, cn } from "@tsami/ui";

import { statusLabel, statusTone } from "@/lib/labels";
import { findOrNotFound, serverCaller } from "@/server/caller";

import { PatientForm } from "./page.client";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await findOrNotFound((await serverCaller()).patients.get({ id }));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">{p.fullName}</h1>
      <Card>
        <CardContent>
          <PatientForm key={p.updatedAt.getTime()} patient={p} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="mb-4 text-xl">ვიზიტების ისტორია</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {p.history.map(({ appointment: a, practitioner, treatment }) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {formatDate(a.startsAt, "ka")} {formatTime(a.startsAt)} · {treatment.nameKa} ·{" "}
                  {practitioner.nameKa}
                </span>
                <span className={cn("rounded-full px-3 py-0.5 text-xs", statusTone[a.status])}>
                  {statusLabel[a.status]}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
