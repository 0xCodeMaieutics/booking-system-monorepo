"use client";

import { Avatar, Button } from "@tsami/ui";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

const OUTPUT_SIZE = 512;

export type PhotoValue = { key: string | null; previewUrl: string | null };

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

/**
 * Picks, crops and uploads a Practitioner Photo. The upload is only a candidate:
 * it becomes the Practitioner's photo when the surrounding form is saved.
 */
export function PractitionerPhotoField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: PhotoValue;
  onChange: (value: PhotoValue) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
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
      onChange({ key, previewUrl: URL.createObjectURL(blob) });
      setSource(null);
    } catch {
      setError("ფოტოს ატვირთვა ვერ მოხერხდა. სცადეთ ხელახლა.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">ფოტო</span>
      {source ? (
        <div className="flex flex-col gap-3">
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
          <div className="flex gap-3">
            <Button type="button" onClick={apply} disabled={uploading || !area}>
              {uploading ? "იტვირთება…" : "გამოყენება"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSource(null)} disabled={uploading}>
              გაუქმება
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Avatar src={value.previewUrl} name={name} className="size-24 text-2xl" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
              {value.key ? "შეცვლა" : "ფოტოს ატვირთვა"}
            </Button>
            {value.key && (
              <Button type="button" variant="ghost" onClick={() => onChange({ key: null, previewUrl: null })}>
                წაშლა
              </Button>
            )}
          </div>
        </div>
      )}
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
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
