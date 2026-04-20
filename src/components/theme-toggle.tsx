"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Light / dark switch — sets explicit theme (persists via settings API). */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-2.5 py-1.5 dark:bg-muted/25"
      title="Appearance"
    >
      <Sun className={cn("h-4 w-4 shrink-0 transition-colors", dark ? "text-muted-foreground" : "text-foreground")} aria-hidden />
      <Switch
        checked={dark}
        onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        className="data-[state=unchecked]:bg-muted"
      />
      <Moon className={cn("h-4 w-4 shrink-0 transition-colors", dark ? "text-foreground" : "text-muted-foreground")} aria-hidden />
    </div>
  );
}
