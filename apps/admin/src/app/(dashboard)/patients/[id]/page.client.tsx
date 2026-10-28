"use client";

import { Button, Field, FieldDescription, FieldLabel, Input } from "@tsami/ui";
import { type FormEvent, useId, useState } from "react";

import { errorMessage } from "@/components/errors";
import { useTRPC } from "@/trpc/client";
import { useRefreshingMutation } from "@/trpc/use-refreshing-mutation";

export function PatientForm({
  patient,
}: {
  patient: {
    id: string;
    fullName: string;
    channel: "sms" | "email";
    phone: string | null;
    email: string | null;
  };
}) {
  const fieldId = useId();
  const trpc = useTRPC();
  const [fullName, setFullName] = useState(patient.fullName);
  const [email, setEmail] = useState(patient.email ?? "");
  const update = useRefreshingMutation(trpc.patients.update.mutationOptions());
  const byEmail = patient.channel === "email";

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
          <FieldLabel htmlFor={`${fieldId}-2`}>{byEmail ? "ტელეფონი" : "მობილური"}</FieldLabel>
          <Input id={`${fieldId}-2`} value={patient.phone ?? ""} disabled />
          {!byEmail && <FieldDescription>ნომერი პაციენტის იდენტიფიკატორია და არ იცვლება</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-3`}>ელფოსტა</FieldLabel>
          <Input
            id={`${fieldId}-3`}
            type="email"
            value={email}
            disabled={byEmail}
            onChange={(e) => setEmail(e.target.value)}
          />
          {byEmail && (
            <FieldDescription>
              პაციენტს ქართული ნომერი არ აქვს: ელფოსტა მისი იდენტიფიკატორია და არ იცვლება
            </FieldDescription>
          )}
        </Field>
      </div>
      {update.error && <p className="text-sm text-danger">{errorMessage(update.error)}</p>}
      <Button size="lg" type="submit" className="self-start" disabled={update.isPending}>
        შენახვა
      </Button>
    </form>
  );
}
