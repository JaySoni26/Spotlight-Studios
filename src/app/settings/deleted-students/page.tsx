"use client";
import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";
import { fmtINR } from "@/lib/utils";

export default function DeletedStudentsPage() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    api
      .listDeletedStudents()
      .then(setItems)
      .catch((e) => toast.error(e.message || "Could not load deleted students"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
      <header className="space-y-3">
        <Button asChild variant="ghost" className="w-fit rounded-full">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" /> Back to settings
          </Link>
        </Button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Deleted students</h1>
          <p className="text-[15px] text-muted-foreground">History of removed students and stored snapshot data.</p>
        </div>
      </header>

      <Card className="plain overflow-hidden rounded-2xl border-border/55 shadow-sm">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Trash2 className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Deleted student records</CardTitle>
              <CardDescription>Newest first · includes refund and saved profile snapshot</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-5 pb-6 sm:px-6 sm:pb-6">
          {loading ? (
            [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deleted students yet.</p>
          ) : (
            items.map((it) => {
              const payload = it.payload || {};
              return (
                <div key={it.id} className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{it.entity_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(it.deleted_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-destructive">Refund ₹{fmtINR(it.refund_amount || 0)}</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <p>Phone: {payload.phone || "—"}</p>
                    <p>Batch ID: {payload.batch_id || "—"}</p>
                    <p>Start: {payload.start_date || "—"}</p>
                    <p>Validity: {payload.validity_days ?? "—"} days</p>
                    <p>Total paid: ₹{fmtINR(payload.amount || 0)}</p>
                    <p>Type: {payload.enrollment_kind || "paid"}</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
