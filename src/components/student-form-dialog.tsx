"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { digitsOnlyPhone, endDateOf, fmtDate, formatINMobileDisplay, fmtINR, IN_MOBILE_DIGITS, today } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { EntityFormMobileHeader } from "@/components/entity-form-mobile-header";
import { Spinner } from "@/components/ui/spinner";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  batches: any[];
  student?: any;
  defaultBatchId?: string;
  onSaved: () => void;
}

export function StudentFormDialog({ open, onOpenChange, batches, student, defaultBatchId, onSaved }: StudentFormDialogProps) {
  const editing = !!student;
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    amount: "",
    start_date: today(),
    validity_days: "30",
    batch_id: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!open) return;
    if (student) {
      setForm({
        name: student.name || "",
        phone: student.phone ? digitsOnlyPhone(String(student.phone)) : "",
        amount: String(student.amount ?? ""),
        start_date: student.start_date || today(),
        validity_days: String(student.validity_days ?? 30),
        batch_id: student.batch_id || "",
        notes: student.notes || "",
      });
    } else {
      setForm({
        name: "",
        phone: "",
        amount: "",
        start_date: today(),
        validity_days: "30",
        batch_id: defaultBatchId || "",
        notes: "",
      });
    }
  }, [open, student, defaultBatchId]);

  const selectedBatch = batches.find((b) => b.id === form.batch_id);
  const batchPrice = selectedBatch?.price ?? 0;
  const customAmount = !!form.amount && Number(form.amount) !== batchPrice && batchPrice > 0;

  const endPreview =
    form.start_date && form.validity_days ? endDateOf(form.start_date, Number(form.validity_days)) : null;

  const handleBatchChange = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    setForm((f) => ({
      ...f,
      batch_id: batchId,
      amount: !f.amount && batch ? String(batch.price) : f.amount,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.start_date) {
      toast.error("Start date required");
      return;
    }
    const phoneDigits = digitsOnlyPhone(form.phone);
    if (phoneDigits.length > 0 && phoneDigits.length !== IN_MOBILE_DIGITS) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: phoneDigits || null,
        amount: Number(form.amount) || 0,
        start_date: form.start_date,
        validity_days: Number(form.validity_days) || 30,
        batch_id: form.batch_id || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await api.updateStudent(student.id, payload);
        toast.success("Student updated");
      } else {
        await api.createStudent(payload);
        toast.success("Student enrolled");
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const title = editing ? "Edit student" : "New student";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" mobilePage>
        <EntityFormMobileHeader title={title} onBack={() => onOpenChange(false)} />
        <DialogHeader className="hidden sm:flex text-left sm:text-left">
          <DialogTitle>{editing ? "Edit Student" : "New Student"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the student's details below." : "Enter details to enrol a new student."}
          </DialogDescription>
        </DialogHeader>
        <p className="text-[15px] text-muted-foreground max-sm:mt-0 max-sm:mb-2 max-sm:px-0 sm:hidden leading-relaxed">
          {editing ? "Update roster details." : "Enrol a new student and assign a batch."}
        </p>

        <form
          onSubmit={submit}
          className="max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:gap-0 sm:space-y-4"
        >
          <div className="space-y-4 max-sm:space-y-5 max-sm:min-h-0 max-sm:flex-1 max-sm:overflow-y-auto max-sm:overscroll-contain max-sm:px-0.5 max-sm:pb-6 max-sm:pt-0">
          <div className="space-y-2">
            <Label htmlFor="name" variant="form">
              Full name
            </Label>
            <Input
              id="name"
              className="text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Aanya Sharma"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone" variant="form">
                Phone
              </Label>
              <Input
                id="phone"
                className="text-sm tabular-nums"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={11}
                value={formatINMobileDisplay(form.phone)}
                onChange={(e) => setForm((f) => ({ ...f, phone: digitsOnlyPhone(e.target.value) }))}
                placeholder="98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label variant="form">Batch</Label>
              <Select value={form.batch_id || "none"} onValueChange={(v) => handleBatchChange(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No batch</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} · ₹{fmtINR(b.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="amount" variant="form">
                  Amount paid (₹)
                </Label>
                {customAmount && (
                  <Badge variant="warning" className="text-[10px] shrink-0">
                    Custom
                  </Badge>
                )}
              </div>
              <Input
                id="amount"
                className="text-sm"
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
              />
              {selectedBatch && (
                <p className="text-xs text-muted-foreground leading-relaxed">Batch default ₹{fmtINR(batchPrice)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity" variant="form">
                Validity (days)
              </Label>
              <Input
                id="validity"
                className="text-sm"
                type="number"
                min={1}
                value={form.validity_days}
                onChange={(e) => setForm((f) => ({ ...f, validity_days: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">e.g. 30 for a month</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start" variant="form">
              Start date
            </Label>
            <Input
              id="start"
              className="text-sm"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" variant="form">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              className="text-sm min-h-[72px]"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Anything to remember about this student..."
            />
          </div>

          {endPreview && (
            <div className="rounded-xl border border-border/50 bg-muted/40 p-3 flex items-start gap-3 max-sm:rounded-2xl">
              <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">
                  Membership ends on <span className="text-primary">{fmtDate(endPreview)}</span>
                </p>
                {form.amount && (
                  <p className="text-xs text-muted-foreground mt-0.5">Fee recorded: ₹{fmtINR(Number(form.amount))}</p>
                )}
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:mt-auto max-sm:grid max-sm:grid-cols-2 max-sm:gap-3 max-sm:border-t max-sm:border-border/50 max-sm:bg-background max-sm:px-5 max-sm:pt-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)] dark:max-sm:shadow-[0_-8px_28px_-8px_rgba(0,0,0,0.35)] sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pt-2 sm:pb-0 sm:shadow-none">
            <Button
              type="button"
              variant="outline"
              className="max-sm:h-12 max-sm:w-full max-sm:rounded-full max-sm:border-border/70 max-sm:text-[15px] max-sm:font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="max-sm:h-12 max-sm:w-full max-sm:rounded-full max-sm:text-[15px] max-sm:font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Spinner className="text-base" />
                  Saving…
                </>
              ) : editing ? (
                "Save changes"
              ) : (
                "Enrol student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
