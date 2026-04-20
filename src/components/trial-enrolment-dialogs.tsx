"use client";
import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntityFormMobileHeader } from "@/components/entity-form-mobile-header";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/utils";
import { addDays, format, parseISO } from "date-fns";
import { CalendarRange, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrialExtendDialog({
  open,
  onOpenChange,
  student,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: any | null;
  onSaved: () => void;
}) {
  const [extraDays, setExtraDays] = React.useState("7");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) setExtraDays("7");
  }, [open]);

  const previewEnd =
    student?.trial_end_date && extraDays
      ? format(addDays(parseISO(student.trial_end_date), Number(extraDays) || 0), "yyyy-MM-dd")
      : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !Number(extraDays) || Number(extraDays) <= 0) return toast.error("Enter days to add");
    setLoading(true);
    try {
      await api.extendTrial(student.id, { additional_days: Number(extraDays) });
      toast.success(`Trial extended to ${fmtDate(previewEnd)}`);
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Could not extend trial");
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        mobilePage
        className={cn("gap-0 sm:!max-w-[400px] sm:!rounded-2xl sm:!border sm:!p-0 sm:!shadow-xl")}
      >
        <EntityFormMobileHeader title="Extend trial" onBack={() => onOpenChange(false)} />
        <form onSubmit={submit} className="flex flex-col gap-0 sm:max-h-[min(85vh,640px)]">
          <div className="space-y-5 px-5 pb-4 pt-2 sm:px-6 sm:pt-4">
            <DialogHeader className="hidden text-left sm:block">
              <DialogTitle className="text-xl font-semibold">Extend trial</DialogTitle>
              <DialogDescription className="text-[15px] leading-relaxed">
                Add more days for <span className="font-medium text-foreground">{student.name}</span> before they convert.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-border/55 bg-muted/20 p-4 dark:bg-muted/10">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Current trial ends</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{fmtDate(student.trial_end_date)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra-days" className="text-[13px] font-medium">
                Extra days
              </Label>
              <Input
                id="extra-days"
                type="number"
                min={1}
                className="h-11 rounded-xl"
                value={extraDays}
                onChange={(e) => setExtraDays(e.target.value)}
              />
            </div>
            {previewEnd && (
              <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
                <CalendarRange className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-[13px] font-medium text-muted-foreground">New trial end</p>
                  <p className="text-lg font-semibold tabular-nums">{fmtDate(previewEnd)}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-border/50 bg-muted/10 px-5 py-4 sm:justify-end sm:px-6">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-full gap-2">
              {loading ? <Spinner className="text-base" /> : null}
              {loading ? "Saving…" : "Extend trial"}
              {!loading ? <ChevronRight className="h-4 w-4 opacity-70" aria-hidden /> : null}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConvertToPaidDialog({
  open,
  onOpenChange,
  student,
  batches,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: any | null;
  batches: any[];
  onSaved: () => void;
}) {
  const batch = batches.find((b) => b.id === student?.batch_id);
  const [amount, setAmount] = React.useState("");
  const [validityDays, setValidityDays] = React.useState("30");
  const [startDate, setStartDate] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !student) return;
    setAmount(batch ? String(batch.price) : "");
    setValidityDays("30");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
  }, [open, student, batch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!Number(amount) || Number(amount) <= 0) {
      toast.error("Enter the payment amount");
      return;
    }
    setLoading(true);
    try {
      await api.convertTrialToPaid(student.id, {
        amount: Number(amount),
        validity_days: Number(validityDays) || 30,
        start_date: startDate,
      });
      toast.success(`${student.name} is now on a paid membership`);
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Could not convert");
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        mobilePage
        className={cn("gap-0 sm:!max-w-[440px] sm:!rounded-2xl sm:!border sm:!p-0 sm:!shadow-xl")}
      >
        <EntityFormMobileHeader title="Start paid membership" onBack={() => onOpenChange(false)} />
        <form onSubmit={submit}>
          <div className="max-h-[min(75dvh,560px)] space-y-5 overflow-y-auto px-5 pb-4 pt-2 sm:px-6 sm:pt-4">
            <DialogHeader className="hidden text-left sm:block">
              <DialogTitle className="text-xl font-semibold">Convert from trial</DialogTitle>
              <DialogDescription className="text-[15px] leading-relaxed">
                Record first payment and membership length for <span className="font-medium text-foreground">{student.name}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 to-background p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Trial ended / ending</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Their trial window was tracked separately. This step starts paid dates and fees.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Payment (₹)</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-11 rounded-xl"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Validity (days)</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-11 rounded-xl"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Paid membership starts</Label>
              <Input type="date" className="h-11 rounded-xl" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="border-t border-border/50 bg-muted/10 px-5 py-4 sm:justify-end sm:px-6">
            <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-full gap-2 font-semibold">
              {loading ? <Spinner className="text-base" /> : null}
              {loading ? "Saving…" : "Convert & save"}
              {!loading ? <ChevronRight className="h-4 w-4 opacity-70" aria-hidden /> : null}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
