"use client";

import type { BookingRouter } from "@face/api/booking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { type ReactNode, useState } from "react";
import superjson from "superjson";

export const { TRPCProvider, useTRPC } = createTRPCContext<BookingRouter>();

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
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
