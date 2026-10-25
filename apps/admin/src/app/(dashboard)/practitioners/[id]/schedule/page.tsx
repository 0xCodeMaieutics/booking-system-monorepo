"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@tsami/ui";
import { use } from "react";

import { WeeklyScheduleEditor } from "@/components/weekly-schedule-editor";
import { useTRPC } from "@/trpc/client";

export default function PractitionerSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();
  const practitioner = useQuery(trpc.practitioners.get.queryOptions({ id }));

  if (!practitioner.data) return null;

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-xl">სამუშაო განრიგი</h2>
        <WeeklyScheduleEditor practitionerId={id} ranges={practitioner.data.ranges} />
      </CardContent>
    </Card>
  );
}
