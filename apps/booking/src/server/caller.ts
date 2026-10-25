import "server-only";
import { createBookingCaller } from "@face/api/booking";
import { headers } from "next/headers";

import { createBookingContext } from "./context";

/** Calls the Booking Site's tRPC procedures directly from server components. */
export async function serverCaller() {
  return createBookingCaller(createBookingContext(await headers()));
}
