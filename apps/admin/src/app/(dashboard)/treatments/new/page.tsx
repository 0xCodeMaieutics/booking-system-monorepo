"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { TreatmentForm } from "@/components/treatment-form";
import { useTRPC } from "@/trpc/client";

export default function NewTreatmentPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const treatments = useQuery(trpc.treatments.list.queryOptions());

  if (!treatments.data) return <p className="text-ink-soft">იტვირთება…</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/treatments">← უკან</Link>
        </Button>
        <h1 className="text-3xl">ახალი პროცედურა</h1>
      </div>
      <Card>
        <CardContent>
          <TreatmentForm sortOrder={treatments.data.length} onDone={() => router.push("/treatments")} />
        </CardContent>
      </Card>
    </div>
  );
}
