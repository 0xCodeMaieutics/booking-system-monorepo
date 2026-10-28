import "server-only";
import { TRPCError } from "@trpc/server";
import { createBookingCaller } from "@tsami/api/booking";
import { headers } from "next/headers";
import { cache } from "react";

import { createBookingContext } from "./context";

/** Calls the Booking Site's tRPC procedures directly from server components, once per request. */
export const serverCaller = cache(async () => createBookingCaller(createBookingContext(await headers())));

/** Awaits a lookup, resolving to `null` when the record is missing. */
export async function findOrNull<T>(lookup: Promise<T>): Promise<T | null> {
  try {
    return await lookup;
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
    throw error;
  }
}

/** The Clinic behind a Handle, once per request; `null` when no Clinic has it. */
export const findClinic = cache(async (handle: string) =>
  findOrNull((await serverCaller()).clinic({ handle })),
);
