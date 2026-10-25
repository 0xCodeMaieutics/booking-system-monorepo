"use client";

import { Button, Card, CardContent, Field, FieldLabel, Input } from "@tsami/ui";
import { type FormEvent, useId, useState } from "react";

import { errorMessage } from "@/components/errors";
import { useTRPC } from "@/trpc/client";
import type { AdminOutputs } from "@/trpc/types";
import { useRefreshingMutation } from "@/trpc/use-refreshing-mutation";

export function AdminsManager({ meId, admins }: { meId: string; admins: AdminOutputs["admins"]["list"] }) {
  const fieldId = useId();
  const trpc = useTRPC();
  const invite = useRefreshingMutation(trpc.admins.invite.mutationOptions());
  const setActive = useRefreshingMutation(trpc.admins.setActive.mutationOptions());
  const [form, setForm] = useState({ name: "", email: "" });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    invite.mutate(form, { onSuccess: () => setForm({ name: "", email: "" }) });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">ადმინისტრატორები</h1>
      <Card>
        <CardContent className="flex flex-col gap-3">
          {admins.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className={a.deactivatedAt ? "text-ink-soft line-through" : ""}>
                {a.name} · {a.email}
              </span>
              {a.id !== meId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={setActive.isPending}
                  onClick={() => setActive.mutate({ id: a.id, active: !!a.deactivatedAt })}
                >
                  {a.deactivatedAt ? "აქტივაცია" : "დეაქტივაცია"}
                </Button>
              )}
            </div>
          ))}
          {setActive.error && <p className="text-sm text-danger">{errorMessage(setActive.error)}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <h2 className="text-xl">ახალი ადმინისტრატორის მოწვევა</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${fieldId}-1`}>სახელი</FieldLabel>
                <Input
                  id={`${fieldId}-1`}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${fieldId}-2`}>ელფოსტა</FieldLabel>
                <Input
                  id={`${fieldId}-2`}
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
            </div>
            <p className="text-sm text-ink-soft">
              მოწვეული მიიღებს ელფოსტას პაროლის დასაყენებელი ბმულით (მოქმედებს 72 საათი).
            </p>
            {invite.error && <p className="text-sm text-danger">{errorMessage(invite.error)}</p>}
            {invite.isSuccess && <p className="text-sm text-success">მოწვევა გაიგზავნა.</p>}
            <Button size="lg" type="submit" className="self-start" disabled={invite.isPending}>
              მოწვევა
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
