import type { AttentionReason } from "@tsami/booking";

export const statusLabel = {
  booked: "დაჯავშნილი",
  cancelled: "გაუქმებული",
  completed: "დასრულებული",
  no_show: "არ გამოცხადდა",
} as const;

export const statusTone = {
  booked: "bg-mist text-ink",
  cancelled: "bg-ink/5 text-ink-soft line-through",
  completed: "bg-success/10 text-success",
  no_show: "bg-danger/10 text-danger",
} as const;

export const attentionLabel: Record<AttentionReason, string> = {
  practitioner_archived: "სპეციალისტი დაარქივებულია",
  treatment_not_offered: "სპეციალისტი ამ პროცედურას აღარ ატარებს",
  outside_schedule: "სამუშაო განრიგის გარეთაა",
  time_off: "ემთხვევა არასამუშაო დროს",
};

export const weekdayLabel = [
  "",
  "ორშაბათი",
  "სამშაბათი",
  "ოთხშაბათი",
  "ხუთშაბათი",
  "პარასკევი",
  "შაბათი",
  "კვირა",
];
