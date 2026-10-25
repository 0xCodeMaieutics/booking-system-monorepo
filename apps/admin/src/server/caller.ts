import "server-only";
import { TRPCError } from "@trpc/server";
import { createAdminCaller } from "@tsami/api/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { createAdminContext } from "./context";

/** Calls the Admin Dashboard's tRPC procedures directly from server components, once per request. */
export const serverCaller = cache(async () => createAdminCaller(await createAdminContext(await headers())));

/** Awaits a lookup by URL id, rendering the 404 page when the record is missing or the id is malformed. */
export async function findOrNotFound<T>(lookup: Promise<T>): Promise<T> {
  try {
    return await lookup;
  } catch (error) {
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST"))
      notFound();
    throw error;
  }
}
