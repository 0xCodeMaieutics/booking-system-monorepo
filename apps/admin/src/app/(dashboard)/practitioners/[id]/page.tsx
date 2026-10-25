"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";
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
      <div className="flex flex-col items-start gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/practitioners">← უკან</Link>
        </Button>
        <h1 className="text-3xl">{p.nameKa}</h1>
      </div>
      <AttentionList practitionerId={p.id} />
      <Card>
        <CardContent>
          <PractitionerForm practitioner={p} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="mb-4 text-xl">სამუშაო განრიგი</h2>
          <WeeklyScheduleEditor practitionerId={p.id} ranges={p.ranges} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="mb-4 text-xl">არასამუშაო დრო</h2>
          <TimeOffManager practitionerId={p.id} />
        </CardContent>
      </Card>
    </div>
  );
}
