import { Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";

import { dateParamOrToday } from "@/lib/dates";
import { serverCaller } from "@/server/caller";

import { NewAppointmentForm } from "./page.client";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParamOrToday(dateParam);
  const api = await serverCaller();
  const [treatments, practitioners, clinic] = await Promise.all([
    api.treatments.list(),
    api.practitioners.list(),
    api.clinic(),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/?date=${date}`}>← უკან</Link>
        </Button>
        <h1 className="text-3xl">ახალი ვიზიტი</h1>
      </div>
      <Card>
        <CardContent>
          <NewAppointmentForm
            date={date}
            treatments={treatments}
            practitioners={practitioners}
            smsAvailable={clinic.smsAvailable}
          />
        </CardContent>
      </Card>
    </div>
  );
}
