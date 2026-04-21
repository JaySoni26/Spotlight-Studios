"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate, fmtINR, getInitials, getStatus, isTrialStudent, studentRefundBreakdown } from "@/lib/utils";
import { ArrowLeft, ArrowRightLeft, Calendar, CalendarCheck, CalendarOff, CalendarPlus, ChevronDown, IndianRupee, MoreHorizontal, Pencil, Timer, Trash2 } from "lucide-react";
import { StudentFormDialog } from "@/components/student-form-dialog";
import { RenewDialog } from "@/components/renew-dialog";
import { LeaveHistoryList, StudentLeaveDialog } from "@/components/student-leave-dialog";
import { BatchChangeDialog } from "@/components/batch-change-dialog";
import { DeleteGuardDialog } from "@/components/delete-guard-dialog";
import { ConvertToPaidDialog, TrialExtendDialog } from "@/components/trial-enrolment-dialogs";
import { Avatar } from "@/components/ui/avatar";
import { batchAccentColor } from "@/lib/chart-palette";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = React.useState<any>(null);
  const [batches, setBatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [paymentsOpen, setPaymentsOpen] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [renewOpen, setRenewOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [batchOpen, setBatchOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [trialExtendOpen, setTrialExtendOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [defaultRefundPercent, setDefaultRefundPercent] = React.useState(50);

  const load = React.useCallback(() => {
    if (!params?.id) return;
    setLoading(true);
    Promise.all([api.getStudent(params.id), api.listBatches()])
      .then(([s, b]) => {
        setStudent(s);
        setBatches(b);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  React.useEffect(() => {
    load();
  }, [load]);
  React.useEffect(() => {
    api
      .getSettings()
      .then((s) => setDefaultRefundPercent(Math.max(0, Math.min(100, Number(s.default_refund_percent ?? 50)))))
      .catch(() => {});
  }, []);

  const updateMode = async (id: string, payment_method: "cash" | "online") => {
    setSavingId(id);
    try {
      const updated: any = await api.updateTransaction(id, { payment_method });
      setStudent((prev: any) => ({ ...prev, payments: (prev.payments || []).map((p: any) => (p.id === id ? { ...p, payment_method: updated.payment_method } : p)) }));
      toast.success("Updated");
    } catch (e: any) {
      toast.error(e.message || "Could not update");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="space-y-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 w-full" /><Skeleton className="h-28 w-full" /></div>;
  if (!student) return <p className="text-sm text-muted-foreground">Student not found.</p>;

  const status = getStatus(student.end_date);
  const payments = student.payments || [];
  const deleteRefundInfo = studentRefundBreakdown(student);
  const accent = batchAccentColor(student.batch_id, batches);
  const monthPaidTotal = payments
    .filter((p: any) => Number(p.amount || 0) > 0)
    .filter((p: any) => {
      const dt = new Date(p.created_at);
      const now = new Date();
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-28">
      <header className="sticky top-0 z-10 -mx-4 border-b border-border/60 bg-card px-4 py-2.5 shadow-sm sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Link href="/students" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Student</p>
            <p className="text-sm font-semibold leading-tight">Profile</p>
          </div>
        </div>
      </header>
      <section className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar
                className="h-12 w-12 rounded-2xl border text-sm font-semibold"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 50%, hsl(var(--border)))`,
                  backgroundColor: `color-mix(in srgb, ${accent} 15%, hsl(var(--muted) / 0.45))`,
                  color: accent,
                }}
              >
                {getInitials(student.name)}
              </Avatar>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Student profile</p>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-3xl tracking-tight">{student.name}</CardTitle>
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: accent }}
                    aria-label="Batch color"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={status.key === "active" ? "success" : status.key === "expired" ? "danger" : "warning"}>{status.label}</Badge>
              <Badge
                variant="outline"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 45%, hsl(var(--border)))`,
                  color: accent,
                  backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
                }}
              >
                {student.batch_name || "Unassigned"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="flex items-center gap-1.5 text-muted-foreground"><IndianRupee className="h-3.5 w-3.5" /> Total paid</p>
            <p className="font-semibold">₹{fmtINR(student.amount)}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="flex items-center gap-1.5 text-muted-foreground"><Timer className="h-3.5 w-3.5" /> Validity</p>
            <p className="font-semibold">{student.validity_days} days</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Start</p>
            <p className="font-semibold">{fmtDate(student.start_date)}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> End</p>
            <p className="font-semibold">{fmtDate(student.end_date)}</p>
          </div>
        </div>

        <Separator />

        <section className="rounded-2xl border border-border/60 bg-card">
          <button
            type="button"
            onClick={() => setPaymentsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold">Payment history ({payments.length})</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${paymentsOpen ? "rotate-180" : ""}`} />
          </button>
          {paymentsOpen ? (
            <div className="border-t border-border/50">
              {payments.length === 0 ? <p className="px-1 py-2 text-xs text-muted-foreground">No entries.</p> : payments.map((p: any) => (
                <div key={p.id} className="border-b border-border/40 px-4 py-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium capitalize">{String(p.action).replaceAll("_", " ")}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                    </div>
                    <p className={`text-sm font-semibold tabular-nums ${p.amount < 0 ? "text-destructive" : "text-foreground"}`}>
                      {p.amount < 0 ? "-" : "+"}₹{fmtINR(Math.abs(p.amount || 0))}
                    </p>
                  </div>
                  {p.amount > 0 ? (
                    <div className="mt-2 max-w-[9rem]">
                      <Select value={p.payment_method || "cash"} onValueChange={(v: "cash" | "online") => updateMode(p.id, v)} disabled={savingId === p.id}>
                        <SelectTrigger className="h-8 rounded-full"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <LeaveHistoryList leaves={student.leaves} studentId={student.id} onChanged={load} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-card px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_28px_-18px_rgba(0,0,0,0.25)]">
        <div className="mx-auto max-w-4xl space-y-2">
          <div className="px-1 pb-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <p className="font-medium text-muted-foreground">Validity progress</p>
              <p className="tabular-nums text-muted-foreground">
                {Math.max(0, student.validity_days - Math.max(0, status.days))}/{student.validity_days} days used
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      ((student.validity_days - Math.max(0, Math.min(student.validity_days, status.days))) /
                        Math.max(1, student.validity_days)) *
                        100,
                    ),
                  )}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
          {!isTrialStudent(student) ? (
            <>
              <Button className="h-11 flex-1 rounded-full font-semibold" onClick={() => setRenewOpen(true)}>
                <CalendarCheck className="h-4 w-4" /> Renew
              </Button>
              <Button variant="secondary" className="h-11 flex-1 rounded-full font-semibold" onClick={() => setLeaveOpen(true)}>
                <CalendarOff className="h-4 w-4" /> Leave
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" className="h-11 flex-1 rounded-full font-semibold" onClick={() => setTrialExtendOpen(true)}>
                <CalendarPlus className="h-4 w-4" /> Extend
              </Button>
              <Button className="h-11 flex-1 rounded-full font-semibold" onClick={() => setConvertOpen(true)}>
                <CalendarCheck className="h-4 w-4" /> Convert
              </Button>
            </>
          )}
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full" onClick={() => setMoreOpen(true)}>
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">More actions</span>
          </Button>
          </div>
        </div>
      </div>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none">
          <DialogHeader>
            <DialogTitle>More actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pb-1">
            <Button
              variant="outline"
              className="h-11 w-full justify-start rounded-full font-semibold"
              onClick={() => {
                setMoreOpen(false);
                setBatchOpen(true);
              }}
            >
              <ArrowRightLeft className="h-4 w-4" /> Change batch
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full justify-start rounded-full font-semibold"
              onClick={() => {
                setMoreOpen(false);
                setEditOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" /> Edit details
            </Button>
            <Button
              variant="destructive"
              className="h-11 w-full justify-start rounded-full font-semibold"
              onClick={() => {
                setMoreOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentFormDialog open={editOpen} onOpenChange={setEditOpen} batches={batches} student={student} onSaved={load} />
      <RenewDialog open={renewOpen} onOpenChange={setRenewOpen} student={student} batches={batches} onSaved={load} />
      <StudentLeaveDialog open={leaveOpen} onOpenChange={setLeaveOpen} student={student} onSaved={load} />
      <BatchChangeDialog open={batchOpen} onOpenChange={setBatchOpen} student={student} batches={batches} onSaved={load} />
      <TrialExtendDialog open={trialExtendOpen} onOpenChange={setTrialExtendOpen} student={student} onSaved={load} />
      <ConvertToPaidDialog open={convertOpen} onOpenChange={setConvertOpen} student={student} batches={batches} onSaved={load} />
      <DeleteGuardDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student?"
        description={`This will permanently remove ${student.name}. Confirm refund and enter code.`}
        confirmLabel="Delete"
        requireRefund
        defaultRefundAmount={Math.round((Number(student.amount || 0) * defaultRefundPercent) / 100)}
        refundContext={
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4 dark:bg-muted/15">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Membership snapshot</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] tabular-nums">
              <dt className="text-muted-foreground leading-snug">Total paid this month</dt>
              <dd className="text-right">
                <span className="block font-semibold text-foreground">₹{fmtINR(monthPaidTotal)}</span>
                <span className="mt-0.5 block text-[11px] font-normal leading-snug text-muted-foreground">Calendar month to date</span>
              </dd>
              <dt className="text-muted-foreground leading-snug">Days consumed</dt>
              <dd className="text-right font-semibold text-foreground">
                {deleteRefundInfo.daysUsed} / {deleteRefundInfo.validity_days} days
              </dd>
              <dt className="text-muted-foreground leading-snug">Default refund ({defaultRefundPercent}%)</dt>
              <dd className="text-right font-semibold text-foreground">
                ₹{fmtINR(Math.round((Number(student.amount || 0) * defaultRefundPercent) / 100))}
              </dd>
            </dl>
            <p className="border-t border-border/50 pt-4 text-[12px] leading-relaxed text-muted-foreground">
              You can edit the refund amount before confirming. Default refund percentage is managed in Settings.
            </p>
          </div>
        }
        onConfirm={async ({ code, refundAmount }) => {
          await api.deleteStudent(student.id, { code, refund_amount: refundAmount });
          toast.success("Student deleted");
          router.replace("/students");
        }}
      />
    </div>
  );
}
