import { dateParamOrToday, todayInClinic } from "@/lib/dates";
import { serverCaller } from "@/server/caller";

import { AppointmentsDay } from "./page.client";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; appointmentId?: string }>;
}) {
  const { date: dateParam, appointmentId } = await searchParams;
  const today = todayInClinic();
  const date = dateParamOrToday(dateParam);
  const api = await serverCaller();
  const [day, attention, treatments, practitioners] = await Promise.all([
    api.appointments.day({ date }),
    api.attention.list(),
    api.treatments.list(),
    api.practitioners.list(),
  ]);

  return (
    <AppointmentsDay
      date={date}
      today={today}
      highlightId={appointmentId ?? null}
      day={day}
      attention={attention}
      treatments={treatments}
      practitioners={practitioners}
    />
  );
}
