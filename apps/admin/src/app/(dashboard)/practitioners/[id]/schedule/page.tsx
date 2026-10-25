import { Card, CardContent } from "@tsami/ui";

import { getPractitioner } from "../get-practitioner";
import { WeeklyScheduleEditor } from "./page.client";

export default async function PractitionerSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const practitioner = await getPractitioner(id);

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-xl">სამუშაო განრიგი</h2>
        <WeeklyScheduleEditor practitionerId={id} ranges={practitioner.ranges} />
      </CardContent>
    </Card>
  );
}
