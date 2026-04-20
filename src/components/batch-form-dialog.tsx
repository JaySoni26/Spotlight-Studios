"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface BatchFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  batch?: any;
  onSaved: () => void;
}

export function BatchFormDialog({ open, onOpenChange, batch, onSaved }: BatchFormDialogProps) {
  const editing = !!batch;
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", price: "", schedule: "", description: "" });

  React.useEffect(() => {
    if (!open) return;
    if (batch) {
      setForm({
        name: batch.name || "",
        price: String(batch.price ?? ""),
        schedule: batch.schedule || "",
        description: batch.description || "",
      });
    } else {
      setForm({ name: "", price: "", schedule: "", description: "" });
    }
  }, [open, batch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        schedule: form.schedule.trim() || null,
        description: form.description.trim() || null,
      };
      if (editing) {
        await api.updateBatch(batch.id, payload);
        toast.success("Batch updated");
      } else {
        await api.createBatch(payload);
        toast.success("Batch created");
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
          <DialogTitle className="font-display text-2xl">{editing ? "Edit Batch" : "New Batch"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update batch details below." : "Create a new class batch for your studio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bname">Batch Name</Label>
            <Input id="bname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Bollywood Beginners" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bprice">Default Price Per Student (₹)</Label>
            <Input id="bprice" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="1500" />
            <p className="text-[11px] text-muted-foreground">You can still set a custom amount per student.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bsched">Schedule</Label>
            <Input id="bsched" value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} placeholder="Mon, Wed, Fri · 6:00–7:30 PM" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bdesc">Description (optional)</Label>
            <Textarea id="bdesc" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Style, level, instructor notes..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editing ? "Save Changes" : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
