import { Card } from "@tsami/ui";

import { TimeOffManager } from "@/components/time-off-manager";

export default function TimeOffPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">არასამუშაო დრო</h1>
      <p className="text-sm text-ink-soft">
        შვებულება, ავადმყოფობა ან კლინიკის დახურვა. არსებული ვიზიტები ავტომატურად არ უქმდება — ისინი
        გამოჩნდება „ყურადღება საჭიროა“ სიაში.
      </p>
      <Card>
        <TimeOffManager />
      </Card>
    </div>
  );
}
