"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";
import { useState } from "react";

import { TreatmentForm } from "@/components/treatment-form";
import { useTRPC } from "@/trpc/client";

export default function TreatmentsPage() {
  const trpc = useTRPC();
  const treatments = useQuery(trpc.treatments.list.queryOptions());
  const [editing, setEditing] = useState<string>();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">პროცედურები</h1>
        <Button asChild size="lg">
          <Link href="/treatments/new">დამატება</Link>
        </Button>
      </div>
      {treatments.data?.map((t) =>
        editing === t.id ? (
          <Card key={t.id}>
            <CardContent>
              <TreatmentForm treatment={t} sortOrder={t.sortOrder} onDone={() => setEditing(undefined)} />
            </CardContent>
          </Card>
        ) : (
          <Card size="sm" key={t.id} className={t.archivedAt ? "opacity-50" : undefined}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {t.nameKa} {t.archivedAt && "· დაარქივებული"}
                </p>
                <p className="text-sm text-ink-soft">
                  {t.nameEn} · {t.durationMinutes} წთ{t.priceFromGel !== null && ` · ${t.priceFromGel} ₾-დან`}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(t.id)}>
                რედაქტირება
              </Button>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
