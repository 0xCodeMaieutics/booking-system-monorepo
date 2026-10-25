import { cn } from "cn";
import { UsersIcon } from "lucide-react";
import * as React from "react";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

/**
 * A round photo, falling back to the name's initials. Without a name or photo it shows
 * a group icon, for choices that stand for several people such as Any Practitioner.
 */
function Avatar({ src, name, className }: { src?: string | null; name?: string; className?: string }) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist text-base font-medium text-ink-soft select-none",
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : name ? (
        <span aria-hidden>{initials(name)}</span>
      ) : (
        <UsersIcon aria-hidden className="size-1/2" />
      )}
    </span>
  );
}

export { Avatar };
