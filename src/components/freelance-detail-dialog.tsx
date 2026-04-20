"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { digitsOnlyPhone, fmtINR, formatINMobileDisplay } from "@/lib/utils";
import { BriefcaseBusiness, Pencil, Phone, Trash2 } from "lucide-react";
import { FreelanceDetailSkeleton } from "@/components/detail-sheet-skeleton";
import { cn } from "@/lib/utils";

interface FreelanceDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gigId: string | null;
  accentColor?: string;
  onEdit: (g: any) => void;
  onDelete: (g: any) => void;
}

export function FreelanceDetailDialog({ open, onOpenChange, gigId, accentColor, onEdit, onDelete }: FreelanceDetailDialogProps) {
  const [gig, setGig] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !gigId) {
      setGig(null);
      return;
    }
    setLoading(true);
    api
      .getFreelance(gigId)
      .then(setGig)
      .catch((e) => {
        toast.error(e.message);
        setGig(null);
      })
      .finally(() => setLoading(false));
  }, [open, gigId]);

  if (!gigId) return null;

  const showSkeleton = loading || !gig;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[min(92dvh,100%-1rem)] gap-0 overflow-y-auto overflow-x-hidden rounded-t-2xl p-0 sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border-border/60 sm:shadow-xl",
        )}
      >
        <div className="px-5 pb-2 pt-5 sm:px-8 sm:pb-3 sm:pt-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Freelance</p>
          <DialogHeader className="mt-2 space-y-0">
            <div className="flex items-start gap-3 pr-8 sm:pr-10">
              {showSkeleton ? (
                <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              ) : (
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--gold)/0.28)]"
                  style={{
                    color: accentColor || "hsl(var(--gold))",
                    backgroundColor: accentColor
                      ? `color-mix(in srgb, ${accentColor} 18%, transparent)`
                      : "hsl(var(--gold-muted))",
                  }}
                >
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-1 text-left">
                {showSkeleton ? (
                  <>
                    <Skeleton className="h-8 w-[min(100%,13rem)]" />
                    <Skeleton className="h-4 w-40" />
                  </>
                ) : (
                  <>
                    <DialogTitle className="pr-0 text-2xl font-semibold leading-tight tracking-tight">{gig.client_name}</DialogTitle>
                    <DialogDescription className="text-left text-[15px] text-muted-foreground">Payout and work days</DialogDescription>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 sm:px-8">
          {showSkeleton ? (
            <FreelanceDetailSkeleton className="pb-2" />
          ) : (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-transparent bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                  ₹{fmtINR(gig.amount)}
                </Badge>
                <Badge variant="outline" className="font-medium">
                  {gig.work_days} work days
                </Badge>
              </div>
              {gig.phone && (
                <p className="flex items-center gap-2.5 text-[15px] text-muted-foreground tabular-nums">
                  <Phone className="h-4 w-4 shrink-0 opacity-80" /> {formatINMobileDisplay(digitsOnlyPhone(String(gig.phone)))}
                </p>
              )}
              <Separator className="bg-border/60" />
              {gig.notes && (
                <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
                  <p className="text-[13px] font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">{gig.notes}</p>
                </div>
              )}
              <p className="text-[13px] text-muted-foreground">
                Added {new Date(gig.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <p className="text-xs text-muted-foreground/90">ID · {gig.id.slice(0, 8)}…</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-border/50 bg-muted/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
          {showSkeleton ? (
            <>
              <Skeleton className="h-11 w-full rounded-full sm:w-28" />
              <Skeleton className="h-11 w-full rounded-full sm:w-28" />
              <Skeleton className="h-11 w-full rounded-full sm:max-w-[10rem]" />
            </>
          ) : (
            gig && (
              <>
                <Button variant="outline" className="h-11 rounded-full border-border/70 font-semibold sm:min-w-[7rem]" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  variant="secondary"
                  className="h-11 rounded-full font-semibold sm:min-w-[7rem]"
                  onClick={() => {
                    onEdit(gig);
                    onOpenChange(false);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  className="h-11 rounded-full font-semibold sm:min-w-[7rem]"
                  onClick={() => {
                    onDelete(gig);
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
