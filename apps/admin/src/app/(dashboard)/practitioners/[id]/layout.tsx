"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@tsami/ui";
import Link from "next/link";
import { use } from "react";

import { AttentionList } from "@/components/attention-list";
import { PractitionerTabs } from "@/components/practitioner-tabs";
import { useTRPC } from "@/trpc/client";

export default function PractitionerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
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
      <PractitionerTabs practitionerId={p.id} />
      {children}
    </div>
  );
}
