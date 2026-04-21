"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn, digitsOnlyPhone, fmtDate, formatINMobileDisplay, fmtINR, getInitials, getStatus, isTrialStudent } from "@/lib/utils";
import { batchAccentColor, trialEnrollmentChipStyles } from "@/lib/chart-palette";
import { ArrowRightLeft, CalendarCheck, CalendarPlus, CalendarOff, Pencil, Trash2, Phone } from "lucide-react";
import { LeaveHistoryList } from "@/components/student-leave-dialog";
import { StudentDetailSkeleton } from "@/components/detail-sheet-skeleton";

function statusBadgeVariant(status: { key: string; label: string }) {
  if (status.key === "expired") return "danger" as const;
  if (status.key === "critical" || status.key === "expiring") return "warning" as const;
  return "success" as const;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <div className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{children}</div>
    </div>
  );
}

interface StudentDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string | null;
  batches?: { id: string }[];
  onEdit: (s: any) => void;
  onRenew: (s: any) => void;
  onExtendTrial?: (s: any) => void;
  onConvertToPaid?: (s: any) => void;
  onBatchChange: (s: any) => void;
  onLeave: (s: any) => void;
  onDelete: (s: any) => void;
}

export function StudentDetailDialog({
  open,
  onOpenChange,
  studentId,
  batches = [],
  onEdit,
  onRenew,
  onExtendTrial,
  onConvertToPaid,
  onBatchChange,
  onLeave,
  onDelete,
}: StudentDetailDialogProps) {
  const [student, setStudent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const loadStudent = React.useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    api
      .getStudent(studentId)
      .then(setStudent)
      .catch((e) => {
        toast.error(e.message);
        setStudent(null);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  React.useEffect(() => {
    if (!open || !studentId) {
      setStudent(null);
      return;
    }
    loadStudent();
  }, [open, studentId, loadStudent]);

  if (!studentId) return null;
  const status = student ? getStatus(student.end_date) : null;
  const showSkeleton = loading || !student;
  const accent = student ? batchAccentColor(student.batch_id, batches) : "hsl(var(--primary))";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "!p-0 max-h-[min(92dvh,100%-1rem)] gap-0 overflow-y-auto overflow-x-hidden rounded-t-2xl sm:max-h-[85vh] sm:max-w-lg sm:!p-0 sm:rounded-2xl sm:border-border/60 sm:shadow-xl",
        )}
      >
        <div className="px-4 pb-2 pt-5 sm:px-5 sm:pb-3 sm:pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Student</p>
          <DialogHeader className="mt-2 space-y-0 text-left sm:text-left">
            <div className="flex items-start gap-3 pr-8 sm:pr-10">
              {showSkeleton ? (
                <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
              ) : (
                <Avatar
                  className="h-14 w-14 shrink-0 rounded-2xl border-2 text-base font-semibold shadow-inner"
                  style={{
                    borderColor: `color-mix(in srgb, ${accent} 50%, hsl(var(--border)))`,
                    backgroundColor: `color-mix(in srgb, ${accent} 16%, hsl(var(--muted) / 0.45))`,
                    color: accent,
                  }}
                >
                  {getInitials(student.name)}
                </Avatar>
              )}
              <div className="min-w-0 flex-1 space-y-1 text-left">
                {showSkeleton ? (
                  <>
                    <Skeleton className="h-8 w-[min(100%,12rem)]" />
                    <Skeleton className="h-4 w-32" />
                  </>
                ) : (
                  <>
                    <DialogTitle className="text-left text-2xl font-semibold leading-tight tracking-tight text-foreground">
                      {student.name}
                    </DialogTitle>
                    <DialogDescription className="text-left text-[15px] text-muted-foreground">
                      Membership, fees, and contact
                    </DialogDescription>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-4 sm:px-5">
          {showSkeleton ? (
            <StudentDetailSkeleton className="pb-2" />
          ) : (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {isTrialStudent(student) ? (
                  <span
                    className="rounded-md border px-2 py-0.5 text-xs font-semibold"
                    style={trialEnrollmentChipStyles(student.batch_id, batches)}
                  >
                    Trial
                  </span>
                ) : null}
                {status && <Badge variant={statusBadgeVariant(status)}>{status.label}</Badge>}
                {student.batch_name ? (
                  <Badge variant="outline">{student.batch_name}</Badge>
                ) : (
                  <Badge variant="muted">Unassigned</Badge>
                )}
              </div>
              {student.phone && (
                <p className="flex items-center gap-2.5 text-[15px] text-muted-foreground tabular-nums">
                  <Phone className="h-4 w-4 shrink-0 opacity-80" /> {formatINMobileDisplay(digitsOnlyPhone(String(student.phone)))}
                </p>
              )}
              <Separator className="bg-border/60" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div className="col-span-2 rounded-xl border border-border/50 bg-muted/15 px-3.5 py-3 dark:bg-muted/10">
                  <Stat label={isTrialStudent(student) ? "Fees recorded (trial)" : "Total paid to date"}>
                    ₹{fmtINR(student.amount)}
                  </Stat>
                  <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                    {isTrialStudent(student)
                      ? "Trials stay at ₹0 until you convert to paid. Then payments and renewals add here."
                      : "Running total — initial fee plus every renewal you record."}
                  </p>
                </div>
                <Stat label={isTrialStudent(student) ? "Trial length (days)" : "Validity"}>
                  {student.validity_days} days
                </Stat>
                <Stat label={isTrialStudent(student) ? "Trial started" : "Start"}>{fmtDate(student.start_date)}</Stat>
                <div className="col-span-2">
                  <Stat label={isTrialStudent(student) ? "Trial ends" : "Ends"}>{fmtDate(student.end_date)}</Stat>
                </div>
              </div>
              {student.notes && (
                <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
                  <p className="text-[13px] font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">{student.notes}</p>
                </div>
              )}
              <LeaveHistoryList leaves={student.leaves} studentId={student.id} onChanged={loadStudent} />
              <p className="text-xs text-muted-foreground/90">ID · {student.id.slice(0, 8)}…</p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3 border-t border-border/50 bg-muted/10 px-4 py-4 sm:px-5">
          {showSkeleton ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-11 rounded-full" />
                <Skeleton className="h-11 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-11 rounded-full" />
                <Skeleton className="h-11 rounded-full" />
              </div>
              <Skeleton className="h-11 w-full rounded-full" />
            </>
          ) : (
            student && (
              <>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Membership</p>
                  {isTrialStudent(student) ? (
                    <div className="grid grid-cols-2 gap-2">
                      {onExtendTrial ? (
                        <Button
                          variant="secondary"
                          className={cn(
                            "h-11 w-full justify-center gap-2 rounded-full font-semibold",
                            !onConvertToPaid && "col-span-2",
                          )}
                          onClick={() => {
                            onExtendTrial(student);
                            onOpenChange(false);
                          }}
                        >
                          <CalendarPlus className="h-4 w-4 shrink-0" /> Extend trial
                        </Button>
                      ) : null}
                      {onConvertToPaid ? (
                        <Button
                          variant="default"
                          className={cn(
                            "h-11 w-full justify-center gap-2 rounded-full font-semibold",
                            !onExtendTrial && "col-span-2",
                          )}
                          onClick={() => {
                            onConvertToPaid(student);
                            onOpenChange(false);
                          }}
                        >
                          <CalendarCheck className="h-4 w-4 shrink-0" /> Convert to paid
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="default"
                        className="h-11 w-full justify-center gap-2 rounded-full font-semibold"
                        onClick={() => {
                          onRenew(student);
                          onOpenChange(false);
                        }}
                      >
                        <CalendarCheck className="h-4 w-4 shrink-0" /> Renew
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-11 w-full justify-center gap-2 rounded-full font-semibold"
                        onClick={() => {
                          onLeave(student);
                          onOpenChange(false);
                        }}
                      >
                        <CalendarOff className="h-4 w-4 shrink-0" /> Leave
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Record</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-center gap-2 rounded-full border-border/70 font-semibold"
                      onClick={() => {
                        onBatchChange(student);
                        onOpenChange(false);
                      }}
                    >
                      <ArrowRightLeft className="h-4 w-4 shrink-0" /> Batch
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-center gap-2 rounded-full border-border/70 font-semibold"
                      onClick={() => {
                        onEdit(student);
                        onOpenChange(false);
                      }}
                    >
                      <Pencil className="h-4 w-4 shrink-0" /> Edit
                    </Button>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="h-11 w-full justify-center gap-2 rounded-full font-semibold"
                  onClick={() => {
                    onDelete(student);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 shrink-0" /> Delete student
                </Button>
              </>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
