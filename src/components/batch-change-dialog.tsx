"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { fmtINR, fmtDate } from "@/lib/utils";
import { ArrowRight, Clock } from "lucide-react";

interface BatchChangeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: any;
  batches: any[];
  onSaved: () => void;
}

export function BatchChangeDialog({ open, onOpenChange, student, batches, onSaved }: BatchChangeDialogProps) {
  const [toBatchId, setToBatchId] = React.useState<string>("");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<any[]>([]);

  const currentBatch = batches.find((b) => b.id === student?.batch_id);
  const targetBatch = batches.find((b) => b.id === toBatchId);

  React.useEffect(() => {
    if (!open || !student) return;
    setToBatchId("");
    setNote("");
    // Load history
    api.getBatchHistory(student.id).then(setHistory).catch(() => setHistory([]));
  }, [open, student]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBatchId) { toast.error("Select a target batch"); return; }
    if (toBatchId === student.batch_id) { toast.error("Student is already in this batch"); return; }
    setLoading(true);
    try {
      await api.changeStudentBatch(student.id, {
        to_batch_id: toBatchId === "none" ? null : toBatchId,
        note: note.trim() || null,
      });
      toast.success("Batch changed");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Change Batch</DialogTitle>
          <DialogDescription>
            Move <span className="font-medium text-foreground">{student.name}</span> to a different batch. A record will be kept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">From</p>
              <p className="font-medium truncate">{currentBatch?.name || "No batch"}</p>
              {currentBatch && <p className="text-xs text-muted-foreground">₹{fmtINR(currentBatch.price)}</p>}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">To</p>
              <p className="font-medium truncate">
                {toBatchId === "none" ? "No batch" : targetBatch?.name || "—"}
              </p>
              {targetBatch && <p className="text-xs text-muted-foreground">₹{fmtINR(targetBatch.price)}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select new batch</Label>
            <Select value={toBatchId} onValueChange={setToBatchId}>
              <SelectTrigger><SelectValue placeholder="Choose a batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No batch (unassign)</SelectItem>
                {batches.filter((b) => b.id !== student.batch_id).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} · ₹{fmtINR(b.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for the change..." />
          </div>

          {history.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Batch History
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="text-xs bg-muted/40 rounded p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-muted-foreground truncate">{h.from_batch_name || "—"}</span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium truncate">{h.to_batch_name || "No batch"}</span>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">{fmtDate(new Date(h.changed_at).toISOString())}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !toBatchId}>
              {loading ? "Moving..." : "Change Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
