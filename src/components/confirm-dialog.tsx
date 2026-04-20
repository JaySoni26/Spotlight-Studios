"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", variant = "default", onConfirm }: ConfirmProps) {
  const [loading, setLoading] = React.useState(false);

  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); onOpenChange(false); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-sm:max-w-none sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="w-full gap-2 sm:justify-end">
          <Button className="max-sm:w-full sm:w-auto" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="max-sm:w-full sm:w-auto"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handle}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
