"use client";

import { Button, cn, Wordmark } from "@tsami/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/", label: "ვიზიტები" },
  { href: "/practitioners", label: "სპეციალისტები" },
  { href: "/treatments", label: "პროცედურები" },
  { href: "/time-off", label: "არასამუშაო დრო" },
  { href: "/patients", label: "პაციენტები" },
  { href: "/admins", label: "ადმინისტრატორები" },
  { href: "/settings", label: "პარამეტრები" },
];

export function Nav({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="flex flex-col gap-6 border-b border-ink/10 bg-paper px-4 py-6 md:w-60 md:border-r md:border-b-0">
      <div className="flex flex-col gap-0.5 px-3">
        <Wordmark className="text-xl" />
        <span className="text-xs text-ink-soft">ესთეტიკის ცენტრი ფეისი</span>
      </div>
      <nav className="flex flex-wrap gap-1 md:flex-col">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              active(l.href)
                ? "bg-mist font-medium text-ink"
                : "text-ink-soft hover:bg-mist/60 hover:text-ink",
            )}
          >
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
