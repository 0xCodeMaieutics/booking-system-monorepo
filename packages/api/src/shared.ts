import { TRPCError, type TRPC_ERROR_CODE_KEY } from "@trpc/server";
import { BookingError, type BookingErrorCode, isLocalDate } from "@tsami/booking";
import superjson from "superjson";
import { z } from "zod";

const trpcCodeFor: Record<BookingErrorCode, TRPC_ERROR_CODE_KEY> = {
  NOT_FOUND: "NOT_FOUND",
  INVALID_PHONE: "BAD_REQUEST",
  INVALID_EMAIL: "BAD_REQUEST",
  SLOT_UNAVAILABLE: "CONFLICT",
  SLOT_TAKEN: "CONFLICT",
  INVALID_CODE: "BAD_REQUEST",
  RATE_LIMITED: "TOO_MANY_REQUESTS",
  CUTOFF_PASSED: "FORBIDDEN",
  INVALID_STATE: "CONFLICT",
  CLINIC_CLOSED: "FORBIDDEN",
};

/** Shared tRPC options: superjson for Dates, and `bookingCode` on domain errors. */
export const trpcOptions = {
  transformer: superjson,
  errorFormatter({ shape, error }: { shape: { data: object }; error: TRPCError }) {
    const bookingCode = error.cause instanceof BookingError ? error.cause.code : null;
    return { ...shape, data: { ...shape.data, bookingCode } };
  },
};

/** Rethrows a domain error as a tRPC error with a matching HTTP status. */
export function rethrowBookingError(error: TRPCError): void {
  const cause = error.cause;
  if (cause instanceof BookingError) {
    throw new TRPCError({ code: trpcCodeFor[cause.code], message: cause.message, cause });
  }
}

export const zLocalDate = z.string().refine(isLocalDate, "Expected YYYY-MM-DD");
export const zLocale = z.enum(["ka", "en"]);
export const zChannel = z.enum(["sms", "email"]);
export const zContact = z.discriminatedUnion("channel", [
  z.object({ channel: z.literal("sms"), phone: z.string().min(5).max(32) }),
  z.object({ channel: z.literal("email"), email: z.string().max(200) }),
]);
