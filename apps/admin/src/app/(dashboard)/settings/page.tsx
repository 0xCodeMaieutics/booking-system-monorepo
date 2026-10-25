"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Field, Input } from "@tsami/ui";
import { type FormEvent, useState } from "react";

import { errorMessage } from "@/components/errors";
import { useTRPC } from "@/trpc/client";

export default function SettingsPage() {
  const trpc = useTRPC();
  const settings = useQuery(trpc.settings.get.queryOptions());
  if (!settings.data) return <p className="text-ink-soft">იტვირთება…</p>;
  return <SettingsForm key={settings.data.updatedAt.getTime()} initial={settings.data} />;
}

function SettingsForm({
  initial,
}: {
  initial: {
    minNoticeMinutes: number;
    bookingWindowDays: number;
    cancellationCutoffHours: number;
    clinicPhone: string;
  };
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    minNoticeHours: initial.minNoticeMinutes / 60,
    bookingWindowDays: initial.bookingWindowDays,
    cancellationCutoffHours: initial.cancellationCutoffHours,
    clinicPhone: initial.clinicPhone,
  });
  const save = useMutation(
    trpc.settings.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.settings.pathKey() }),
    }),
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate({
      minNoticeMinutes: Math.round(form.minNoticeHours * 60),
      bookingWindowDays: form.bookingWindowDays,
      cancellationCutoffHours: form.cancellationCutoffHours,
      clinicPhone: form.clinicPhone,
    });
  }

  const num = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: Number(e.target.value) });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl">პარამეტრები</h1>
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="მინიმალური წინასწარი დრო (საათი)"
            hint="პაციენტს არ შეუძლია დაჯავშნა ამაზე ნაკლები დროით ადრე"
          >
            <Input
              type="number"
              min={0}
              step={0.25}
              value={form.minNoticeHours}
              onChange={num("minNoticeHours")}
            />
          </Field>
          <Field label="დაჯავშნის ფანჯარა (დღე)" hint="რამდენი დღით წინ შეუძლია პაციენტს დაჯავშნა">
            <Input
              type="number"
              min={1}
              max={365}
              value={form.bookingWindowDays}
              onChange={num("bookingWindowDays")}
            />
          </Field>
          <Field
            label="გაუქმების ვადა (საათი)"
            hint="ვიზიტამდე ამ დროზე ნაკლებით ადრე პაციენტი ონლაინ ვერ გააუქმებს"
          >
            <Input
              type="number"
              min={0}
              value={form.cancellationCutoffHours}
              onChange={num("cancellationCutoffHours")}
            />
          </Field>
          <Field label="კლინიკის ტელეფონი" hint="ჩანს SMS-ებში და დაჯავშნის გვერდზე">
            <Input
              value={form.clinicPhone}
              onChange={(e) => setForm({ ...form, clinicPhone: e.target.value })}
            />
          </Field>
          {save.error && <p className="text-sm text-danger">{errorMessage(save.error)}</p>}
          {save.isSuccess && <p className="text-sm text-success">შენახულია.</p>}
          <Button size="lg" type="submit" className="self-start" disabled={save.isPending}>
            შენახვა
          </Button>
        </form>
      </Card>
    </div>
  );
}
