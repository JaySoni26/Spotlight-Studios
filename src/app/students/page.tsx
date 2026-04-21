"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, UserPlus, Filter, X, Phone, ArrowRightLeft, CalendarCheck, CalendarPlus, CalendarOff, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StudentFormDialog } from "@/components/student-form-dialog";
import { BatchChangeDialog } from "@/components/batch-change-dialog";
import { RenewDialog } from "@/components/renew-dialog";
import { DeleteGuardDialog } from "@/components/delete-guard-dialog";
import { StudentDetailDialog } from "@/components/student-detail-dialog";
import { StudentLeaveDialog } from "@/components/student-leave-dialog";
import { ConvertToPaidDialog, TrialExtendDialog } from "@/components/trial-enrolment-dialogs";
import { api } from "@/lib/api";
import { digitsOnlyPhone, fmtDate, fmtINR, formatINMobileDisplay, getInitials, getStatus, studentRefundBreakdown } from "@/lib/utils";
import { batchAccentColor, trialEnrollmentChipStyles } from "@/lib/chart-palette";

function statusBadge(status: { key: string; label: string }) {
  const variantMap: Record<string, any> = {
    active: "success", expiring: "warning", critical: "danger", expired: "muted",
  };
  return <Badge variant={variantMap[status.key]}>{status.label}</Badge>;
}

function StudentsPageInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [students, setStudents] = React.useState<any[]>([]);
  const [batches, setBatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [batchFilter, setBatchFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Dialog states
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<any>(null);
  const [batchChangeOpen, setBatchChangeOpen] = React.useState(false);
  const [batchChangeStudent, setBatchChangeStudent] = React.useState<any>(null);
  const [renewOpen, setRenewOpen] = React.useState(false);
  const [renewStudent, setRenewStudent] = React.useState<any>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteStudent, setDeleteStudent] = React.useState<any>(null);
  const [studentDetailId, setStudentDetailId] = React.useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [leaveStudent, setLeaveStudent] = React.useState<any | null>(null);
  const [trialExtendStudent, setTrialExtendStudent] = React.useState<any | null>(null);
  const [convertTrialStudent, setConvertTrialStudent] = React.useState<any | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([api.listStudents(), api.listBatches()])
      .then(([s, b]) => {
        setStudents(s);
        setBatches(b);
      })
      .catch((e) => {
        const msg = e.message || "Could not load students";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const spStudent = searchParams.get("student");
  React.useEffect(() => {
    if (spStudent) setStudentDetailId(spStudent);
  }, [spStudent]);

  const spStatus = searchParams.get("status");
  React.useEffect(() => {
    if (!spStatus) return;
    if (spStatus === "expiring_soon") setStatusFilter("expiring_soon");
    else if (spStatus === "trial") setStatusFilter("trial");
    else if (spStatus === "active") setStatusFilter("active");
    else if (spStatus === "critical") setStatusFilter("critical");
    else if (spStatus === "expired") setStatusFilter("expired");
  }, [spStatus]);

  const spAdd = searchParams.get("add");
  React.useEffect(() => {
    if (spAdd !== "1" || loading) return;
    router.replace(pathname, { scroll: false });
    if (batches.length === 0) {
      toast.error("Create a batch first");
      return;
    }
    setEditingStudent(null);
    setFormOpen(true);
  }, [spAdd, loading, batches.length, pathname, router]);

  // Enrich + filter
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = digitsOnlyPhone(query);
    return students
      .map((s) => ({ ...s, status: getStatus(s.end_date) }))
      .filter((s) => {
        const phoneDigits = s.phone ? digitsOnlyPhone(String(s.phone)) : "";
        const phoneMatch =
          !q ||
          (qDigits.length > 0 ? phoneDigits.includes(qDigits) : (s.phone || "").toLowerCase().includes(q));
        if (q && !s.name.toLowerCase().includes(q) && !phoneMatch) return false;
        if (batchFilter !== "all") {
          if (batchFilter === "none" && s.batch_id) return false;
          if (batchFilter !== "none" && s.batch_id !== batchFilter) return false;
        }
        if (statusFilter !== "all") {
          if (statusFilter === "trial") {
            if ((s.enrollment_kind || "paid") !== "trial") return false;
          } else if (statusFilter === "expiring_soon" && !(s.status.key === "critical" || s.status.key === "expiring")) {
            return false;
          } else if (
            statusFilter !== "expiring_soon" &&
            statusFilter !== "trial" &&
            s.status.key !== statusFilter
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.status.days - b.status.days);
  }, [students, query, batchFilter, statusFilter]);

  const activeFilters = (batchFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const deleteRefundInfo = React.useMemo(() => {
    if (!deleteStudent) return null;
    return studentRefundBreakdown(deleteStudent);
  }, [deleteStudent]);

  const openAdd = () => {
    if (batches.length === 0) {
      toast.error("Create a batch first");
      return;
    }
    setEditingStudent(null);
    setFormOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingStudent(s);
    setFormOpen(true);
  };

  const openBatchChange = (s: any) => {
    setBatchChangeStudent(s);
    setBatchChangeOpen(true);
  };

  const openRenew = (s: any) => {
    setRenewStudent(s);
    setRenewOpen(true);
  };

  const openDelete = (s: any) => {
    setDeleteStudent(s);
    setDeleteOpen(true);
  };

  const openLeave = (s: any) => {
    setLeaveStudent(s);
    setLeaveOpen(true);
  };

  const handleDelete = async ({ code, refundAmount }: { code: string; refundAmount: number }) => {
    if (!deleteStudent) return;
    try {
      await api.deleteStudent(deleteStudent.id, { code, refund_amount: refundAmount });
      setStudentDetailId(null);
      toast.success(`${deleteStudent.name} removed`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" /> Roster
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">
            {students.length} members · {filtered.length} showing · tap a card for the full sheet.
          </p>
        </div>
        <Button onClick={openAdd} disabled={loading} className="rounded-full font-semibold shrink-0">
          <Plus className="h-4 w-4" /> Add student
        </Button>
      </div>

      {loadError ? (
        <Card className="border-destructive/35 bg-destructive/5">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-destructive leading-relaxed">{loadError}</p>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => load()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Filters */}
      <div className="rounded-2xl border border-border/55 bg-card/40 p-3 shadow-sm backdrop-blur-sm sm:p-4 dark:bg-card/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or 10-digit mobile…"
              className="h-11 rounded-xl border-border/70 bg-background pl-10 pr-9 shadow-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-nowrap gap-2 sm:shrink-0">
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="h-11 w-full min-w-[9.5rem] rounded-xl border-border/70 sm:w-[160px]">
                <span className="flex min-w-0 items-center gap-2">
                  <Filter className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                  <SelectValue placeholder="Batch" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                <SelectItem value="none">Unassigned</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-full min-w-[9.5rem] rounded-xl border-border/70 sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring_soon">Expiring soon</SelectItem>
                <SelectItem value="critical">Critical (≤3d)</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-xl border-dashed"
                onClick={() => {
                  setBatchFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && students.length === 0 && batches.length === 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            <Skeleton className="h-10 w-[160px] rounded-xl" />
            <Skeleton className="h-10 w-[160px] rounded-xl" />
          </div>
          <div className="w-full space-y-2 max-w-2xl">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
          <Spinner className="text-2xl" label="Refreshing" />
          <p className="text-sm">Refreshing…</p>
          <div className="w-full space-y-2 max-w-2xl">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-3xl opacity-30 mb-2">○</div>
            <h3 className="text-xl font-semibold tracking-tight text-muted-foreground mb-1">
              {students.length === 0 ? "No students yet" : "No matches"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {students.length === 0 ? "Add your first student to get started." : "Try adjusting your filters."}
            </p>
            {students.length === 0 && (
              <Button onClick={openAdd} className="mt-4">
                <UserPlus className="h-4 w-4" /> Add Student
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden rounded-2xl border-border/55 shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Total paid</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const ac = batchAccentColor(s.batch_id, batches);
                  return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setStudentDetailId(s.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="border-2 font-semibold shadow-inner"
                          style={{
                            borderColor: `color-mix(in srgb, ${ac} 50%, hsl(var(--border)))`,
                            backgroundColor: `color-mix(in srgb, ${ac} 16%, hsl(var(--muted) / 0.5))`,
                            color: ac,
                          }}
                        >
                          {getInitials(s.name)}
                        </Avatar>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          {s.notes && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{s.notes}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {s.phone ? formatINMobileDisplay(digitsOnlyPhone(String(s.phone))) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.batch_name ? (
                        <Badge variant="outline">{s.batch_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-primary text-right">₹{fmtINR(s.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(s.start_date)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(s.end_date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {(s.enrollment_kind || "paid") === "trial" ? (
                          <span
                            className="inline-flex shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold"
                            style={trialEnrollmentChipStyles(s.batch_id, batches)}
                          >
                            Trial
                          </span>
                        ) : null}
                        {statusBadge(s.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StudentActions
                        student={s}
                        onEdit={openEdit}
                        onBatchChange={openBatchChange}
                        onRenew={openRenew}
                        onLeave={openLeave}
                        onDelete={openDelete}
                        onExtendTrial={(st: any) => setTrialExtendStudent(st)}
                        onConvertToPaid={(st: any) => setConvertTrialStudent(st)}
                        stopRowClick
                      />
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {filtered.map((s) => {
              const c = batchAccentColor(s.batch_id, batches);
              const phoneDisp = s.phone ? formatINMobileDisplay(digitsOnlyPhone(String(s.phone))) : "";
              return (
                <article
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer overflow-hidden rounded-xl border border-border/45 bg-muted/10 text-card-foreground shadow-none ring-1 ring-border/25 transition-all duration-200 hover:bg-muted/20 hover:ring-primary/20 hover:shadow-sm active:scale-[0.99] dark:bg-card/35 dark:ring-border/20"
                  onClick={() => setStudentDetailId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setStudentDetailId(s.id);
                    }
                  }}
                >
                  <div
                    className="h-1 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${c}, color-mix(in srgb, ${c} 55%, hsl(var(--primary))) 52%, color-mix(in srgb, ${c} 25%, transparent) 100%)`,
                    }}
                    aria-hidden
                  />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        className="h-12 w-12 shrink-0 rounded-2xl border-2 text-sm font-semibold shadow-inner"
                        style={{
                          borderColor: `color-mix(in srgb, ${c} 48%, hsl(var(--border)))`,
                          backgroundColor: `color-mix(in srgb, ${c} 14%, hsl(var(--muted) / 0.45))`,
                          color: c,
                        }}
                      >
                        {getInitials(s.name)}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Student</p>
                            <h3 className="mt-0.5 truncate text-[17px] font-semibold leading-snug tracking-tight">{s.name}</h3>
                            {phoneDisp ? (
                              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground tabular-nums">
                                <Phone className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                <span className="truncate">{phoneDisp}</span>
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-start gap-2">
                            <div className="flex scale-90 origin-top-right flex-wrap items-center gap-1 [&_.rounded-full]:shadow-sm">
                              {(s.enrollment_kind || "paid") === "trial" ? (
                                <span
                                  className="inline-flex shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold"
                                  style={trialEnrollmentChipStyles(s.batch_id, batches)}
                                >
                                  Trial
                                </span>
                              ) : null}
                              {statusBadge(s.status)}
                            </div>
                            <StudentActions
                              student={s}
                              onEdit={openEdit}
                              onBatchChange={openBatchChange}
                              onRenew={openRenew}
                              onLeave={openLeave}
                              onDelete={openDelete}
                              onExtendTrial={(st: any) => setTrialExtendStudent(st)}
                              onConvertToPaid={(st: any) => setConvertTrialStudent(st)}
                              stopRowClick
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {s.batch_name ? (
                            <Badge variant="outline" className="text-[10px] font-medium">
                              {s.batch_name}
                            </Badge>
                          ) : (
                            <Badge variant="muted" className="text-[10px]">
                              Unassigned
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 pt-3 text-[13px] text-muted-foreground">
                          <span
                            className="font-medium tabular-nums"
                            style={
                              (s.enrollment_kind || "paid") === "trial"
                                ? { color: batchAccentColor(s.batch_id, batches) }
                                : undefined
                            }
                          >
                            {(s.enrollment_kind || "paid") === "trial" ? "Trial" : `₹${fmtINR(s.amount)}`}
                          </span>
                          <span className="text-border" aria-hidden>
                            ·
                          </span>
                          <span>
                            {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Dialogs */}
      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        batches={batches}
        student={editingStudent}
        onSaved={load}
      />
      <BatchChangeDialog
        open={batchChangeOpen}
        onOpenChange={setBatchChangeOpen}
        student={batchChangeStudent}
        batches={batches}
        onSaved={load}
      />
      <RenewDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        student={renewStudent}
        batches={batches}
        onSaved={load}
      />
      <StudentDetailDialog
        open={!!studentDetailId}
        onOpenChange={(v) => {
          if (!v) {
            setStudentDetailId(null);
            const sp = new URLSearchParams(searchParams.toString());
            if (sp.has("student")) {
              sp.delete("student");
              const q = sp.toString();
              router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
            }
          }
        }}
        studentId={studentDetailId}
        batches={batches}
        onEdit={(st) => openEdit(st)}
        onRenew={(st) => openRenew(st)}
        onExtendTrial={(st) => setTrialExtendStudent(st)}
        onConvertToPaid={(st) => setConvertTrialStudent(st)}
        onBatchChange={(st) => openBatchChange(st)}
        onLeave={(st) => openLeave(st)}
        onDelete={(st) => openDelete(st)}
      />
      <TrialExtendDialog
        open={!!trialExtendStudent}
        onOpenChange={(v) => { if (!v) setTrialExtendStudent(null); }}
        student={trialExtendStudent}
        onSaved={load}
      />
      <ConvertToPaidDialog
        open={!!convertTrialStudent}
        onOpenChange={(v) => { if (!v) setConvertTrialStudent(null); }}
        student={convertTrialStudent}
        batches={batches}
        onSaved={load}
      />
      <StudentLeaveDialog
        open={leaveOpen}
        onOpenChange={(v) => {
          setLeaveOpen(v);
          if (!v) setLeaveStudent(null);
        }}
        student={leaveStudent}
        onSaved={load}
      />
      <DeleteGuardDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student?"
        description={deleteStudent ? `This will permanently remove ${deleteStudent.name}. Confirm refund amount and enter the special code.` : ""}
        confirmLabel="Delete"
        requireRefund
        defaultRefundAmount={deleteRefundInfo?.suggestedRefund}
        refundContext={
          deleteStudent && deleteRefundInfo ? (
            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4 dark:bg-muted/15">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Membership snapshot</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] tabular-nums">
                <dt className="text-muted-foreground leading-snug">This cycle (from start date)</dt>
                <dd className="text-right">
                  <span className="block font-semibold text-foreground">₹{fmtINR(deleteRefundInfo.amountThisCycle)}</span>
                  <span className="mt-0.5 block text-[11px] font-normal leading-snug text-muted-foreground">
                    {deleteRefundInfo.cycleRangeLabel}
                    {deleteRefundInfo.daysInCycleWindow > 0 ? (
                      <span className="mt-0.5 block text-[10px] text-muted-foreground/90">
                        Fee allocated to this {deleteRefundInfo.daysInCycleWindow}-day window (total ÷ validity × days in
                        window).
                      </span>
                    ) : null}
                  </span>
                </dd>
                <dt className="text-muted-foreground leading-snug">Days used</dt>
                <dd className="text-right font-semibold text-foreground">
                  {deleteRefundInfo.daysUsed} / {deleteRefundInfo.validity_days} days
                </dd>
                <dt className="text-muted-foreground leading-snug">Fee consumed</dt>
                <dd className="text-right font-semibold text-foreground">₹{fmtINR(deleteRefundInfo.consumedValue)}</dd>
              </dl>
              <p className="border-t border-border/50 pt-4 text-[12px] leading-relaxed text-muted-foreground">
                Fee is spread over full validity; each cycle is 30 days from their start date. Refund defaults to the unused
                balance.
              </p>
            </div>
          ) : null
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 py-4">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-4 w-2/3 max-w-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
          <div className="space-y-2 max-w-2xl">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <StudentsPageInner />
    </React.Suspense>
  );
}

function StudentActions({
  student,
  onEdit,
  onBatchChange,
  onRenew,
  onLeave,
  onDelete,
  onExtendTrial,
  onConvertToPaid,
  stopRowClick,
}: any) {
  const isTrial = (student.enrollment_kind || "paid") === "trial";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={stopRowClick ? (e) => e.stopPropagation() : undefined}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={stopRowClick ? (e) => e.stopPropagation() : undefined}>
        {!isTrial ? (
          <DropdownMenuItem onClick={() => onRenew(student)}>
            <CalendarCheck className="h-4 w-4" /> Renew membership
          </DropdownMenuItem>
        ) : null}
        {isTrial && onConvertToPaid ? (
          <DropdownMenuItem onClick={() => onConvertToPaid(student)}>
            <CalendarCheck className="h-4 w-4" /> Convert to paid
          </DropdownMenuItem>
        ) : null}
        {isTrial && onExtendTrial ? (
          <DropdownMenuItem onClick={() => onExtendTrial(student)}>
            <CalendarPlus className="h-4 w-4" /> Extend trial
          </DropdownMenuItem>
        ) : null}
        {!isTrial ? (
          <DropdownMenuItem onClick={() => onLeave(student)}>
            <CalendarOff className="h-4 w-4" /> Record leave
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => onBatchChange(student)}>
          <ArrowRightLeft className="h-4 w-4" /> Change batch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(student)}>
          <Pencil className="h-4 w-4" /> Edit details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(student)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
