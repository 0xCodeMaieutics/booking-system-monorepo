"use client";

import { Button, Card, CardContent, Field, FieldDescription, FieldLabel, Input } from "@tsami/ui";
import { type FormEvent, useId, useState } from "react";

import { errorMessage } from "@/components/errors";
import { useTRPC } from "@/trpc/client";
import { useRefreshingMutation } from "@/trpc/use-refreshing-mutation";

export function SettingsForm({
  initial,
}: {
  initial: {
    minNoticeMinutes: number;
    bookingWindowDays: number;
    cancellationCutoffHours: number;
    phone: string;
    nameKa: string;
    bookingSiteUrl: string;
  };
}) {
  const fieldId = useId();
  const trpc = useTRPC();
  const [form, setForm] = useState({
    minNoticeHours: initial.minNoticeMinutes / 60,
    bookingWindowDays: initial.bookingWindowDays,
    cancellationCutoffHours: initial.cancellationCutoffHours,
    phone: initial.phone,
  });
  const save = useRefreshingMutation(trpc.settings.update.mutationOptions());

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate({
      minNoticeMinutes: Math.round(form.minNoticeHours * 60),
      bookingWindowDays: form.bookingWindowDays,
      cancellationCutoffHours: form.cancellationCutoffHours,
      phone: form.phone,
    });
  }

  const num = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: Number(e.target.value) });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl">პარამეტრები</h1>
      <Card>
        <CardContent className="flex flex-col gap-1">
          <span className="text-lg font-medium">{initial.nameKa}</span>
          <a
            href={initial.bookingSiteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-ink-soft underline underline-offset-2"
          >
            {initial.bookingSiteUrl}
          </a>
          <span className="text-xs text-ink-soft">
            დაჯავშნის გვერდის ბმული. სახელის ან ბმულის შესაცვლელად დაუკავშირდით წამს.
          </span>
        </CardContent>
      </Card>
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
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
