"use client";

import { Card } from "@face/ui";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { AttentionList } from "@/components/attention-list";
import { PractitionerForm } from "@/components/practitioner-form";
import { TimeOffManager } from "@/components/time-off-manager";
import { WeeklyScheduleEditor } from "@/components/weekly-schedule-editor";
import { useTRPC } from "@/trpc/client";

export default function PractitionerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();
  const practitioner = useQuery(trpc.practitioners.get.queryOptions({ id }));

  if (!practitioner.data) return <p className="text-ink-soft">იტვირთება…</p>;
  const p = practitioner.data;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">{p.nameKa}</h1>
      <AttentionList practitionerId={p.id} />
      <Card>
        <PractitionerForm practitioner={p} />
      </Card>
      <Card>
        <h2 className="mb-4 text-xl">სამუშაო განრიგი</h2>
        <WeeklyScheduleEditor practitionerId={p.id} ranges={p.ranges} />
      </Card>
      <Card>
        <h2 className="mb-4 text-xl">არასამუშაო დრო</h2>
        <TimeOffManager practitionerId={p.id} />
      </Card>
    </div>
  );
}
