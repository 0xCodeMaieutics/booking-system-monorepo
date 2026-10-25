"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@tsami/ui";
import { use } from "react";

import { PractitionerForm } from "@/components/practitioner-form";
import { useTRPC } from "@/trpc/client";

export default function PractitionerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();
  const practitioner = useQuery(trpc.practitioners.get.queryOptions({ id }));

  if (!practitioner.data) return null;

  return (
    <Card>
      <CardContent>
        <PractitionerForm practitioner={practitioner.data} />
      </CardContent>
    </Card>
  );
}
