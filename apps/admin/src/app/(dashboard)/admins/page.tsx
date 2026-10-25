"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Field, Input } from "@tsami/ui";
import { type FormEvent, useState } from "react";

import { errorMessage } from "@/components/errors";
import { useTRPC } from "@/trpc/client";

export default function AdminsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const me = useQuery(trpc.me.queryOptions());
  const admins = useQuery(trpc.admins.list.queryOptions());
  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.admins.pathKey() });
  const invite = useMutation(trpc.admins.invite.mutationOptions({ onSuccess: invalidate }));
  const setActive = useMutation(trpc.admins.setActive.mutationOptions({ onSuccess: invalidate }));
  const [form, setForm] = useState({ name: "", email: "" });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    invite.mutate(form, { onSuccess: () => setForm({ name: "", email: "" }) });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">ადმინისტრატორები</h1>
      <Card className="flex flex-col gap-3">
        {admins.data?.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className={a.deactivatedAt ? "text-ink-soft line-through" : ""}>
              {a.name} · {a.email}
            </span>
            {a.id !== me.data?.id && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActive.mutate({ id: a.id, active: !!a.deactivatedAt })}
              >
                {a.deactivatedAt ? "აქტივაცია" : "დეაქტივაცია"}
              </Button>
            )}
          </div>
        ))}
        {setActive.error && <p className="text-sm text-danger">{errorMessage(setActive.error)}</p>}
      </Card>
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <h2 className="text-xl">ახალი ადმინისტრატორის მოწვევა</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="სახელი">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="ელფოსტა">
              <Input
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
      </Card>
    </div>
  );
}
