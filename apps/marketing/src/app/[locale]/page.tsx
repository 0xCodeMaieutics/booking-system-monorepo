import { Button, Wordmark, cn } from "@tsami/ui";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Link2,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { type Dictionary, type Locale, contact, demoHref, dictionaries, isLocale, localePath } from "@/i18n";

const featureIcons = [CalendarCheck, MessageSquareText, ShieldCheck, CalendarClock, SlidersHorizontal, Link2];

export default async function MarketingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dictionaries[locale];

  return (
    <>
      <Header locale={locale} t={t} />
      <main>
        <Hero locale={locale} t={t} />
        <Trust t={t} />
        <Features t={t} />
        <HowItWorks t={t} />
        <AdminSection t={t} />
        <Quote t={t} />
        <Faq t={t} />
        <FinalCta locale={locale} t={t} />
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}

function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto max-w-6xl px-6", className)}>{children}</div>;
}

function DemoButton({ locale, t, size = "lg" }: { locale: Locale; t: Dictionary; size?: "default" | "lg" }) {
  return (
    <Button asChild size={size}>
      <a href={demoHref(locale)}>
        {t.cta.demo}
        <ArrowRight data-icon="inline-end" />
      </a>
    </Button>
  );
}

function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const other = locale === "ka" ? "en" : "ka";
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-canvas/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href={localePath(locale)} className="text-xl">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <a href="#features" className="hover:text-ink">
            {t.nav.features}
          </a>
          <a href="#how" className="hover:text-ink">
            {t.nav.how}
          </a>
          <a href="#faq" className="hover:text-ink">
            {t.nav.faq}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href={localePath(other)} hrefLang={other} className="text-sm text-ink-soft hover:text-ink">
            {t.otherLocale}
          </Link>
          <DemoButton locale={locale} t={t} size="default" />
        </div>
      </Container>
    </header>
  );
}

function Hero({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[36rem] max-w-4xl rounded-full bg-brand-soft/25 blur-3xl"
      />
      <Container className="grid items-center gap-14 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <div>
          <p className="inline-flex rounded-full border border-brand/20 bg-paper px-3 py-1 text-xs font-medium text-brand">
            {t.hero.eyebrow}
          </p>
          <h1 className="mt-6 text-4xl tracking-tight text-balance sm:text-5xl">{t.hero.title}</h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-ink-soft">{t.hero.body}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <DemoButton locale={locale} t={t} />
            <Button asChild size="lg" variant="ghost">
              <a href="#how">{t.cta.how}</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-ink-soft">{t.hero.note}</p>
        </div>
        <BookingMock t={t} />
      </Container>
    </section>
  );
}

function BookingMock({ t }: { t: Dictionary }) {
  const times = ["10:00", "10:30", "11:30", "13:00", "14:30", "16:00"];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-border bg-paper p-6 shadow-xl shadow-ink/5">
        <p className="font-semibold">{t.mock.clinic}</p>
        <div className="mt-5 space-y-2">
          {[t.mock.treatment, t.mock.practitioner].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3 text-sm"
            >
              {row}
              <Check className="size-4 text-brand" />
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm font-medium">{t.mock.day}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {times.map((time) => (
            <span
              key={time}
              className={cn(
                "rounded-lg border px-2 py-2 text-center text-sm tabular-nums",
                time === "11:30" ? "border-brand bg-brand text-paper" : "border-border text-ink",
              )}
            >
              {time}
            </span>
          ))}
        </div>
        <div className="mt-5 rounded-4xl bg-brand py-2.5 text-center text-sm font-medium text-paper">
          {t.mock.confirm}
        </div>
      </div>
      <div className="absolute -right-4 -bottom-8 flex max-w-64 gap-3 rounded-2xl border border-border bg-paper p-4 text-sm shadow-lg shadow-ink/10 sm:-right-10">
        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-brand" />
        <p>{t.mock.sms}</p>
      </div>
    </div>
  );
}

function Trust({ t }: { t: Dictionary }) {
  return (
    <section className="border-y border-border bg-paper/60">
      <Container className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-sm text-ink-soft">
        {t.trust.label}
        <span className="text-base font-semibold text-ink">{t.trust.clinic}</span>
        <span>· {t.trust.city}</span>
      </Container>
    </section>
  );
}

function SectionHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl tracking-tight text-balance sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-lg text-ink-soft">{body}</p>}
    </div>
  );
}

function Features({ t }: { t: Dictionary }) {
  return (
    <section id="features" className="scroll-mt-16 py-24">
      <Container>
        <SectionHeading title={t.features.title} body={t.features.body} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((item, i) => {
            const Icon = featureIcons[i] ?? Check;
            return (
              <div key={item.title} className="rounded-2xl border border-border bg-paper p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks({ t }: { t: Dictionary }) {
  return (
    <section id="how" className="scroll-mt-16 bg-paper py-24">
      <Container>
        <SectionHeading title={t.how.title} />
        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {t.how.steps.map((step, i) => (
            <li key={step.title}>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-paper">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg">{step.title}</h3>
              <p className="mt-2 text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function AdminSection({ t }: { t: Dictionary }) {
  return (
    <section className="py-24">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl tracking-tight text-balance sm:text-4xl">{t.admin.title}</h2>
          <p className="mt-4 text-lg text-ink-soft">{t.admin.body}</p>
          <ul className="mt-8 space-y-3">
            {t.admin.points.map((point) => (
              <li key={point} className="flex gap-3">
                <Check className="mt-1 size-4 shrink-0 text-brand" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden className="rounded-2xl border border-border bg-paper p-6 shadow-xl shadow-ink/5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{t.admin.day}</p>
            <Wordmark className="text-sm" />
          </div>
          <ul className="mt-5 divide-y divide-border">
            {t.admin.rows.map((row, i) => (
              <li key={row.time} className="flex items-center gap-4 py-3 text-sm">
                <span className="w-12 font-medium tabular-nums">{row.time}</span>
                <span className="flex-1">
                  <span className="block font-medium">{row.name}</span>
                  <span className="text-ink-soft">{row.treatment}</span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    i === 0 ? "bg-success/10 text-success" : "bg-brand/10 text-brand",
                  )}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function Quote({ t }: { t: Dictionary }) {
  return (
    <section className="bg-paper py-24">
      <Container>
        <figure className="mx-auto max-w-3xl text-center">
          <blockquote className="text-2xl leading-snug font-medium text-balance sm:text-3xl">
            “{t.quote.text}”
          </blockquote>
          <figcaption className="mt-6 text-ink-soft">{t.quote.author}</figcaption>
        </figure>
      </Container>
    </section>
  );
}

function Faq({ t }: { t: Dictionary }) {
  return (
    <section id="faq" className="scroll-mt-16 py-24">
      <Container className="max-w-3xl">
        <SectionHeading title={t.faq.title} />
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-paper">
          {t.faq.items.map((item) => (
            <details key={item.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FinalCta({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <section className="pb-24">
      <Container>
        <div className="rounded-3xl bg-brand px-8 py-16 text-center text-paper">
          <h2 className="text-3xl tracking-tight text-balance sm:text-4xl">{t.final.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-paper/80">{t.final.body}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <a href={demoHref(locale)}>
                {t.cta.demo}
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <span className="text-sm text-paper/80">
              {t.final.or}{" "}
              <a
                href={`tel:${contact.phone}`}
                className="font-medium text-paper underline-offset-4 hover:underline"
              >
                {contact.phoneDisplay}
              </a>
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-ink-soft">
        <p className="flex items-center gap-2">
          <Wordmark /> {t.footer.tagline}
        </p>
        <div className="flex gap-6">
          <a href={`mailto:${contact.email}`} className="hover:text-ink">
            {contact.email}
          </a>
          <Link href={localePath(locale === "ka" ? "en" : "ka")} className="hover:text-ink">
            {t.otherLocale}
          </Link>
        </div>
      </Container>
    </footer>
  );
}
