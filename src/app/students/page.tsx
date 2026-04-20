"use client";
import * as React from "react";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, UserPlus, Filter, X, Phone, ArrowRightLeft, CalendarCheck, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StudentFormDialog } from "@/components/student-form-dialog";
import { BatchChangeDialog } from "@/components/batch-change-dialog";
import { RenewDialog } from "@/components/renew-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api } from "@/lib/api";
import { fmtDate, fmtINR, getInitials, getStatus } from "@/lib/utils";

function statusBadge(status: { key: string; label: string }) {
  const variantMap: Record<string, any> = {
    active: "success", expiring: "warning", critical: "danger", expired: "muted",
  };
  return <Badge variant={variantMap[status.key]}>{status.label}</Badge>;
}

export default function StudentsPage() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [batches, setBatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
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

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([api.listStudents(), api.listBatches()])
      .then(([s, b]) => { setStudents(s); setBatches(b); })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // Enrich + filter
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .map((s) => ({ ...s, status: getStatus(s.end_date) }))
      .filter((s) => {
        if (q && !s.name.toLowerCase().includes(q) && !(s.phone || "").toLowerCase().includes(q)) return false;
        if (batchFilter !== "all") {
          if (batchFilter === "none" && s.batch_id) return false;
          if (batchFilter !== "none" && s.batch_id !== batchFilter) return false;
        }
        if (statusFilter !== "all") {
          if (statusFilter === "expiring_soon" && !(s.status.key === "critical" || s.status.key === "expiring")) return false;
          if (statusFilter !== "expiring_soon" && s.status.key !== statusFilter) return false;
        }
        return true;
      })
      .sort((a, b) => a.status.days - b.status.days);
  }, [students, query, batchFilter, statusFilter]);

  const activeFilters = (batchFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

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

  const handleDelete = async () => {
    if (!deleteStudent) return;
    try {
      await api.deleteStudent(deleteStudent.id);
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
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight italic text-primary">Students</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {students.length} total · {filtered.length} showing
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone…"
            className="pl-9"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              <SelectItem value="none">Unassigned</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring soon</SelectItem>
              <SelectItem value="critical">Critical (≤3d)</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="icon" onClick={() => { setBatchFilter("all"); setStatusFilter("all"); }} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-3xl opacity-30 mb-2">○</div>
            <h3 className="font-display italic text-xl text-muted-foreground mb-1">
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
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="bg-primary/10 text-primary">{getInitials(s.name)}</Avatar>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          {s.notes && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{s.notes}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.phone || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {s.batch_name ? (
                        <Badge variant="outline">{s.batch_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-display italic text-primary text-right">₹{fmtINR(s.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(s.start_date)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(s.end_date)}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell>
                      <StudentActions
                        student={s}
                        onEdit={openEdit}
                        onBatchChange={openBatchChange}
                        onRenew={openRenew}
                        onDelete={openDelete}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((s) => (
              <Card key={s.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="bg-primary/10 text-primary flex-shrink-0">{getInitials(s.name)}</Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{s.name}</p>
                          {s.phone && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" /> {s.phone}
                            </p>
                          )}
                        </div>
                        <StudentActions
                          student={s}
                          onEdit={openEdit}
                          onBatchChange={openBatchChange}
                          onRenew={openRenew}
                          onDelete={openDelete}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.batch_name && <Badge variant="outline" className="text-[10px]">{s.batch_name}</Badge>}
                        {statusBadge(s.status)}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
                        </span>
                        <span className="font-display italic text-primary">₹{fmtINR(s.amount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student?"
        description={deleteStudent ? `This will permanently remove ${deleteStudent.name}. This can't be undone.` : ""}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function StudentActions({ student, onEdit, onBatchChange, onRenew, onDelete }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onRenew(student)}>
          <CalendarCheck className="h-4 w-4" /> Renew membership
        </DropdownMenuItem>
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
