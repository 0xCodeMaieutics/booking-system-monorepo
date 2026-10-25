import { Card, CardContent } from "@tsami/ui";

import { TimeOffManager } from "@/components/time-off-manager";
import { serverCaller } from "@/server/caller";

import { getPractitioner } from "../get-practitioner";

export default async function PractitionerTimeOffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getPractitioner(id);
  const timeOff = await (await serverCaller()).timeOff.list({ practitionerId: id });

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-xl">არასამუშაო დრო</h2>
        <TimeOffManager practitionerId={id} timeOff={timeOff} />
      </CardContent>
    </Card>
  );
}
