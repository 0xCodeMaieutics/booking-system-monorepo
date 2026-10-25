"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Field, Input } from "@tsami/ui";
import { type FormEvent, useState } from "react";

import { useTRPC } from "@/trpc/client";

import { errorMessage } from "./errors";

type Practitioner = {
  id: string;
  nameKa: string;
  nameEn: string;
  titleKa: string | null;
  titleEn: string | null;
  sortOrder: number;
  archivedAt: Date | null;
  treatmentIds: string[];
};

export function PractitionerForm({ practitioner: p }: { practitioner: Practitioner }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const treatments = useQuery(trpc.treatments.list.queryOptions());
  const [form, setForm] = useState({
    nameKa: p.nameKa,
    nameEn: p.nameEn,
    titleKa: p.titleKa ?? "",
    titleEn: p.titleEn ?? "",
    sortOrder: p.sortOrder,
    treatmentIds: p.treatmentIds,
  });
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.practitioners.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.attention.pathKey() }),
    ]);
  const update = useMutation(trpc.practitioners.update.mutationOptions({ onSuccess: invalidate }));
  const archive = useMutation(trpc.practitioners.setArchived.mutationOptions({ onSuccess: invalidate }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    update.mutate({ id: p.id, ...form, titleKa: form.titleKa || null, titleEn: form.titleEn || null });
  }

  const toggle = (id: string) =>
    setForm((f) => ({
      ...f,
      treatmentIds: f.treatmentIds.includes(id)
        ? f.treatmentIds.filter((x) => x !== id)
        : [...f.treatmentIds, id],
    }));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="სახელი (ქართულად)">
          <Input
            required
            value={form.nameKa}
            onChange={(e) => setForm({ ...form, nameKa: e.target.value })}
          />
        </Field>
        <Field label="სახელი (ინგლისურად)">
          <Input
            required
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </Field>
        <Field label="წოდება (ქართულად)" hint="მაგ. ექიმი">
          <Input value={form.titleKa} onChange={(e) => setForm({ ...form, titleKa: e.target.value })} />
        </Field>
        <Field label="წოდება (ინგლისურად)" hint="e.g. Dr.">
          <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
        </Field>
        <Field
          label="რიგითობა"
          hint="„ნებისმიერი სპეციალისტის“ შემთხვევაში თანაბარ პირობებში უპირატესობა აქვს უფრო მცირე ნომერს"
        >
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">პროცედურები</legend>
        {treatments.data
          ?.filter((t) => !t.archivedAt || form.treatmentIds.includes(t.id))
          .map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.treatmentIds.includes(t.id)}
                onChange={() => toggle(t.id)}
              />
              {t.nameKa}
            </label>
          ))}
      </fieldset>

      {update.error && <p className="text-sm text-danger">{errorMessage(update.error)}</p>}
      {update.isSuccess && <p className="text-sm text-success">შენახულია.</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={update.isPending}>
          შენახვა
        </Button>
        <Button
          variant="ghost"
          onClick={() => archive.mutate({ id: p.id, archived: !p.archivedAt })}
          disabled={archive.isPending}
        >
          {p.archivedAt ? "არქივიდან აღდგენა" : "დაარქივება"}
        </Button>
      </div>
    </form>
  );
}
