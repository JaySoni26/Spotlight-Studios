"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityFormMobileHeader } from "@/components/entity-form-mobile-header";
import { api } from "@/lib/api";
import { endDateOf, fmtDate, fmtINR, daysUntil } from "@/lib/utils";
import { format, addDays, parseISO } from "date-fns";
import { CalendarDays, ChevronRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface RenewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: any;
  batches: any[];
  onSaved: () => void;
}

export function RenewDialog({ open, onOpenChange, student, batches, onSaved }: RenewDialogProps) {
  const [days, setDays] = React.useState("30");
  const [amount, setAmount] = React.useState("");
  const [extendFrom, setExtendFrom] = React.useState<"current_end" | "today">("current_end");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [loading, setLoading] = React.useState(false);

  const batch = batches.find((b) => b.id === student?.batch_id);
  const currentEnd = student ? endDateOf(student.start_date, student.validity_days) : null;
  const isExpired = currentEnd ? daysUntil(currentEnd) < 0 : false;
  const totalPaidRecorded = Number(student?.amount) || 0;
  const renewalPayment = Number(amount) || 0;
  const totalAfterRenewal = totalPaidRecorded + renewalPayment;

  React.useEffect(() => {
    if (!open || !student) return;
    setDays("30");
    setAmount(batch ? String(batch.price) : "");
    setExtendFrom(isExpired ? "today" : "current_end");
    setPaymentMethod("cash");
  }, [open, student, batch, isExpired]);

  const projectedEnd = React.useMemo(() => {
    if (!student || !days || !currentEnd) return null;
    const today = new Date();
    const endDateObj = parseISO(currentEnd);
    const baseDate = extendFrom === "today" || endDateObj < today ? today : endDateObj;
    return format(addDays(baseDate, Number(days)), "yyyy-MM-dd");
  }, [student, days, currentEnd, extendFrom]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!days || Number(days) <= 0) {
      toast.error("Enter validity days");
      return;
    }
    setLoading(true);
    try {
      await api.renewStudent(student.id, {
        additional_days: Number(days),
        additional_amount: renewalPayment,
        payment_method: paymentMethod,
        extend_from: extendFrom,
      });
      toast.success(`${student.name} renewed until ${fmtDate(projectedEnd)}`);
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to renew");
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        mobilePage
        className={cn(
          "gap-0 sm:!flex sm:!max-w-[440px] sm:!flex-col sm:!overflow-hidden sm:rounded-2xl sm:border sm:border-border sm:shadow-xl sm:gap-0 sm:!p-0",
        )}
      >
        <EntityFormMobileHeader title="Renew membership" onBack={() => onOpenChange(false)} />

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col sm:max-h-[min(90vh,760px)]"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-1 sm:px-6 sm:pb-5 sm:pt-6">
            <DialogHeader className="hidden space-y-2 text-left sm:block sm:pr-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">Renew membership</DialogTitle>
              <DialogDescription className="text-[15px] leading-relaxed">
                Extend dates and record the payment for <span className="font-medium text-foreground">{student.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <p className="text-[15px] leading-relaxed text-muted-foreground sm:hidden">
              Extend dates and record payment for <span className="font-medium text-foreground">{student.name}</span>.
            </p>

            {/* Total paid — same field the roster uses; renew adds to this total */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-sm dark:bg-muted/10">
              <div className="relative aspect-[21/9] min-h-[7.5rem] w-full bg-gradient-to-br from-muted/80 via-background to-muted/40 dark:from-muted/30 dark:via-card dark:to-muted/20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.06),transparent_55%)]" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total paid to date</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">₹{fmtINR(totalPaidRecorded)}</p>
                    <p className="mt-1 max-w-[14rem] text-[12px] leading-snug text-muted-foreground">
                      Stored on this student — initial fee plus every renewal you save.
                    </p>
                  </div>
                  <div className="rounded-full border border-border/50 bg-background/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm dark:bg-background/80">
                    <Receipt className="mb-0.5 inline h-3.5 w-3.5 opacity-70" aria-hidden /> Record
                  </div>
                </div>
              </div>
              <div className="space-y-3 border-t border-border/50 px-4 py-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Current end</span>
                  <span className="font-medium tabular-nums">{fmtDate(currentEnd)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      "font-medium",
                      isExpired ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {isExpired ? `Expired ${Math.abs(daysUntil(currentEnd!))}d ago` : `${daysUntil(currentEnd!)}d left`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Label className="text-[13px] font-medium">Extend from</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setExtendFrom("current_end")}
                  disabled={isExpired}
                  className={cn(
                    "flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                    extendFrom === "current_end"
                      ? "border-primary bg-primary/[0.07] shadow-sm"
                      : "border-border/60 bg-card hover:border-border",
                    isExpired && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className="text-[15px] font-semibold">After current end</span>
                  <span className="mt-1 text-[13px] leading-snug text-muted-foreground">
                    {isExpired ? "Not available — membership already ended" : "Stack time on their existing expiry"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setExtendFrom("today")}
                  className={cn(
                    "flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                    extendFrom === "today"
                      ? "border-primary bg-primary/[0.07] shadow-sm"
                      : "border-border/60 bg-card hover:border-border",
                  )}
                >
                  <span className="text-[15px] font-semibold">From today</span>
                  <span className="mt-1 text-[13px] leading-snug text-muted-foreground">New period starting now</span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rdays" className="text-[13px] font-medium">
                  Days to add
                </Label>
                <Input
                  id="rdays"
                  type="number"
                  min={1}
                  className="h-11 rounded-xl border-border/70"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ramt" className="text-[13px] font-medium">
                  Payment (₹)
                </Label>
                <Input
                  id="ramt"
                  type="number"
                  min={0}
                  className="h-11 rounded-xl border-border/70"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Payment method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11 rounded-xl border-border/70">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {projectedEnd && (
              <div className="mt-6 rounded-2xl border border-border/55 bg-card px-4 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[13px] font-medium text-muted-foreground">New end date</p>
                    <p className="text-lg font-semibold tabular-nums text-foreground">{fmtDate(projectedEnd)}</p>
                  </div>
                </div>
                <Separator className="my-4 bg-border/60" />
                <div className="space-y-2.5 text-[14px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Total paid to date</span>
                    <span className="tabular-nums">₹{fmtINR(totalPaidRecorded)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">This renewal</span>
                    <span className="tabular-nums">₹{fmtINR(renewalPayment)}</span>
                  </div>
                  <Separator className="my-1 bg-border/50" />
                  <div className="flex justify-between gap-4 font-semibold">
                    <span>New total recorded</span>
                    <span className="tabular-nums text-foreground">₹{fmtINR(totalAfterRenewal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-auto grid grid-cols-1 gap-3 border-t border-border/50 bg-muted/10 px-5 py-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-5">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full border-border/70 font-semibold sm:min-w-[7.5rem]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-12 rounded-full font-semibold gap-2 sm:min-w-[10rem]">
              {loading ? "Saving…" : "Confirm renewal"}
              {!loading ? <ChevronRight className="h-4 w-4 opacity-80" aria-hidden /> : null}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
