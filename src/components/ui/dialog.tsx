"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  hideMobileHandle?: boolean;
  /** Small screens: full-screen step using app background; scroll body + pinned actions in forms. */
  mobilePage?: boolean;
};

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, hideMobileHandle, mobilePage, ...props }, ref) => (
    <DialogPortal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          mobilePage
            ? "bg-black/20 backdrop-blur-[2px] dark:bg-black/45 dark:backdrop-blur-md"
            : "bg-black/55 backdrop-blur-sm dark:bg-black/65",
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          /* Slightly above overlay so the sheet always paints on top; `inset-0` on mobile pins the full-screen step. */
          "fixed z-[51] w-full border-0 text-foreground shadow-none duration-200 outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          mobilePage
            ? [
                /* Full-viewport step: must pin with inset-0 — without it, fixed + w-full has no box and only the blur shows. */
                /* No overflow-hidden on mobile — avoids clipping focus rings / shadows; scroll lives in form body. */
                "max-sm:inset-0 max-sm:flex max-sm:h-dvh max-sm:max-h-dvh max-sm:min-h-0 max-sm:flex-col max-sm:gap-0 max-sm:rounded-none max-sm:bg-background max-sm:px-5 max-sm:pb-0 max-sm:pt-[env(safe-area-inset-top)] max-sm:shadow-none",
                "max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom",
              ]
            : [
                "grid gap-5 bg-popover text-popover-foreground",
                "inset-x-0 bottom-0 top-auto max-h-[min(92dvh,100%-env(safe-area-inset-top))] translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto overflow-x-hidden shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.55)]",
                "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
              ],
          "sm:grid sm:gap-5 sm:bg-popover sm:text-popover-foreground",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border sm:border-border sm:px-6 sm:pt-7 sm:pb-6 sm:shadow-lg",
          "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {!hideMobileHandle && !mobilePage ? (
          <div className="sm:hidden mx-auto mb-1 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/20" aria-hidden />
        ) : null}
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 sm:top-4 rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none max-sm:top-[max(0.75rem,env(safe-area-inset-top))] z-20 sm:z-auto",
            mobilePage && "max-sm:hidden",
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1 text-center sm:text-left", className)} {...props} />
);
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0", className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl sm:text-2xl font-semibold leading-tight tracking-tight text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-prose", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
