"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Field, Input, Textarea } from "@tsami/ui";
import { type FormEvent, useState } from "react";

import { errorMessage } from "@/components/errors";
import { useTRPC } from "@/trpc/client";

type Treatment = {
  id: string;
  nameKa: string;
  nameEn: string;
  descriptionKa: string | null;
  descriptionEn: string | null;
  durationMinutes: number;
  priceFromGel: number | null;
  sortOrder: number;
  archivedAt: Date | null;
};

export default function TreatmentsPage() {
  const trpc = useTRPC();
  const treatments = useQuery(trpc.treatments.list.queryOptions());
  const [editing, setEditing] = useState<string | "new">();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">პროცედურები</h1>
        <Button type="button" size="lg" onClick={() => setEditing("new")}>
          დამატება
        </Button>
      </div>
      {editing === "new" && (
        <Card>
          <TreatmentForm sortOrder={treatments.data?.length ?? 0} onDone={() => setEditing(undefined)} />
        </Card>
      )}
      {treatments.data?.map((t) =>
        editing === t.id ? (
          <Card key={t.id}>
            <TreatmentForm treatment={t} sortOrder={t.sortOrder} onDone={() => setEditing(undefined)} />
          </Card>
        ) : (
          <Card
            key={t.id}
            className={`flex items-center justify-between gap-4 p-4 ${t.archivedAt ? "opacity-50" : ""}`}
          >
            <div>
              <p className="font-medium">
                {t.nameKa} {t.archivedAt && "· დაარქივებული"}
              </p>
              <p className="text-sm text-ink-soft">
                {t.nameEn} · {t.durationMinutes} წთ{t.priceFromGel !== null && ` · ${t.priceFromGel} ₾-დან`}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(t.id)}>
              რედაქტირება
            </Button>
          </Card>
        ),
      )}
    </div>
  );
}

function TreatmentForm({
  treatment,
  sortOrder,
  onDone,
}: {
  treatment?: Treatment;
  sortOrder: number;
  onDone: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const onSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.treatments.pathKey() });
    onDone();
  };
  const create = useMutation(trpc.treatments.create.mutationOptions({ onSuccess }));
  const update = useMutation(trpc.treatments.update.mutationOptions({ onSuccess }));
  const archive = useMutation(trpc.treatments.setArchived.mutationOptions({ onSuccess }));
  const [form, setForm] = useState({
    nameKa: treatment?.nameKa ?? "",
    nameEn: treatment?.nameEn ?? "",
    descriptionKa: treatment?.descriptionKa ?? "",
    descriptionEn: treatment?.descriptionEn ?? "",
    durationMinutes: treatment?.durationMinutes ?? 30,
    priceFromGel: treatment?.priceFromGel?.toString() ?? "",
    sortOrder,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const values = {
      ...form,
      descriptionKa: form.descriptionKa || null,
      descriptionEn: form.descriptionEn || null,
      priceFromGel: form.priceFromGel === "" ? null : Number(form.priceFromGel),
    };
    if (treatment) update.mutate({ id: treatment.id, ...values });
    else create.mutate(values);
  }

  const error = create.error ?? update.error;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="დასახელება (ქართულად)">
          <Input
            required
            value={form.nameKa}
            onChange={(e) => setForm({ ...form, nameKa: e.target.value })}
          />
        </Field>
        <Field label="დასახელება (ინგლისურად)">
          <Input
            required
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </Field>
        <Field label="ხანგრძლივობა (წთ)" hint="ცვლილება არსებულ ვიზიტებს არ ეხება">
          <Input
            type="number"
            required
            min={5}
            step={5}
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          />
        </Field>
        <Field label="ფასი ₾-დან (არასავალდებულო)" hint="მხოლოდ საინფორმაციოდ">
          <Input
            type="number"
            min={0}
            value={form.priceFromGel}
            onChange={(e) => setForm({ ...form, priceFromGel: e.target.value })}
          />
        </Field>
        <Field label="აღწერა (ქართულად)">
          <Textarea
            value={form.descriptionKa}
            onChange={(e) => setForm({ ...form, descriptionKa: e.target.value })}
          />
        </Field>
        <Field label="აღწერა (ინგლისურად)">
          <Textarea
            value={form.descriptionEn}
            onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
          />
        </Field>
        <Field label="რიგითობა">
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{errorMessage(error)}</p>}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" type="submit">
          შენახვა
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onDone}>
          გაუქმება
        </Button>
        {treatment && (
          <Button
            type="button"
            size="lg"
            variant="ghost"
            onClick={() => archive.mutate({ id: treatment.id, archived: !treatment.archivedAt })}
          >
            {treatment.archivedAt ? "არქივიდან აღდგენა" : "დაარქივება"}
          </Button>
        )}
      </div>
    </form>
  );
}
