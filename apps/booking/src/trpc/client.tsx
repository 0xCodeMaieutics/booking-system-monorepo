"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { BookingRouter } from "@tsami/api/booking";
import { type ReactNode, useState } from "react";
import superjson from "superjson";

const trpcContext = createTRPCContext<BookingRouter>();
const { TRPCProvider } = trpcContext;
export const { useTRPC } = trpcContext;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<BookingRouter>({
      links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

/** The domain error code attached by the API, if any. */
export function bookingCodeOf(error: unknown): string | null {
  const data = (error as { data?: { bookingCode?: string | null } } | null)?.data;
  return data?.bookingCode ?? null;
}
