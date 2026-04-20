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
import { endDateOf, fmtDate, fmtINR, today } from "@/lib/utils";
import { Calendar, Info } from "lucide-react";

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
        phone: student.phone || "",
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

  const endPreview = form.start_date && form.validity_days
    ? endDateOf(form.start_date, Number(form.validity_days))
    : null;

  const handleBatchChange = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    setForm((f) => ({
      ...f,
      batch_id: batchId,
      // Auto-fill amount from batch price only if currently empty
      amount: !f.amount && batch ? String(batch.price) : f.amount,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.start_date) { toast.error("Start date required"); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {editing ? "Edit Student" : "New Student"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "Update the student's details below." : "Enter details to enrol a new student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Aanya Sharma" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="98765 43210" />
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={form.batch_id || "none"} onValueChange={(v) => handleBatchChange(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount Paid (₹)</Label>
                {customAmount && <Badge variant="warning" className="text-[10px]">Custom</Badge>}
              </div>
              <Input id="amount" type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
              {selectedBatch && (
                <p className="text-[11px] text-muted-foreground">
                  Batch default ₹{fmtINR(batchPrice)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity">Validity (days)</Label>
              <Input id="validity" type="number" min={1} value={form.validity_days} onChange={(e) => setForm((f) => ({ ...f, validity_days: e.target.value }))} />
              <p className="text-[11px] text-muted-foreground">e.g. 30 for a month</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start">Start Date</Label>
            <Input id="start" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything to remember about this student..." />
          </div>

          {endPreview && (
            <div className="rounded-md border bg-muted/40 p-3 flex items-start gap-3">
              <Calendar className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Membership ends on <span className="text-primary">{fmtDate(endPreview)}</span></p>
                {form.amount && <p className="text-xs text-muted-foreground mt-0.5">Fee recorded: ₹{fmtINR(Number(form.amount))}</p>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editing ? "Save Changes" : "Enrol Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
