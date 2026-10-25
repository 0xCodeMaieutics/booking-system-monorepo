import { Button } from "@tsami/ui";
import Link from "next/link";

import { AttentionList } from "@/components/attention-list";
import { PractitionerTabs } from "@/components/practitioner-tabs";
import { serverCaller } from "@/server/caller";

import { getPractitioner } from "./get-practitioner";

export default async function PractitionerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPractitioner(id);
  const attention = await (await serverCaller()).attention.list({ practitionerId: p.id });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/practitioners">← უკან</Link>
        </Button>
        <h1 className="text-3xl">{p.nameKa}</h1>
      </div>
      <AttentionList rows={attention} />
      <PractitionerTabs practitionerId={p.id} />
      {children}
    </div>
  );
}
