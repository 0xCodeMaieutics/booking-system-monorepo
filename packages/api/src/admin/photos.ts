import type { PhotoStore } from "./trpc";

const extensions = { "image/webp": "webp", "image/jpeg": "jpg" } as const;

export type PhotoContentType = keyof typeof extensions;

const pendingKeyPattern = /^pending\/[0-9a-f-]{36}\.(webp|jpg)$/;

/** Uploads land under `pending/` and only move to `practitioners/` when set as the Practitioner's photo. */
export function pendingPhotoKey(contentType: PhotoContentType) {
  return `pending/${crypto.randomUUID()}.${extensions[contentType]}`;
}

export function isPendingPhotoKey(key: string) {
  return pendingKeyPattern.test(key);
}

export function savedPhotoKey(practitionerId: string, pendingKey: string) {
  return `practitioners/${practitionerId}/${pendingKey.slice("pending/".length)}`;
}

/** Best effort: a leftover object costs little, so a failed delete must not fail the save. */
export async function deletePhotos(photos: PhotoStore, keys: string[]) {
  await Promise.all(
    keys.map((key) =>
      photos.delete(key).catch((error) => console.error(`Deleting photo ${key} failed`, error)),
    ),
  );
}
