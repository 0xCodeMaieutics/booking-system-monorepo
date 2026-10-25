import { type LocalDate, toLocalDate } from "@tsami/booking/time";

export function todayInClinic(): LocalDate {
  return toLocalDate(new Date());
}
