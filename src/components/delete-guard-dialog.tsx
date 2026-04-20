"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntityFormMobileHeader } from "@/components/entity-form-mobile-header";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteGuardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  requireRefund?: boolean;
  onConfirm: (values: { code: string; refundAmount: number }) => Promise<void> | void;
}

export function DeleteGuardDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  requireRefund = false,
  onConfirm,
}: DeleteGuardDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [refundAmount, setRefundAmount] = React.useState("0");

  React.useEffect(() => {
    if (!open) {
      setCode("");
      setRefundAmount("0");
    }
  }, [open]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({ code, refundAmount: Number(refundAmount) || 0 });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        mobilePage
        className={cn(
          "p-0 sm:!flex sm:!max-w-[440px] sm:!flex-col sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-border/60 sm:shadow-xl",
        )}
      >
        <EntityFormMobileHeader title={title} onBack={() => onOpenChange(false)} />

        <div className="flex min-h-0 flex-1 flex-col sm:max-h-[min(90vh,720px)]">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-2 pt-1 sm:px-8 sm:pb-4 sm:pt-6">
            <DialogHeader className="hidden space-y-2 text-left sm:block sm:pr-8">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
                  <AlertTriangle className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 space-y-1.5">
                  <DialogTitle className="text-2xl font-semibold leading-tight tracking-tight">{title}</DialogTitle>
                  <DialogDescription className="text-left text-[15px] leading-relaxed">{description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div
              className="flex gap-3 rounded-2xl border border-destructive/25 bg-destructive/[0.07] px-3.5 py-3 sm:hidden dark:bg-destructive/10"
              role="status"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" strokeWidth={2} aria-hidden />
              <p className="text-[15px] leading-relaxed text-foreground/90">{description}</p>
            </div>

            <div className="space-y-5">
              {requireRefund && (
                <div className="space-y-2">
                  <Label htmlFor="refund-amount" variant="form">
                    Refund amount (₹)
                  </Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    className="text-base sm:text-sm"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="special-code" variant="form">
                  Special code
                </Label>
                <Input
                  id="special-code"
                  placeholder="Enter your delete code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="off"
                  className="text-base sm:text-sm"
                />
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  This is the code from Settings → Delete protection. Default is often 0000 until you change it.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-auto grid grid-cols-2 gap-3 border-t border-border/50 bg-muted/15 px-5 py-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:gap-2 sm:px-8 sm:py-5">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full border-border/70 font-semibold sm:min-w-[7.5rem]"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12 gap-2 rounded-full font-semibold sm:min-w-[7.5rem]"
              disabled={loading || !code.trim()}
              onClick={handleConfirm}
            >
              {loading ? <Spinner className="text-base" /> : null}
              {loading ? "Working…" : confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
