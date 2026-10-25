import type { HTMLAttributes } from "react";

import { cn } from "./lib/utils";

export function Wordmark({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("font-semibold tracking-tight text-brand", className)} {...props}>
      Tsami
    </span>
  );
}
