import { Card, CardContent } from "@tsami/ui";

import { serverCaller } from "@/server/caller";

import { getPractitioner } from "../get-practitioner";
import { PractitionerForm } from "./page.client";

export default async function PractitionerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [practitioner, treatments] = await Promise.all([
    getPractitioner(id),
    (await serverCaller()).treatments.list(),
  ]);

  return (
    <Card>
      <CardContent>
        <PractitionerForm practitioner={practitioner} treatments={treatments} />
      </CardContent>
    </Card>
  );
}
