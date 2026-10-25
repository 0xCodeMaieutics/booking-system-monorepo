export const locales = ["ka", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Path on the public site for a locale: Georgian has no prefix. */
export function localePath(locale: Locale, path = "/"): string {
  return locale === "ka" ? path : `/en${path === "/" ? "" : path}`;
}

const ka = {
  meta: {
    title: "ვიზიტის დაჯავშნა — ესთეტიკის ცენტრი ფეისი",
    description: "აირჩიეთ პროცედურა, სპეციალისტი და თქვენთვის სასურველი დრო.",
  },
  clinic: "ესთეტიკის ცენტრი ფეისი",
  otherLocale: "English",
  steps: { treatment: "პროცედურა", practitioner: "სპეციალისტი", time: "დრო", details: "თქვენი მონაცემები" },
  treatment: { title: "რომელი პროცედურა გსურთ?", minutes: "წთ", price: (gel: number) => `${gel} ₾-დან` },
  practitioner: {
    title: "ვისთან გსურთ ვიზიტი?",
    any: "ნებისმიერი სპეციალისტი",
    anyHint: "გაჩვენებთ ყველა თავისუფალ დროს",
    none: "ამ პროცედურაზე თავისუფალი დრო ამჟამად არ არის. დაგვიკავშირდით:",
  },
  time: { title: "აირჩიეთ დღე და დრო", none: "თავისუფალი დრო არ არის.", loading: "იტვირთება…" },
  details: {
    title: "თქვენი მონაცემები",
    fullName: "სახელი და გვარი",
    phone: "მობილურის ნომერი",
    phoneHint: "გამოგიგზავნით SMS კოდს დასადასტურებლად",
    email: "ელფოსტა (არასავალდებულო)",
    note: "შენიშვნა (არასავალდებულო)",
    sendCode: "კოდის მიღება",
    code: "SMS კოდი",
    codeSentTo: "კოდი გაიგზავნა ნომერზე",
    confirm: "დაჯავშნის დადასტურება",
    resend: "ნომრის შეცვლა",
  },
  summary: "თქვენი არჩევანი",
  back: "უკან",
  change: "შეცვლა",
  done: {
    title: "ჩაწერილი ხართ!",
    body: "დადასტურება და ვიზიტის მართვის ბმული გამოგიგზავნეთ SMS-ით.",
    manage: "ვიზიტის ნახვა",
    another: "კიდევ ერთი ვიზიტის დაჯავშნა",
  },
  errors: {
    INVALID_PHONE: "გთხოვთ, შეიყვანოთ სწორი მობილურის ნომერი.",
    INVALID_CODE: "კოდი არასწორია ან ვადაგასულია.",
    RATE_LIMITED: "ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით.",
    SLOT_UNAVAILABLE: "ეს დრო უკვე დაკავებულია. გთხოვთ, აირჩიოთ სხვა.",
    SLOT_TAKEN: "ეს დრო ახლახან დაიკავეს. გთხოვთ, აირჩიოთ სხვა.",
    generic: "რაღაც შეცდომა მოხდა. სცადეთ თავიდან.",
  },
  manage: {
    title: "თქვენი ვიზიტი",
    statusLabel: "სტატუსი",
    status: {
      booked: "დაჯავშნილი",
      cancelled: "გაუქმებული",
      completed: "დასრულებული",
      no_show: "არ გამოცხადდა",
    },
    cancel: "ვიზიტის გაუქმება",
    confirmCancel: "ნამდვილად გსურთ ვიზიტის გაუქმება?",
    cancelled: "ვიზიტი გაუქმებულია.",
    tooLate: (hours: number) => `ვიზიტამდე ${hours} საათზე ნაკლები დარჩა. გასაუქმებლად დაგვირეკეთ:`,
    notFound: "ვიზიტი ვერ მოიძებნა.",
    bookAgain: "ახალი ვიზიტის დაჯავშნა",
  },
};

type Dictionary = typeof ka;

const en: Dictionary = {
  meta: {
    title: "Book an appointment — Face Aesthetic Centre",
    description: "Choose a treatment, a practitioner and a time that suits you.",
  },
  clinic: "Face Aesthetic Centre",
  otherLocale: "ქართული",
  steps: { treatment: "Treatment", practitioner: "Practitioner", time: "Time", details: "Your details" },
  treatment: {
    title: "Which treatment would you like?",
    minutes: "min",
    price: (gel: number) => `from ${gel} ₾`,
  },
  practitioner: {
    title: "Who would you like to see?",
    any: "Any practitioner",
    anyHint: "Shows every available time",
    none: "There are no available times for this treatment right now. Please call us:",
  },
  time: { title: "Pick a day and time", none: "No available times.", loading: "Loading…" },
  details: {
    title: "Your details",
    fullName: "Full name",
    phone: "Mobile number",
    phoneHint: "We'll text you a code to confirm",
    email: "Email (optional)",
    note: "Note (optional)",
    sendCode: "Send code",
    code: "SMS code",
    codeSentTo: "Code sent to",
    confirm: "Confirm booking",
    resend: "Change number",
  },
  summary: "Your selection",
  back: "Back",
  change: "Change",
  done: {
    title: "You're booked!",
    body: "We've texted you a confirmation with a link to manage your appointment.",
    manage: "View appointment",
    another: "Book another appointment",
  },
  errors: {
    INVALID_PHONE: "Please enter a valid mobile number.",
    INVALID_CODE: "That code is wrong or has expired.",
    RATE_LIMITED: "Too many attempts. Please try again later.",
    SLOT_UNAVAILABLE: "That time is no longer available. Please pick another.",
    SLOT_TAKEN: "Someone just booked that time. Please pick another.",
    generic: "Something went wrong. Please try again.",
  },
  manage: {
    title: "Your appointment",
    statusLabel: "Status",
    status: { booked: "Booked", cancelled: "Cancelled", completed: "Completed", no_show: "No-show" },
    cancel: "Cancel appointment",
    confirmCancel: "Are you sure you want to cancel this appointment?",
    cancelled: "Your appointment has been cancelled.",
    tooLate: (hours: number) =>
      `It's less than ${hours} hours until your appointment. To cancel, please call us:`,
    notFound: "We couldn't find this appointment.",
    bookAgain: "Book a new appointment",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { ka, en };
export type { Dictionary };
