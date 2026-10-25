import { Suspense } from "react";

import { AppointmentsDay } from "@/components/appointments-day";

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsDay />
    </Suspense>
  );
}
