"use client";
import * as React from "react";
import { toast } from "sonner";
import { Plus, Calendar, Clock, Users, MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BatchFormDialog } from "@/components/batch-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api } from "@/lib/api";
import { fmtINR } from "@/lib/utils";

export default function BatchesPage() {
  const [batches, setBatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    api.listBatches()
      .then(setBatches)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setFormOpen(true); };
  const openDelete = (b: any) => { setDeleteTarget(b); setDeleteOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteBatch(deleteTarget.id);
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
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight italic text-primary">Batches</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {batches.length} total · {totalStudents} enrolled · ₹{fmtINR(totalRevenue)} earned
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Batch
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-3xl opacity-30 mb-2">✧</div>
            <h3 className="font-display italic text-xl text-muted-foreground mb-1">No batches yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Create a batch to start organising classes and setting default fees.
            </p>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Create Your First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <Card key={b.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/40" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-semibold tracking-tight truncate">{b.name}</h3>
                    {b.schedule && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 font-display italic">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{b.schedule}</span>
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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

                {b.description && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{b.description}</p>
                )}

                <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                  <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Price" value={<>₹{fmtINR(b.price)}</>} accent />
                  <Stat icon={<Users className="h-3.5 w-3.5" />} label="Students" value={b.studentCount} />
                  <Stat icon={<Calendar className="h-3.5 w-3.5" />} label="Earned" value={<>₹{fmtINR(b.revenue)}</>} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BatchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        batch={editing}
        onSaved={load}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete batch?"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.name}${deleteTarget.studentCount > 0 ? `. ${deleteTarget.studentCount} student${deleteTarget.studentCount === 1 ? "" : "s"} will be unassigned.` : "."}`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Stat({ icon, label, value, accent }: any) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`font-display text-lg font-semibold tracking-tight mt-0.5 ${accent ? "text-primary italic" : ""}`}>
        {value}
      </p>
    </div>
  );
}
