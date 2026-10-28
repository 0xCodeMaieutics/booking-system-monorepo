const locales = ["ka", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Path on the public site for a locale: Georgian has no prefix. */
export function localePath(locale: Locale, path = "/"): string {
  return locale === "ka" ? path : `/en${path === "/" ? "" : path}`;
}

/** Placeholders until the real sales contact is decided. */
export const contact = {
  email: "hello@example.com",
  phone: "+995000000000",
  phoneDisplay: "+995 000 00 00 00",
};

export function demoHref(locale: Locale): string {
  const subject = locale === "ka" ? "Tsami — დემოს მოთხოვნა" : "Tsami — demo request";
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}`;
}

const ka = {
  meta: {
    title: "Tsami — ონლაინ ჯავშნის სისტემა კლინიკებისთვის",
    description:
      "პაციენტები ჯავშნიან ონლაინ, 24/7. თქვენ მართავთ სპეციალისტებს, განრიგს და ვიზიტებს ერთ ადგილას.",
  },
  otherLocale: "English",
  nav: { features: "შესაძლებლობები", how: "როგორ მუშაობს", faq: "კითხვები" },
  cta: { demo: "დემოს მოთხოვნა", how: "როგორ მუშაობს" },
  hero: {
    eyebrow: "საქართველოს კლინიკებისთვის",
    title: "ონლაინ ჯავშანი, რომელიც თქვენს კლინიკას ეკუთვნის",
    body: "პაციენტები თავად ირჩევენ პროცედურას, სპეციალისტს და დროს — დღე და ღამე, ზარის გარეშე. თქვენ ხედავთ ყველა ვიზიტს ერთ ადგილას.",
    note: "ქართულად და ინგლისურად · SMS დადასტურება · ორმაგი ჯავშნის გარეშე",
  },
  mock: {
    clinic: "თქვენი კლინიკა",
    treatment: "ბოტოქსი · 30 წთ",
    practitioner: "ნებისმიერი სპეციალისტი",
    day: "ხუთ, 29 ოქტ",
    confirm: "დაჯავშნის დადასტურება",
    sms: "თქვენი კლინიკა: ჩაწერილი ხართ ხუთშაბათს, 11:30-ზე.",
  },
  trust: { label: "უკვე იყენებს", clinic: "ესთეტიკის ცენტრი ფეისი", city: "ქუთაისი" },
  features: {
    title: "ყველაფერი, რაც ჯავშნისთვის გჭირდებათ",
    body: "პაციენტისთვის მარტივი, ადმინისტრატორისთვის — სრული კონტროლი.",
    items: [
      {
        title: "ონლაინ ჯავშანი 24/7",
        body: "პაციენტი ირჩევს პროცედურას, სპეციალისტს ან „ნებისმიერ სპეციალისტს“ და თავისუფალ დროს. ანგარიშის შექმნა არ სჭირდება.",
      },
      {
        title: "SMS თქვენი კლინიკის სახელით",
        body: "დადასტურება და შეხსენება მიდის კლინიკის სახელით — პაციენტი ცნობს გამგზავნს და არ თვლის სპამად.",
      },
      {
        title: "ორმაგი ჯავშანი გამორიცხულია",
        body: "ერთ სპეციალისტს ერთ დროს მხოლოდ ერთი ვიზიტი ექნება — ამას მონაცემთა ბაზა იცავს და არა მხოლოდ ინტერფეისი.",
      },
      {
        title: "განრიგი და დასვენება",
        body: "კვირის განრიგი თითოეული სპეციალისტისთვის, შესვენებებით. შვებულება, ავადმყოფობა ან კლინიკის დახურვა — ერთი ჩანაწერით.",
      },
      {
        title: "თქვენი წესები",
        body: "განსაზღვრეთ, რამდენი ხნით ადრე შეიძლება ჯავშანი და რამდენ საათამდე შეუძლია პაციენტს ვიზიტის თავად გაუქმება.",
      },
      {
        title: "გაუქმება ზარის გარეშე",
        body: "პაციენტი იღებს პირად ბმულს, საიდანაც ხედავს ან აუქმებს ვიზიტს — დრო მაშინვე თავისუფლდება სხვისთვის.",
      },
    ],
  },
  how: {
    title: "როგორ მუშაობს",
    steps: [
      {
        title: "ჩვენ ვამზადებთ სისტემას",
        body: "ვქმნით თქვენი კლინიკის ჯავშნის გვერდს და ადმინისტრატორის ანგარიშებს.",
      },
      {
        title: "თქვენ ამატებთ გუნდს",
        body: "სპეციალისტები, პროცედურები, ფასები და კვირის განრიგი — ადმინისტრატორის პანელიდან.",
      },
      {
        title: "პაციენტები ჯავშნიან",
        body: "დაამატეთ ბმული საიტზე, Instagram-ზე ან Google-ზე. ვიზიტები პირდაპირ თქვენს კალენდარში ჩნდება.",
      },
    ],
  },
  admin: {
    title: "ერთი ეკრანი მთელი დღისთვის",
    body: "ადმინისტრატორი ხედავს დღის ყველა ვიზიტს, ამატებს ჯავშანს ტელეფონით დარეკილი პაციენტისთვის და ვიზიტის შემდეგ ნიშნავს: დასრულდა თუ პაციენტი არ გამოცხადდა.",
    points: [
      "ადმინისტრატორებს იწვევენ სხვა ადმინისტრატორები",
      "არქივირებული სპეციალისტები და პროცედურები ძველ ვიზიტებში რჩება",
      "მონაცემები ინახება ევროკავშირში (ფრანკფურტი)",
    ],
    day: "დღევანდელი ვიზიტები",
    rows: [
      { time: "10:00", name: "ნინო კ.", treatment: "ქიმიური პილინგი", status: "დასრულდა" },
      { time: "11:30", name: "მარიამ ბ.", treatment: "ბოტოქსი", status: "დაჯავშნილი" },
      { time: "13:00", name: "ანა ლ.", treatment: "ფილერი", status: "დაჯავშნილი" },
    ],
  },
  // Placeholder wording, in both locales, until Face Aesthetic Centre approves it.
  quote: {
    text: "ახლა პაციენტების უმეტესობა თავად ჯავშნის და ტელეფონი ნაკლებად რეკავს. დილით უკვე ვიცით, ვის ველოდებით.",
    author: "ესთეტიკის ცენტრი ფეისი, ქუთაისი",
  },
  faq: {
    title: "ხშირად დასმული კითხვები",
    items: [
      {
        q: "რა ღირს?",
        a: "ფასი დამოკიდებულია კლინიკის ზომაზე. მოითხოვეთ დემო და შემოგთავაზებთ ფასს.",
      },
      {
        q: "სჭირდება თუ არა პაციენტს ანგარიში ან აპლიკაცია?",
        a: "არა. პაციენტი ჯავშნის ბრაუზერიდან და ადასტურებს მობილურის ნომერს SMS კოდით.",
      },
      {
        q: "ვინ ხედავს პაციენტი — Tsami-ს თუ ჩემს კლინიკას?",
        a: "თქვენს კლინიკას. ჯავშნის გვერდს თქვენი კლინიკის სახელი ახურავს და ყველა SMS მისი სახელით იგზავნება.",
      },
      {
        q: "რა ენებზეა ხელმისაწვდომი?",
        a: "ჯავშნის გვერდი და SMS — ქართულად და ინგლისურად. ადმინისტრატორის პანელი — ქართულად.",
      },
      {
        q: "შემიძლია თუ არა ტელეფონით ჯავშნის მიღება?",
        a: "დიახ. ადმინისტრატორი ამატებს ვიზიტს პანელიდან და მას ჯავშნის ფანჯრის შეზღუდვები არ ეხება.",
      },
    ],
  },
  final: {
    title: "მზად ხართ, პაციენტებმა ონლაინ დაჯავშნონ?",
    body: "მოგვწერეთ და გაჩვენებთ, როგორ იმუშავებს Tsami თქვენს კლინიკაში.",
    or: "ან დაგვირეკეთ",
  },
  footer: { tagline: "ონლაინ ჯავშნის სისტემა საქართველოს კლინიკებისთვის." },
};

type Dictionary = typeof ka;

const en: Dictionary = {
  meta: {
    title: "Tsami — Online booking for clinics in Georgia",
    description:
      "Patients book online, 24/7. You manage practitioners, schedules and appointments in one place.",
  },
  otherLocale: "ქართული",
  nav: { features: "Features", how: "How it works", faq: "FAQ" },
  cta: { demo: "Request a demo", how: "See how it works" },
  hero: {
    eyebrow: "For clinics in Georgia",
    title: "Online booking that belongs to your clinic",
    body: "Patients pick a treatment, a practitioner and a time themselves — day or night, without a phone call. You see every appointment in one place.",
    note: "Georgian & English · SMS confirmations · No double bookings",
  },
  mock: {
    clinic: "Your Clinic",
    treatment: "Botox · 30 min",
    practitioner: "Any practitioner",
    day: "Thu, 29 Oct",
    confirm: "Confirm booking",
    sms: "Your Clinic: you're booked for Thursday at 11:30.",
  },
  trust: { label: "Already used by", clinic: "Face Aesthetic Centre", city: "Kutaisi" },
  features: {
    title: "Everything you need to take bookings",
    body: "Simple for Patients, full control for your Admins.",
    items: [
      {
        title: "Online booking, 24/7",
        body: "Patients choose a treatment, a practitioner or “any practitioner”, and an available time. No account needed.",
      },
      {
        title: "SMS in your clinic's name",
        body: "Confirmations and reminders are sent in your clinic's name, so Patients recognise the sender and don't mistake it for spam.",
      },
      {
        title: "No double bookings",
        body: "A practitioner can only ever have one appointment at a time — enforced by the database, not just the interface.",
      },
      {
        title: "Schedules and time off",
        body: "A weekly schedule per practitioner, with breaks. Holidays, sick days or a clinic closure take one entry.",
      },
      {
        title: "Your rules",
        body: "Set how far ahead Patients can book, and how close to the appointment they can still cancel themselves.",
      },
      {
        title: "Cancellations without calls",
        body: "Patients get a private link to view or cancel their appointment, and the time is freed for someone else straight away.",
      },
    ],
  },
  how: {
    title: "How it works",
    steps: [
      {
        title: "We set you up",
        body: "We create your clinic's booking page and your Admin accounts.",
      },
      {
        title: "You add your team",
        body: "Practitioners, treatments, prices and weekly schedules — all from the Admin Dashboard.",
      },
      {
        title: "Patients book",
        body: "Link to it from your website, Instagram or Google. Appointments appear straight in your day view.",
      },
    ],
  },
  admin: {
    title: "One screen for the whole day",
    body: "Admins see every appointment for the day, book Patients who phone in, and afterwards mark each visit as completed or a no-show.",
    points: [
      "Admins are invited by other Admins",
      "Archived practitioners and treatments stay on past appointments",
      "Data is stored in the EU (Frankfurt)",
    ],
    day: "Today's appointments",
    rows: [
      { time: "10:00", name: "Nino K.", treatment: "Chemical peel", status: "Completed" },
      { time: "11:30", name: "Mariam B.", treatment: "Botox", status: "Booked" },
      { time: "13:00", name: "Ana L.", treatment: "Dermal filler", status: "Booked" },
    ],
  },
  quote: {
    text: "Most of our Patients now book themselves and the phone rings far less. Every morning we already know who we're expecting.",
    author: "Face Aesthetic Centre, Kutaisi",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "How much does it cost?",
        a: "Pricing depends on the size of your clinic. Request a demo and we'll give you a quote.",
      },
      {
        q: "Do Patients need an account or an app?",
        a: "No. Patients book in the browser and confirm their mobile number with an SMS code.",
      },
      {
        q: "Who do Patients see — Tsami or my clinic?",
        a: "Your clinic. The booking page is headed by your clinic's name and every SMS is sent in its name.",
      },
      {
        q: "Which languages are supported?",
        a: "The booking page and SMS are in Georgian and English. The Admin Dashboard is in Georgian.",
      },
      {
        q: "Can I still take bookings by phone?",
        a: "Yes. Admins add appointments from the dashboard, and aren't bound by the booking window.",
      },
    ],
  },
  final: {
    title: "Ready for Patients to book online?",
    body: "Get in touch and we'll show you how Tsami would work at your clinic.",
    or: "or call",
  },
  footer: { tagline: "Online booking for clinics in Georgia." },
};

export const dictionaries: Record<Locale, Dictionary> = { ka, en };
export type { Dictionary };
