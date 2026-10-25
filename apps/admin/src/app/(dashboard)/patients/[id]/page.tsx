"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime } from "@tsami/booking/time";
import { Button, Card, CardContent, Field, FieldDescription, FieldLabel, Input, cn } from "@tsami/ui";
import { type FormEvent, use, useId, useState } from "react";

import { errorMessage } from "@/components/errors";
import { statusLabel, statusTone } from "@/lib/labels";
import { useTRPC } from "@/trpc/client";

export default function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();
  const patient = useQuery(trpc.patients.get.queryOptions({ id }));
  if (!patient.data) return <p className="text-ink-soft">იტვირთება…</p>;
  const p = patient.data;

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

function PatientForm({
  patient,
}: {
  patient: { id: string; fullName: string; phone: string; email: string | null };
}) {
  const fieldId = useId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(patient.fullName);
  const [email, setEmail] = useState(patient.email ?? "");
  const update = useMutation(
    trpc.patients.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.patients.pathKey() }),
    }),
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    update.mutate({ id: patient.id, fullName, email: email || null });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${fieldId}-1`}>სახელი და გვარი</FieldLabel>
          <Input
            id={`${fieldId}-1`}
            required
            minLength={2}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-2`}>მობილური</FieldLabel>
          <Input id={`${fieldId}-2`} value={patient.phone} disabled />
          <FieldDescription>ნომერი პაციენტის იდენტიფიკატორია და არ იცვლება</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-3`}>ელფოსტა</FieldLabel>
          <Input id={`${fieldId}-3`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      {update.error && <p className="text-sm text-danger">{errorMessage(update.error)}</p>}
      <Button size="lg" type="submit" className="self-start" disabled={update.isPending}>
        შენახვა
      </Button>
    </form>
  );
}
