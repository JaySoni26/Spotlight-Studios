import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Spinners: use for **actions** (submit, delete, retry, refresh-while-list-visible) and short indeterminate waits
 * where a skeleton would not mirror real layout. For first paint of lists/dashboards, prefer `Skeleton` shimmer.
 */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} role="status" aria-label={label || "Loading"}>
      <Loader2 className="h-[1em] w-[1em] animate-spin text-primary" aria-hidden />
    </span>
  );
}

export function SpinnerBlock({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground", className)}>
      <Spinner className="text-2xl" label="Loading" />
      <p className="text-sm">Loading…</p>
    </div>
  );
}
