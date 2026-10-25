"use client";

import { Card, CardContent } from "@tsami/ui";
import { use } from "react";

import { TimeOffManager } from "@/components/time-off-manager";

export default function PractitionerTimeOffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-xl">არასამუშაო დრო</h2>
        <TimeOffManager practitionerId={id} />
      </CardContent>
    </Card>
  );
}
