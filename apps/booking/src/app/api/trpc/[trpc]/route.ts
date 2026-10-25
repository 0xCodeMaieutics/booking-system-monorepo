import { bookingRouter } from "@face/api/booking";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createBookingContext } from "@/server/context";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: bookingRouter,
    createContext: () => createBookingContext(req.headers),
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") console.error(`tRPC ${path} failed`, error);
    },
  });
}

export { handler as GET, handler as POST };
