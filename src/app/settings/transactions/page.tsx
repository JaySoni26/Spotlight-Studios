"use client";
import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { fmtINR } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TransactionsAuditPage() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    api
      .listTransactions()
      .then(setItems)
      .catch((e) => toast.error(e.message || "Could not load transactions"))
      .finally(() => setLoading(false));
  }, []);

  const updateMode = async (id: string, payment_method: "cash" | "online") => {
    setSavingId(id);
    try {
      const updated: any = await api.updateTransaction(id, { payment_method });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, payment_method: updated.payment_method } : it)));
      toast.success("Payment mode updated");
    } catch (e: any) {
      toast.error(e.message || "Could not update payment mode");
    } finally {
      setSavingId(null);
    }
  };

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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Transaction audit log</h1>
          <p className="text-[15px] text-muted-foreground">Complete student payment trail for mobile and desktop.</p>
        </div>
      </header>

      <Card className="plain overflow-hidden rounded-2xl border-border/55 shadow-sm">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>All transactions</CardTitle>
              <CardDescription>Newest first</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-5 pb-6 sm:px-6 sm:pb-6">
          {loading ? (
            [...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            items.map((txn) => (
              <div key={txn.id} className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{txn.student_name || "Student"}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(txn.action).replaceAll("_", " ")}
                      {` · ${(txn.payment_method || "cash").replaceAll("_", " ")}`}
                    </p>
                    {txn.note ? <p className="text-xs text-muted-foreground">{txn.note}</p> : null}
                    {txn.amount > 0 ? (
                      <div className="mt-2 max-w-[9rem]">
                        <Select
                          value={txn.payment_method || "cash"}
                          onValueChange={(v: "cash" | "online") => updateMode(txn.id, v)}
                          disabled={savingId === txn.id}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-semibold tabular-nums ${txn.amount < 0 ? "text-destructive" : "text-primary"}`}>
                      {txn.amount < 0 ? "-" : "+"}₹{fmtINR(Math.abs(txn.amount))}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{new Date(txn.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
