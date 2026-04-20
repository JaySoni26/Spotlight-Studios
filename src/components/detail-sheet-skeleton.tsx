"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Shimmer layout mirroring detail sheets — use while fetching student / batch / gig. */
export function StudentDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5", className)} aria-busy aria-label="Loading details">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-[4.5rem] rounded-full" />
        <Skeleton className="h-7 w-[5.5rem] rounded-full" />
      </div>
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function BatchDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5", className)} aria-busy aria-label="Loading batch">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-1 h-10 w-1 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-7 w-[min(100%,16rem)]" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
      </div>
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-7 w-36 rounded-full" />
    </div>
  );
}

export function FreelanceDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5", className)} aria-busy aria-label="Loading gig">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-7 w-[min(100%,14rem)]" />
          <Skeleton className="h-4 w-[min(100%,12rem)]" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}
