import { type PhotoContentType, pendingPhotoKey } from "@tsami/api/admin";

import { createAdminContext } from "@/server/context";
import { photoStore } from "@/server/photos";

/** The browser uploads an already cropped 512×512 image, so anything large is not ours. */
const MAX_BYTES = 1024 * 1024;

const signatures: Record<PhotoContentType, (b: Uint8Array) => boolean> = {
  "image/webp": (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
};

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end));
}

/**
 * Stores a cropped Practitioner Photo under `pending/` and returns its key.
 * It becomes the Practitioner's photo when the Practitioner form is saved (ADR 0006).
 */
export async function POST(req: Request) {
  const { admin } = await createAdminContext(req.headers);
  if (!admin) return new Response("Unauthorized", { status: 401 });

  const contentType = req.headers.get("content-type") as PhotoContentType | null;
  if (!contentType || !(contentType in signatures)) {
    return new Response("Unsupported image type", { status: 415 });
  }
  const body = new Uint8Array(await req.arrayBuffer());
  if (body.byteLength > MAX_BYTES) return new Response("Image too large", { status: 413 });
  if (!signatures[contentType](body)) return new Response("Not a valid image", { status: 400 });

  const key = pendingPhotoKey(contentType);
  await photoStore.put(key, body, contentType);
  return Response.json({ key });
}
