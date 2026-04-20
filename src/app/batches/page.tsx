"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Calendar, Clock, Users, MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BatchFormDialog } from "@/components/batch-form-dialog";
import { BatchDetailDialog } from "@/components/batch-detail-dialog";
import { DeleteGuardDialog } from "@/components/delete-guard-dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { fmtINR } from "@/lib/utils";
import { seriesColor } from "@/lib/chart-palette";

function BatchesPageInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [batches, setBatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailBatchId, setDetailBatchId] = React.useState<string | null>(null);
  const [detailColor, setDetailColor] = React.useState<string>("");

  const load = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .listBatches()
      .then(setBatches)
      .catch((e) => {
        const msg = e.message || "Could not load batches";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const spAdd = searchParams.get("add");
  React.useEffect(() => {
    if (spAdd !== "1") return;
    router.replace(pathname, { scroll: false });
    setEditing(null);
    setFormOpen(true);
  }, [spAdd, pathname, router]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setFormOpen(true); };
  const openDelete = (b: any) => { setDeleteTarget(b); setDeleteOpen(true); };

  const openDetail = (b: any, idx: number) => {
    setDetailBatchId(b.id);
    setDetailColor(seriesColor(idx));
    setDetailOpen(true);
  };

  const handleDelete = async ({ code }: { code: string; refundAmount: number }) => {
    if (!deleteTarget) return;
    try {
      await api.deleteBatch(deleteTarget.id, { code });
      toast.success("Batch deleted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalRevenue = batches.reduce((a, b) => a + (b.revenue || 0), 0);
  const totalStudents = batches.reduce((a, b) => a + (b.studentCount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" /> Classes
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Batches</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {batches.length} total · {totalStudents} enrolled · ₹{fmtINR(totalRevenue)} earned
          </p>
        </div>
        <Button onClick={openAdd} disabled={loading} className="rounded-full font-semibold">
          <Plus className="h-4 w-4" /> Add batch
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

      {loading && batches.length === 0 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
          <Spinner className="text-2xl" label="Refreshing" />
          <p className="text-sm">Refreshing…</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-3xl opacity-30 mb-2">✧</div>
            <h3 className="text-xl font-semibold tracking-tight text-muted-foreground mb-1">No batches yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Create a batch to start organising classes and setting default fees.
            </p>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Create Your First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b, idx) => {
            const c = seriesColor(idx);
            return (
              <article
                key={b.id}
                role="button"
                tabIndex={0}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border/55 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-border hover:shadow-md active:scale-[0.99] dark:border-border/50"
                onClick={() => openDetail(b, idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDetail(b, idx);
                  }
                }}
              >
                <div
                  className="relative h-28 w-full overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${c} 42%, hsl(var(--card))) 0%, color-mix(in srgb, ${c} 12%, hsl(var(--muted))) 55%, hsl(var(--muted) / 0.35) 100%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.22),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 drop-shadow-sm dark:text-foreground/90">
                      Class
                    </p>
                    <Badge
                      variant="secondary"
                      className="border-0 bg-background/90 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm dark:bg-background/80"
                    >
                      ₹{fmtINR(b.price)} <span className="mx-1 text-muted-foreground">·</span> {b.studentCount ?? 0} enrolled
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[17px] font-semibold leading-snug tracking-tight text-foreground">{b.name}</h3>
                      {b.schedule ? (
                        <p className="mt-1.5 flex items-start gap-2 text-[14px] text-muted-foreground">
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
                          <span className="line-clamp-2 leading-snug">{b.schedule}</span>
                        </p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full shadow-none"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Batch actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDelete(b)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {b.description ? (
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{b.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 pt-3 text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <Wallet className="h-3.5 w-3.5 opacity-70" /> ₹{fmtINR(b.revenue)}
                    </span>
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 opacity-70" />
                      {b.studentCount ?? 0} students
                    </span>
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 opacity-70" />
                      Tap for details
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <BatchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        batch={editing}
        onSaved={load}
      />
      <BatchDetailDialog
        open={detailOpen}
        onOpenChange={(v) => {
          setDetailOpen(v);
          if (!v) setDetailBatchId(null);
        }}
        batchId={detailBatchId}
        accentColor={detailColor}
        onEdit={(b) => openEdit(b)}
        onDelete={(b) => openDelete(b)}
      />
      <DeleteGuardDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete batch?"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.name}${deleteTarget.studentCount > 0 ? `. ${deleteTarget.studentCount} student${deleteTarget.studentCount === 1 ? "" : "s"} will be unassigned.` : "."} Enter special code to continue.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function BatchesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-5 py-4">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <BatchesPageInner />
    </React.Suspense>
  );
}
