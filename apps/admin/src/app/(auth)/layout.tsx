import { Wordmark } from "@visita/ui";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <Wordmark className="text-2xl" />
      {children}
    </main>
  );
}
