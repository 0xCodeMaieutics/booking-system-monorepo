import { Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";

import { serverCaller } from "@/server/caller";

import { NewTreatmentForm } from "./page.client";

export default async function NewTreatmentPage() {
  const treatments = await (await serverCaller()).treatments.list();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/treatments">← უკან</Link>
        </Button>
        <h1 className="text-3xl">ახალი პროცედურა</h1>
      </div>
      <Card>
        <CardContent>
          <NewTreatmentForm sortOrder={treatments.length} />
        </CardContent>
      </Card>
    </div>
  );
}
