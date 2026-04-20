"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Mobile step header — matches main app shell bar (card + blur); margin clears content from the border. */
export function EntityFormMobileHeader({ title, onBack, className }: { title: string; onBack: () => void; className?: string }) {
  return (
    <header
      className={cn(
        "sm:hidden sticky top-0 z-20 -mx-5 flex h-14 shrink-0 items-center gap-1 border-b border-border/55 px-2 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,backdrop-filter,border-color]",
        "bg-card/90 shadow-[0_1px_0_hsl(var(--border)/0.35)] dark:bg-card/85 dark:border-border/40",
        "supports-[backdrop-filter]:bg-card/82 dark:supports-[backdrop-filter]:bg-card/78",
        "max-sm:mb-4",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full text-foreground hover:bg-muted/80"
        onClick={onBack}
        aria-label="Back"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
      </Button>
      <h2 className="min-w-0 flex-1 truncate pr-2 text-left text-[17px] font-semibold leading-snug tracking-tight text-foreground">
        {title}
      </h2>
    </header>
  );
}
