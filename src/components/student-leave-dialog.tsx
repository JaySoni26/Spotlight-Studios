"use client";
import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api } from "@/lib/api";
import { Pencil, Trash2 } from "lucide-react";

interface StudentLeaveDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: any | null;
  onSaved: () => void;
}

export function StudentLeaveDialog({ open, onOpenChange, student, onSaved }: StudentLeaveDialogProps) {
  const [leaveDays, setLeaveDays] = React.useState("7");
  const [transferDays, setTransferDays] = React.useState("4");
  const [notes, setNotes] = React.useState("");
  const [percent, setPercent] = React.useState(50);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !student) return;
    setNotes("");
    setSaving(false);
    let cancelled = false;
    api
      .getSettings()
      .then((s) => {
        if (cancelled) return;
        const p = s.leave_transfer_percent ?? 50;
        setPercent(p);
        const ld = 7;
        setLeaveDays(String(ld));
        setTransferDays(String(Math.round((ld * p) / 100)));
      })
      .catch(() => {
        if (cancelled) return;
        const ld = 7;
        setLeaveDays(String(ld));
        setTransferDays(String(Math.round((ld * 50) / 100)));
      });
    return () => {
      cancelled = true;
    };
  }, [open, student?.id]);

  const applySuggestedTransfer = (rawLeave: string) => {
    const ld = Math.max(1, parseInt(rawLeave, 10) || 1);
    setTransferDays(String(Math.round((ld * percent) / 100)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const ld = parseInt(leaveDays, 10);
    if (!ld || ld < 1) return toast.error("Enter leave days");
    let td = parseInt(transferDays, 10);
    if (Number.isNaN(td) || td < 0) td = 0;
    td = Math.min(td, ld);
    setSaving(true);
    try {
      await api.recordStudentLeave(student.id, { leave_days: ld, transfer_days: td, notes: notes.trim() || null });
      toast.success(`Recorded ${ld} day leave · +${td} days on membership`);
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!student) return null;

  const ldNum = Math.max(1, parseInt(leaveDays, 10) || 1);
  const suggested = Math.round((ldNum * percent) / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record leave</DialogTitle>
          <DialogDescription>
            {student.name} · studio default is {percent}% of leave days credited to validity (adjust in Settings).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="leave-days" variant="form">
                Leave days
              </Label>
              <Input
                id="leave-days"
                className="text-sm"
                type="number"
                min={1}
                max={365}
                value={leaveDays}
                onChange={(e) => setLeaveDays(e.target.value)}
                onBlur={() => applySuggestedTransfer(leaveDays)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-days" variant="form">
                Days added back
              </Label>
              <Input
                id="transfer-days"
                className="text-sm"
                type="number"
                min={0}
                max={ldNum}
                value={transferDays}
                onChange={(e) => setTransferDays(e.target.value)}
              />
              <button
                type="button"
                className="text-[11px] font-medium text-primary hover:underline"
                onClick={() => setTransferDays(String(suggested))}
              >
                Use suggested ({suggested})
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-note" variant="form">
              Note (optional)
            </Label>
            <Textarea
              id="leave-note"
              className="text-sm min-h-[72px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason or dates…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save leave"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaveHistoryList({
  leaves,
  studentId,
  onChanged,
}: {
  leaves: any[] | undefined;
  /** When set with onChanged, each row can be edited or removed (student detail sheet). */
  studentId?: string;
  onChanged?: () => void;
}) {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [editRow, setEditRow] = React.useState<any | null>(null);
  const [editLeave, setEditLeave] = React.useState("");
  const [editTransfer, setEditTransfer] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const canManage = Boolean(studentId && onChanged);

  React.useEffect(() => {
    if (!editRow) return;
    setEditLeave(String(editRow.leave_days));
    setEditTransfer(String(editRow.transfer_days));
    setEditNotes(editRow.note || "");
  }, [editRow]);

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !editRow) return;
    const ld = parseInt(editLeave, 10);
    let td = parseInt(editTransfer, 10);
    if (!ld || ld < 1) return toast.error("Invalid leave days");
    if (Number.isNaN(td) || td < 0) td = 0;
    td = Math.min(td, ld);
    setSaving(true);
    try {
      await api.updateStudentLeave(studentId, editRow.id, {
        leave_days: ld,
        transfer_days: td,
        notes: editNotes.trim() || null,
      });
      toast.success("Leave updated");
      setEditRow(null);
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const rowToDelete = leaves?.find((r) => r.id === deleteId);

  if (!leaves?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent leave</p>
      <ul className="space-y-2 text-xs text-muted-foreground">
        {leaves.slice(0, 8).map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
          >
            <span className="min-w-0 leading-snug">
              {r.leave_days}d leave → +{r.transfer_days}d
              {r.note ? ` · ${r.note}` : ""}
              <span className="block tabular-nums opacity-70 mt-0.5">{format(new Date(r.created_at), "d MMM yyyy")}</span>
            </span>
            {canManage ? (
              <div className="flex shrink-0 gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  aria-label="Edit leave"
                  onClick={() => setEditRow(r)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Remove leave"
                  onClick={() => setDeleteId(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Remove this leave?"
        description={
          rowToDelete
            ? `Membership will be shortened by ${rowToDelete.transfer_days} day(s) that were credited for this entry.`
            : undefined
        }
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={async () => {
          if (!studentId || !deleteId) return;
          try {
            await api.deleteStudentLeave(studentId, deleteId);
            toast.success("Leave removed");
            setDeleteId(null);
            onChanged?.();
          } catch (e: any) {
            toast.error(e.message ?? "Could not remove leave");
            throw e;
          }
        }}
      />

      <Dialog open={!!editRow} onOpenChange={(v) => !v && setEditRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit leave</DialogTitle>
            <DialogDescription>Adjust days or note. Membership validity updates by the change in “days added back”.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-leave-days" variant="form">
                  Leave days
                </Label>
                <Input
                  id="edit-leave-days"
                  className="text-sm"
                  type="number"
                  min={1}
                  max={365}
                  value={editLeave}
                  onChange={(e) => setEditLeave(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-transfer-days" variant="form">
                  Days added back
                </Label>
                <Input
                  id="edit-transfer-days"
                  className="text-sm"
                  type="number"
                  min={0}
                  max={Math.max(1, parseInt(editLeave, 10) || 1)}
                  value={editTransfer}
                  onChange={(e) => setEditTransfer(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-leave-note" variant="form">
                Note
              </Label>
              <Textarea
                id="edit-leave-note"
                className="text-sm min-h-[64px]"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
