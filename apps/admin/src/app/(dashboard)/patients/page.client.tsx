"use client";

import { Input, cn } from "@tsami/ui";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";

const DEBOUNCE_MS = 300;

/** The search box for the Patients page; the server renders `children` for the `q` in the URL. */
export function PatientSearch({ initialQuery, children }: { initialQuery: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const query = q.trim();
    if (query === initialQuery.trim()) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      startTransition(() =>
        router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false }),
      );
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, initialQuery, pathname, router]);

  return (
    <>
      <Input
        placeholder="სახელი ან ტელეფონის ნომერი"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full"
      />
      <div className={cn("grid gap-2 transition-opacity", isPending && "opacity-60")}>{children}</div>
    </>
  );
}
