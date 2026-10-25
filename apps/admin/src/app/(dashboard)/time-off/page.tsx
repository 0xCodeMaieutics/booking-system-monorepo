import { Card, CardContent } from "@tsami/ui";

import { TimeOffManager } from "@/components/time-off-manager";
import { serverCaller } from "@/server/caller";

export default async function TimeOffPage() {
  const api = await serverCaller();
  const [timeOff, practitioners] = await Promise.all([
    api.timeOff.list({ practitionerId: null }),
    api.practitioners.list(),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">არასამუშაო დრო</h1>
      <p className="text-sm text-ink-soft">
        შვებულება, ავადმყოფობა ან კლინიკის დახურვა. არსებული ვიზიტები ავტომატურად არ უქმდება — ისინი
        გამოჩნდება „ყურადღება საჭიროა“ სიაში.
      </p>
      <Card>
        <CardContent>
          <TimeOffManager timeOff={timeOff} practitioners={practitioners} />
        </CardContent>
      </Card>
    </div>
  );
}
