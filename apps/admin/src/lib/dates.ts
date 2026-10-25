import { type LocalDate, isLocalDate, toLocalDate } from "@tsami/booking/time";

export function todayInClinic(): LocalDate {
  return toLocalDate(new Date());
}

/** The `?date=` search param when it's a valid date, otherwise today. */
export function dateParamOrToday(value: string | undefined): LocalDate {
  return value && isLocalDate(value) ? value : todayInClinic();
}
