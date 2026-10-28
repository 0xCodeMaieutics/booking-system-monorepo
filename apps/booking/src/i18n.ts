const locales = ["ka", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Request header the proxy sets to the Locale it rewrote to. */
export const LOCALE_HEADER = "x-tsami-locale";

/**
 * Public path on a Clinic's Booking Site: `/{handle}` in Georgian, `/{handle}/en` in English
 * (docs/adr/0008).
 */
export function clinicPath(handle: string, locale: Locale, path = "/"): string {
  const base = locale === "ka" ? `/${handle}` : `/${handle}/en`;
  return path === "/" ? base : `${base}${path}`;
}

/**
 * Splits a Booking Site pathname into its Handle, Locale and the segments after them. It accepts
 * both the public form and the proxy's internal `/{locale}/{handle}/…` rewrite; a Handle is never
 * a Locale, so the first segment tells them apart.
 */
export function parseSitePathname(pathname: string): { handle: string; locale: Locale; rest: string[] } {
  const [first = "", ...others] = pathname.split("/").filter(Boolean);
  if (isLocale(first)) {
    const [handle = "", ...rest] = others;
    return { handle, locale: first, rest };
  }
  const handle = first;
  const rest = others;
  if (rest[0] === "en") return { handle, locale: "en", rest: rest.slice(1) };
  return { handle, locale: "ka", rest };
}

const ka = {
  meta: {
    title: (clinic: string) => `ვიზიტის დაჯავშნა — ${clinic}`,
    description: "აირჩიეთ პროცედურა, სპეციალისტი და თქვენთვის სასურველი დრო.",
  },
  notFound: "ეს გვერდი ვერ მოიძებნა.",
  closed: (clinic: string) => `${clinic} ონლაინ ჯავშნებს აღარ იღებს. დაგვიკავშირდით:`,
  poweredBy: "ჯავშნის სისტემა",
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
    noGeorgianNumber: "არ მაქვს ქართული მობილურის ნომერი",
    smsUnavailable: "SMS დროებით მიუწვდომელია, ამიტომ კოდს ელფოსტაზე გამოგიგზავნით.",
    emailRequired: "ელფოსტა",
    emailHint: "დასადასტურებლად კოდს ელფოსტაზე გამოგიგზავნით",
    phoneAnyCountry: "ტელეფონი (არასავალდებულო, ნებისმიერი ქვეყნის)",
    note: "შენიშვნა (არასავალდებულო)",
    sendCode: "კოდის მიღება",
    code: "SMS კოდი",
    emailCode: "ელფოსტით მიღებული კოდი",
    codeSentTo: "კოდი გაიგზავნა:",
    confirm: "დაჯავშნის დადასტურება",
    resend: "ნომრის შეცვლა",
    resendEmail: "ელფოსტის შეცვლა",
  },
  summary: "თქვენი არჩევანი",
  back: "უკან",
  change: "შეცვლა",
  done: {
    title: "ჩაწერილი ხართ!",
    body: "დადასტურება და ვიზიტის მართვის ბმული გამოგიგზავნეთ.",
    manage: "ვიზიტის ნახვა",
    another: "კიდევ ერთი ვიზიტის დაჯავშნა",
  },
  errors: {
    INVALID_PHONE: "გთხოვთ, შეიყვანოთ სწორი ქართული მობილურის ნომერი.",
    INVALID_EMAIL: "გთხოვთ, შეიყვანოთ სწორი ელფოსტა.",
    SMS_UNAVAILABLE: "SMS დროებით მიუწვდომელია. გთხოვთ, განაახლოთ გვერდი და გამოიყენოთ ელფოსტა.",
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
    title: (clinic: string) => `Book an appointment — ${clinic}`,
    description: "Choose a treatment, a practitioner and a time that suits you.",
  },
  notFound: "We couldn't find this page.",
  closed: (clinic: string) => `${clinic} no longer takes online bookings. Please call:`,
  poweredBy: "Bookings by",
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
    noGeorgianNumber: "I don't have a Georgian mobile number",
    smsUnavailable: "SMS is temporarily unavailable, so we'll email you a code.",
    emailRequired: "Email",
    emailHint: "We'll email you a code to confirm",
    phoneAnyCountry: "Phone (optional, any country)",
    note: "Note (optional)",
    sendCode: "Send code",
    code: "SMS code",
    emailCode: "Code from the email",
    codeSentTo: "Code sent to",
    confirm: "Confirm booking",
    resend: "Change number",
    resendEmail: "Change email",
  },
  summary: "Your selection",
  back: "Back",
  change: "Change",
  done: {
    title: "You're booked!",
    body: "We've sent you a confirmation with a link to manage your appointment.",
    manage: "View appointment",
    another: "Book another appointment",
  },
  errors: {
    INVALID_PHONE: "Please enter a valid Georgian mobile number.",
    INVALID_EMAIL: "Please enter a valid email address.",
    SMS_UNAVAILABLE: "SMS is temporarily unavailable. Please reload the page and use your email.",
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
