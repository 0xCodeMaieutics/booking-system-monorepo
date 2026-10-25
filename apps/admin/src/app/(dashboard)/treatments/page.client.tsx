"use client";

import { Button, Card, CardContent } from "@tsami/ui";
import { useState } from "react";

import { type Treatment, TreatmentForm } from "@/components/treatment-form";

export function TreatmentList({ treatments }: { treatments: Treatment[] }) {
  const [editing, setEditing] = useState<string>();

  return treatments.map((t) =>
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
  );
}
