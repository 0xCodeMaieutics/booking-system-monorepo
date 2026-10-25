import type { inferRouterOutputs } from "@trpc/server";
import type { BookingRouter } from "@tsami/api/booking";

export type BookingOutputs = inferRouterOutputs<BookingRouter>;
