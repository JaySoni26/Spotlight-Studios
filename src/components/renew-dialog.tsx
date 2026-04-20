"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { endDateOf, fmtDate, fmtINR, daysUntil } from "@/lib/utils";
import { format, addDays, parseISO } from "date-fns";
import { CalendarCheck, TrendingUp } from "lucide-react";
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
  const [loading, setLoading] = React.useState(false);

  const batch = batches.find((b) => b.id === student?.batch_id);
  const currentEnd = student ? endDateOf(student.start_date, student.validity_days) : null;
  const isExpired = currentEnd ? daysUntil(currentEnd) < 0 : false;

  React.useEffect(() => {
    if (!open || !student) return;
    setDays("30");
    setAmount(batch ? String(batch.price) : "");
    // If expired, default to start from today
    setExtendFrom(isExpired ? "today" : "current_end");
  }, [open, student, batch, isExpired]);

  // Calculate projected new end date
  const projectedEnd = React.useMemo(() => {
    if (!student || !days || !currentEnd) return null;
    const today = new Date();
    const endDateObj = parseISO(currentEnd);
    const baseDate = extendFrom === "today" || endDateObj < today ? today : endDateObj;
    return format(addDays(baseDate, Number(days)), "yyyy-MM-dd");
  }, [student, days, currentEnd, extendFrom]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!days || Number(days) <= 0) { toast.error("Enter validity days"); return; }
    setLoading(true);
    try {
      await api.renewStudent(student.id, {
        additional_days: Number(days),
        additional_amount: Number(amount) || 0,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Renew Membership</DialogTitle>
          <DialogDescription>
            Extend the membership for <span className="font-medium text-foreground">{student.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current Ends</p>
                <p className="font-medium">{fmtDate(currentEnd)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</p>
                <p className={cn("font-medium", isExpired ? "text-red-500" : "text-emerald-500")}>
                  {isExpired ? `Expired ${Math.abs(daysUntil(currentEnd!))}d ago` : `${daysUntil(currentEnd!)}d left`}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Extend from</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExtendFrom("current_end")}
                disabled={isExpired}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm text-left transition-colors",
                  extendFrom === "current_end" ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                  isExpired && "opacity-50 cursor-not-allowed",
                )}
              >
                <p className="font-medium text-xs">Current End Date</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isExpired ? "Not available (expired)" : "Extend from existing expiry"}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setExtendFrom("today")}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm text-left transition-colors",
                  extendFrom === "today" ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                )}
              >
                <p className="font-medium text-xs">Reset to Today</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Start fresh from today</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rdays">Additional Days</Label>
              <Input id="rdays" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ramt">Payment Received (₹)</Label>
              <Input id="ramt" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>

          {projectedEnd && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-start gap-3">
              <CalendarCheck className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm flex-1">
                <p className="font-medium">New end date: <span className="text-primary">{fmtDate(projectedEnd)}</span></p>
                {amount && Number(amount) > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Total paid will be ₹{fmtINR((student.amount || 0) + Number(amount))}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Renewing..." : "Renew Membership"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
