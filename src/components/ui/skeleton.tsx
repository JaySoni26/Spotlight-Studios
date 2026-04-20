import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Loading UI policy (Spotlight):
 * — Shimmer skeleton (`variant="shimmer"` or default): first paint / route load when the **layout** is known
 *   (list rows, cards, dashboard sections). Mimics content shape; prefer over spinners for empty screens.
 * — Pulse skeleton (`variant="pulse"`): same use cases; lighter motion, no shine.
 * — Spinner (`Spinner` / `SpinnerBlock`): **actions** — save/delete, retry, refresh-while-data-visible,
 *   Suspense fallbacks when there is no layout to mirror.
 */
type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "shimmer" | "pulse";
};

function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        variant === "pulse" && "animate-pulse",
        variant === "shimmer" && "relative overflow-hidden",
        variant === "shimmer" &&
          "before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.08] before:to-transparent dark:before:via-foreground/[0.14]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
