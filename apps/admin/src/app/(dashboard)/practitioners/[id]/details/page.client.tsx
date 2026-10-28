"use client";

import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
} from "@tsami/ui";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { errorMessage } from "@/components/errors";
import { useTRPC } from "@/trpc/client";
import type { AdminOutputs } from "@/trpc/types";
import { useRefreshingMutation } from "@/trpc/use-refreshing-mutation";

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

export function PractitionerForm({
  practitioner: p,
  treatments,
}: {
  practitioner: Practitioner;
  treatments: AdminOutputs["treatments"]["list"];
}) {
  const fieldId = useId();
  const trpc = useTRPC();
  const [form, setForm] = useState({
    nameKa: p.nameKa,
    nameEn: p.nameEn,
    titleKa: p.titleKa ?? "",
    titleEn: p.titleEn ?? "",
    sortOrder: p.sortOrder,
    treatmentIds: p.treatmentIds,
  });
  const [photoUrl, setPhotoUrl] = useState(p.photoUrl);
  const update = useRefreshingMutation(trpc.practitioners.update.mutationOptions());
  const setPhotoKey = useRefreshingMutation(trpc.practitioners.setPhoto.mutationOptions());
  const archive = useRefreshingMutation(trpc.practitioners.setArchived.mutationOptions());

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    update.mutate({
      id: p.id,
      ...form,
      titleKa: form.titleKa || null,
      titleEn: form.titleEn || null,
    });
  }

  async function savePhoto(photo: PhotoValue) {
    await setPhotoKey.mutateAsync({ id: p.id, photoKey: photo.key });
    setPhotoUrl(photo.previewUrl);
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
      <PractitionerPhotoField name={form.nameKa} photoUrl={photoUrl} onSave={savePhoto} />
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
        {treatments
          .filter((t) => !t.archivedAt || form.treatmentIds.includes(t.id))
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

const OUTPUT_SIZE = 512;

type PhotoValue = { key: string | null; previewUrl: string | null };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
}

/** Draws the cropped square at 512×512. Safari cannot encode WebP, so it falls back to JPEG. */
async function cropToBlob(src: string, area: Area) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  canvas
    .getContext("2d")!
    .drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const webp = await toBlob(canvas, "image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg");
  if (!jpeg) throw new Error("Could not encode the photo");
  return jpeg;
}

async function upload(blob: Blob) {
  const res = await fetch("/api/practitioner-photos", {
    method: "POST",
    headers: { "content-type": blob.type },
    body: blob,
  });
  if (!res.ok) throw new Error(await res.text());
  const { key } = (await res.json()) as { key: string };
  return key;
}

/** Picks, crops and uploads a Practitioner Photo, saving it as soon as the crop is applied. */
function PractitionerPhotoField({
  name,
  photoUrl,
  onSave,
}: {
  name: string;
  photoUrl: string | null;
  onSave: (value: PhotoValue) => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => void (source && URL.revokeObjectURL(source)), [source]);

  function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSource(URL.createObjectURL(file));
  }

  async function apply() {
    if (!source || !area) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await cropToBlob(source, area);
      const key = await upload(blob);
      await onSave({ key, previewUrl: URL.createObjectURL(blob) });
      setSource(null);
    } catch {
      setError("ფოტოს ატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    setRemoving(true);
    setError(null);
    try {
      await onSave({ key: null, previewUrl: null });
    } catch {
      setError("ფოტოს წაშლა ვერ მოხერხდა. სცადეთ ხელახლა.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">ფოტო</span>
      <div className="flex items-center gap-4">
        <Avatar src={photoUrl} name={name} className="size-24 text-2xl" />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={removing}
          >
            {photoUrl ? "შეცვლა" : "ფოტოს ატვირთვა"}
          </Button>
          {photoUrl && (
            <Button type="button" variant="ghost" onClick={remove} disabled={removing}>
              {removing ? "იშლება…" : "წაშლა"}
            </Button>
          )}
        </div>
      </div>
      <Dialog
        open={source !== null}
        onOpenChange={(open) => {
          if (!open && !uploading) setSource(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ფოტოს მოჭრა</DialogTitle>
          </DialogHeader>
          {source && (
            <div className="relative h-72 overflow-hidden rounded-2xl bg-ink">
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
                onMediaLoaded={() => setError(null)}
              />
            </div>
          )}
          <label className="flex items-center gap-3 text-sm">
            მასშტაბი
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSource(null)} disabled={uploading}>
              გაუქმება
            </Button>
            <Button type="button" onClick={apply} disabled={uploading || !area}>
              {uploading ? "იტვირთება…" : "ატვირთვა"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && !source && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
