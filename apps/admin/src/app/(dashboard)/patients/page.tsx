"use client";

import { Card, Input } from "@face/ui";
import { skipToken, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { useTRPC } from "@/trpc/client";

export default function PatientsPage() {
  const trpc = useTRPC();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const results = useQuery(trpc.patients.search.queryOptions(query.length >= 2 ? { q: query } : skipToken));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">პაციენტები</h1>
      <Input
        placeholder="სახელი ან ტელეფონის ნომერი"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full"
      />
      <div className="grid gap-2">
        {results.data?.length === 0 && <p className="text-ink-soft">ვერ მოიძებნა.</p>}
        {results.data?.map((p) => (
          <Link key={p.id} href={`/patients/${p.id}`}>
            <Card className="p-4 hover:border-rose-deep">
              <p className="font-medium">{p.fullName}</p>
              <p className="text-sm text-ink-soft">{p.phone}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
