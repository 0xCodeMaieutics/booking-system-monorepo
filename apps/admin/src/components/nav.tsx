"use client";

import { Button, cn, Wordmark } from "@tsami/ui";
import {
  CalendarDaysIcon,
  CalendarOffIcon,
  SettingsIcon,
  ShieldUserIcon,
  StethoscopeIcon,
  SyringeIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/", label: "ვიზიტები", icon: CalendarDaysIcon },
  { href: "/practitioners", label: "სპეციალისტები", icon: StethoscopeIcon },
  { href: "/treatments", label: "პროცედურები", icon: SyringeIcon },
  { href: "/time-off", label: "არასამუშაო დრო", icon: CalendarOffIcon },
  { href: "/patients", label: "პაციენტები", icon: UsersIcon },
  { href: "/admins", label: "ადმინისტრატორები", icon: ShieldUserIcon },
  { href: "/settings", label: "პარამეტრები", icon: SettingsIcon },
];

export function Nav({ adminName, clinicName }: { adminName: string; clinicName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = (href: string) =>
    href === "/" ? pathname === "/" || pathname === "/new" : pathname.startsWith(href);

  return (
    <aside className="flex flex-col gap-6 border-b border-ink/10 bg-paper px-4 py-6 md:w-60 md:border-r md:border-b-0">
      <div className="flex flex-col gap-0.5 px-3">
        <Wordmark className="text-xl" />
        <span className="text-xs text-ink-soft">{clinicName}</span>
      </div>
      <nav className="flex flex-wrap gap-1 md:flex-col">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm",
              active(l.href)
                ? "bg-mist font-medium text-ink"
                : "text-ink-soft hover:bg-mist/60 hover:text-ink",
            )}
          >
            <l.icon aria-hidden className="size-4 shrink-0" />
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2 px-3 text-sm">
        <span className="text-ink-soft">{adminName}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await authClient.signOut();
            router.replace("/sign-in");
          }}
        >
          გასვლა
        </Button>
      </div>
    </aside>
  );
}
