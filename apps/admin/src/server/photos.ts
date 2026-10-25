import "server-only";
import { CopyObjectCommand, DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { PhotoStore } from "@tsami/api/admin";

// Defaults match the SeaweedFS service in docker-compose.yml; deployments point these at Cloudflare R2.
const bucket = process.env.PHOTOS_S3_BUCKET ?? "tsami-photos";
const publicBaseUrl = process.env.PHOTOS_URL ?? "http://localhost:8333/tsami-photos";

let client: S3Client | undefined;

function s3() {
  client ??= new S3Client({
    endpoint: process.env.PHOTOS_S3_ENDPOINT ?? "http://localhost:8333",
    region: process.env.PHOTOS_S3_REGION ?? "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.PHOTOS_S3_ACCESS_KEY_ID ?? "tsami",
      secretAccessKey: process.env.PHOTOS_S3_SECRET_ACCESS_KEY ?? "tsami-dev-secret",
    },
  });
  return client;
}

/** Each key is written once, so browsers and CDNs may cache it forever. */
const cacheControl = "public, max-age=31536000, immutable";

export const photoStore: PhotoStore & {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
} = {
  publicUrl: (key) => `${publicBaseUrl}/${key}`,
  async put(key, body, contentType) {
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
      }),
    );
  },
  async copy(fromKey, toKey) {
    await s3().send(
      new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${fromKey}`, Key: toKey }),
    );
  },
  async delete(key) {
    await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};
