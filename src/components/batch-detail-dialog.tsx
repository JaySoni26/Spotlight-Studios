"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Pencil, Trash2, Users, Wallet } from "lucide-react";
import { fmtINR } from "@/lib/utils";
import { api } from "@/lib/api";
import { BatchDetailSkeleton } from "@/components/detail-sheet-skeleton";
import { cn } from "@/lib/utils";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <div className="text-lg font-semibold tracking-tight text-foreground tabular-nums">{children}</div>
    </div>
  );
}

interface BatchDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  batchId: string | null;
  accentColor?: string;
  onEdit: (b: any) => void;
  onDelete: (b: any) => void;
}

export function BatchDetailDialog({ open, onOpenChange, batchId, accentColor, onEdit, onDelete }: BatchDetailDialogProps) {
  const [batch, setBatch] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    api
      .getBatch(batchId)
      .then(setBatch)
      .catch((e) => {
        toast.error(e.message);
        setBatch(null);
      })
      .finally(() => setLoading(false));
  }, [batchId]);

  React.useEffect(() => {
    if (!open || !batchId) {
      setBatch(null);
      return;
    }
    load();
  }, [open, batchId, load]);

  if (!batchId) return null;

  const showSkeleton = loading || !batch;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[min(92dvh,100%-1rem)] gap-0 overflow-y-auto overflow-x-hidden rounded-t-2xl p-0 sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border-border/60 sm:shadow-xl",
        )}
      >
        <div className="px-5 pb-2 pt-5 sm:px-8 sm:pb-3 sm:pt-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Class batch</p>
          <DialogHeader className="mt-2 space-y-0">
            <div className="flex items-start gap-3 pr-8 sm:pr-10">
              {showSkeleton ? (
                <Skeleton className="mt-1 h-10 w-1 shrink-0 rounded-full" />
              ) : (
                <span
                  className="mt-1 h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: accentColor || "hsl(var(--primary))" }}
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1 space-y-1 text-left">
                {showSkeleton ? (
                  <>
                    <Skeleton className="h-8 w-[min(100%,14rem)]" />
                    <Skeleton className="h-4 w-48" />
                  </>
                ) : (
                  <>
                    <DialogTitle className="pr-0 text-2xl font-semibold leading-tight tracking-tight">{batch.name}</DialogTitle>
                    <DialogDescription className="text-left text-[15px] text-muted-foreground">
                      Schedule, roster size, and revenue
                    </DialogDescription>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 sm:px-8">
          {showSkeleton ? (
            <BatchDetailSkeleton className="pb-2" />
          ) : (
            <div className="space-y-5 text-sm">
              {batch.schedule && (
                <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/15 px-3.5 py-3 text-[15px] text-muted-foreground">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                  <p className="leading-relaxed">{batch.schedule}</p>
                </div>
              )}
              {batch.description && <p className="text-[15px] leading-relaxed text-foreground/90">{batch.description}</p>}
              <Separator className="bg-border/60" />
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Price">₹{fmtINR(batch.price)}</Stat>
                <Stat label="Students">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 opacity-70" /> {batch.studentCount ?? 0}
                  </span>
                </Stat>
                <Stat label="Earned">
                  <span className="flex items-center gap-1.5 text-[hsl(var(--gold))]">
                    <Wallet className="h-4 w-4 opacity-80" /> ₹{fmtINR(batch.revenue)}
                  </span>
                </Stat>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 opacity-80" />
                Created {new Date(batch.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </div>
              <Badge variant="outline" className="border-[hsl(var(--gold)/0.35)] text-xs font-medium text-foreground/85">
                ID · {batch.id.slice(0, 8)}…
              </Badge>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-border/50 bg-muted/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
          {showSkeleton ? (
            <>
              <Skeleton className="h-11 w-full rounded-full sm:w-28" />
              <Skeleton className="h-11 w-full rounded-full sm:w-28" />
              <Skeleton className="h-11 w-full rounded-full sm:flex-1 sm:max-w-[10rem]" />
            </>
          ) : (
            batch && (
              <>
                <Button variant="outline" className="h-11 rounded-full border-border/70 font-semibold sm:min-w-[7rem]" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  variant="secondary"
                  className="h-11 rounded-full font-semibold sm:min-w-[7rem]"
                  onClick={() => {
                    onEdit(batch);
                    onOpenChange(false);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  className="h-11 rounded-full font-semibold sm:min-w-[7rem]"
                  onClick={() => {
                    onDelete(batch);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
