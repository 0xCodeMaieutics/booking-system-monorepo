"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, Field, FieldDescription, FieldLabel, Input } from "@tsami/ui";
import { type FormEvent, useId, useState } from "react";

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
  const fieldId = useId();
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
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor={`${fieldId}-1`}>მინიმალური წინასწარი დრო (საათი)</FieldLabel>
              <Input
                id={`${fieldId}-1`}
                type="number"
                min={0}
                step={0.25}
                value={form.minNoticeHours}
                onChange={num("minNoticeHours")}
              />
              <FieldDescription>პაციენტს არ შეუძლია დაჯავშნა ამაზე ნაკლები დროით ადრე</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-2`}>დაჯავშნის ფანჯარა (დღე)</FieldLabel>
              <Input
                id={`${fieldId}-2`}
                type="number"
                min={1}
                max={365}
                value={form.bookingWindowDays}
                onChange={num("bookingWindowDays")}
              />
              <FieldDescription>რამდენი დღით წინ შეუძლია პაციენტს დაჯავშნა</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-3`}>გაუქმების ვადა (საათი)</FieldLabel>
              <Input
                id={`${fieldId}-3`}
                type="number"
                min={0}
                value={form.cancellationCutoffHours}
                onChange={num("cancellationCutoffHours")}
              />
              <FieldDescription>
                ვიზიტამდე ამ დროზე ნაკლებით ადრე პაციენტი ონლაინ ვერ გააუქმებს
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-4`}>კლინიკის ტელეფონი</FieldLabel>
              <Input
                id={`${fieldId}-4`}
                value={form.clinicPhone}
                onChange={(e) => setForm({ ...form, clinicPhone: e.target.value })}
              />
              <FieldDescription>ჩანს SMS-ებში და დაჯავშნის გვერდზე</FieldDescription>
            </Field>
            {save.error && <p className="text-sm text-danger">{errorMessage(save.error)}</p>}
            {save.isSuccess && <p className="text-sm text-success">შენახულია.</p>}
            <Button size="lg" type="submit" className="self-start" disabled={save.isPending}>
              შენახვა
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
