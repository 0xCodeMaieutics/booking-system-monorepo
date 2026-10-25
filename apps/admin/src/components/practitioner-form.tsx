"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Field, FieldDescription, FieldLabel, Input } from "@tsami/ui";
import { type FormEvent, useId, useState } from "react";

import { useTRPC } from "@/trpc/client";

import { errorMessage } from "./errors";
import { type PhotoValue, PractitionerPhotoField } from "./practitioner-photo-field";

type Practitioner = {
  id: string;
  nameKa: string;
  nameEn: string;
  titleKa: string | null;
  titleEn: string | null;
  photoKey: string | null;
  photoUrl: string | null;
  sortOrder: number;
  archivedAt: Date | null;
  treatmentIds: string[];
};

export function PractitionerForm({ practitioner: p }: { practitioner: Practitioner }) {
  const fieldId = useId();
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
  const [photo, setPhoto] = useState<PhotoValue>({ key: p.photoKey, previewUrl: p.photoUrl });
  const [savedPhotoKey, setSavedPhotoKey] = useState(p.photoKey);
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.practitioners.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.attention.pathKey() }),
    ]);
  const update = useMutation(
    trpc.practitioners.update.mutationOptions({
      onSuccess: ({ photoKey }) => {
        setPhoto((current) => ({ ...current, key: photoKey }));
        setSavedPhotoKey(photoKey);
        return invalidate();
      },
    }),
  );
  const archive = useMutation(trpc.practitioners.setArchived.mutationOptions({ onSuccess: invalidate }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    update.mutate({
      id: p.id,
      ...form,
      titleKa: form.titleKa || null,
      titleEn: form.titleEn || null,
      photoKey: photo.key,
    });
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
      <PractitionerPhotoField name={form.nameKa} value={photo} onChange={setPhoto} />
      {photo.key !== savedPhotoKey && (
        <p className="text-sm text-ink-soft">ფოტოს ცვლილება შეინახება „შენახვის“ დაჭერის შემდეგ.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${fieldId}-1`}>სახელი (ქართულად)</FieldLabel>
          <Input
            id={`${fieldId}-1`}
            required
            value={form.nameKa}
            onChange={(e) => setForm({ ...form, nameKa: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-2`}>სახელი (ინგლისურად)</FieldLabel>
          <Input
            id={`${fieldId}-2`}
            required
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-3`}>წოდება (ქართულად)</FieldLabel>
          <Input
            id={`${fieldId}-3`}
            value={form.titleKa}
            onChange={(e) => setForm({ ...form, titleKa: e.target.value })}
          />
          <FieldDescription>მაგ. ექიმი</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-4`}>წოდება (ინგლისურად)</FieldLabel>
          <Input
            id={`${fieldId}-4`}
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
          />
          <FieldDescription>e.g. Dr.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-5`}>რიგითობა</FieldLabel>
          <Input
            id={`${fieldId}-5`}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
          <FieldDescription>
            „ნებისმიერი სპეციალისტის“ შემთხვევაში თანაბარ პირობებში უპირატესობა აქვს უფრო მცირე ნომერს
          </FieldDescription>
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
        <Button size="lg" type="submit" disabled={update.isPending}>
          შენახვა
        </Button>
        <Button
          type="button"
          size="lg"
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
