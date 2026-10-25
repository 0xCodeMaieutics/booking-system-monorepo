const messages: Record<string, string> = {
  NOT_FOUND: "ვერ მოიძებნა.",
  INVALID_PHONE: "მობილურის ნომერი არასწორია.",
  SLOT_UNAVAILABLE: "ეს დრო თავისუფალი არ არის. აირჩიეთ სხვა ან ჩართეთ „განრიგის გარეთ“.",
  SLOT_TAKEN: "სპეციალისტს ამ დროს უკვე აქვს ვიზიტი.",
  INVALID_STATE: "ამ ვიზიტზე ეს მოქმედება შეუძლებელია.",
};

export function errorMessage(error: unknown): string {
  const e = error as { data?: { bookingCode?: string | null }; message?: string } | null;
  const code = e?.data?.bookingCode;
  return (code && messages[code]) || e?.message || "შეცდომა. სცადეთ თავიდან.";
}
