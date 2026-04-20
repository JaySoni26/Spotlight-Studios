"use client";

import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner } from "sonner";

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      offset="calc(0.75rem + env(safe-area-inset-top))"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "!rounded-xl !backdrop-blur-md !border !border-border/85 !shadow-lg !text-foreground",
          title: "!text-[13px] !font-semibold !leading-snug",
          description: "!text-[13px] !leading-relaxed !opacity-90",
          actionButton:
            "!bg-primary !text-primary-foreground !text-xs !font-medium !rounded-lg",
          cancelButton: "!bg-muted !text-foreground !text-xs !font-medium !rounded-lg",
          closeButton: "!bg-background/80 !text-foreground !border-border/60",
        },
      }}
    />
  );
}
