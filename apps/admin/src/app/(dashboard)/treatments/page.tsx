import { Button } from "@tsami/ui";
import Link from "next/link";

import { serverCaller } from "@/server/caller";

import { TreatmentList } from "./page.client";

export default async function TreatmentsPage() {
  const treatments = await (await serverCaller()).treatments.list();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">პროცედურები</h1>
        <Button asChild size="lg">
          <Link href="/treatments/new">დამატება</Link>
        </Button>
      </div>
      <TreatmentList treatments={treatments} />
    </div>
  );
}
