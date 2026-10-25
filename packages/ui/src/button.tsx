import type { ButtonHTMLAttributes } from "react";

import { cn } from "./lib/utils";

const variants = {
  primary: "bg-brand text-paper hover:bg-ink",
  secondary: "border border-ink/15 bg-paper text-ink hover:border-ink/40",
  ghost: "text-ink-soft hover:bg-mist hover:text-ink",
  danger: "bg-danger text-paper hover:bg-danger/85",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        size === "sm" ? "h-8 px-3 text-sm" : "h-11 px-5",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
