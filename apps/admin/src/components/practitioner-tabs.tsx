"use client";

import { cn } from "@tsami/ui";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

const tabs = [
  { segment: "details", label: "ინფორმაცია" },
  { segment: "schedule", label: "სამუშაო განრიგი" },
  { segment: "time-off", label: "არასამუშაო დრო" },
];

export function PractitionerTabs({ practitionerId }: { practitionerId: string }) {
  const segment = useSelectedLayoutSegment();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-ink/10">
      {tabs.map((t) => (
        <Link
          key={t.segment}
          href={`/practitioners/${practitionerId}/${t.segment}`}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm",
            segment === t.segment
              ? "border-ink font-medium text-ink"
              : "border-transparent text-ink-soft hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
