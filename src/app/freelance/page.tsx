"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Phone, BriefcaseBusiness, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EntityFormMobileHeader } from "@/components/entity-form-mobile-header";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { FreelanceDetailDialog } from "@/components/freelance-detail-dialog";
import { api } from "@/lib/api";
import { digitsOnlyPhone, fmtINR, formatINMobileDisplay, IN_MOBILE_DIGITS } from "@/lib/utils";
import { seriesColor } from "@/lib/chart-palette";

const initialForm = { client_name: "", phone: "", amount: "", work_days: "", notes: "" };

function FreelancePageInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [gigs, setGigs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [form, setForm] = React.useState(initialForm);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [detailColor, setDetailColor] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .listFreelance()
      .then(setGigs)
      .catch((e) => {
        const msg = e.message || "Could not load freelance gigs";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const spAdd = searchParams.get("add");
  React.useEffect(() => {
    if (spAdd !== "1") return;
    router.replace(pathname, { scroll: false });
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  }, [spAdd, pathname, router]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (gig: any) => {
    setEditing(gig);
    setForm({
      client_name: gig.client_name || "",
      phone: gig.phone ? digitsOnlyPhone(String(gig.phone)) : "",
      amount: String(gig.amount ?? ""),
      work_days: String(gig.work_days ?? ""),
      notes: gig.notes || "",
    });
    setOpen(true);
  };

  const openDetail = (gig: any, idx: number) => {
    setDetailId(gig.id);
    setDetailColor(seriesColor(idx));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) return toast.error("Client name is required");
    const phoneDigits = digitsOnlyPhone(form.phone);
    if (phoneDigits.length > 0 && phoneDigits.length !== IN_MOBILE_DIGITS) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_name: form.client_name.trim(),
        phone: phoneDigits || null,
        amount: Number(form.amount) || 0,
        work_days: Number(form.work_days) || 1,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await api.updateFreelance(editing.id, payload);
        toast.success("Freelance gig updated");
      } else {
        await api.createFreelance(payload);
        toast.success("Freelance gig added");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (gig: any) => {
    try {
      await api.deleteFreelance(gig.id);
      setDetailId(null);
      toast.success("Freelance gig removed");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalAmount = gigs.reduce((acc, gig) => acc + (gig.amount || 0), 0);
  const totalDays = gigs.reduce((acc, gig) => acc + (gig.work_days || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" /> Gigs
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Freelance</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">
            Client work like stays on Airbnb — browse cards, open details, edit in place.
          </p>
        </div>
        <Button onClick={openCreate} disabled={loading} className="rounded-full font-semibold shrink-0">
          <Plus className="h-4 w-4" /> New gig
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="overflow-hidden rounded-xl border-border/60 shadow-sm">
          <CardHeader className="space-y-1 p-4 pb-3 sm:p-5 sm:pb-3">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Gigs
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight">{gigs.length}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 text-xs leading-snug text-muted-foreground sm:px-5 sm:pb-5">
            Active engagements
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-xl border-border/60 shadow-sm">
          <CardHeader className="space-y-1 p-4 pb-3 sm:p-5 sm:pb-3">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total billed
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight text-[hsl(var(--gold))]">
              ₹{fmtINR(totalAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 text-xs leading-snug text-muted-foreground sm:px-5 sm:pb-5">
            Client payouts
          </CardContent>
        </Card>
        <Card className="col-span-2 overflow-hidden rounded-xl border-border/60 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Days booked</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{totalDays}</p>
            </div>
            <p className="max-w-[14rem] text-right text-xs leading-snug text-muted-foreground sm:text-left">
              Total days of work across every gig in your list.
            </p>
          </div>
        </Card>
      </div>

      {loading && gigs.length === 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="col-span-2 h-24 rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full max-w-xl rounded-xl" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
          <Spinner className="text-2xl" label="Refreshing" />
          <p className="text-sm">Refreshing…</p>
          <Skeleton className="h-40 w-full max-w-xl" />
        </div>
      ) : gigs.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="py-16 text-center">
            <BriefcaseBusiness className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="font-medium text-base">No gigs yet</p>
            <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
              Add a client to start tracking. Everything saves to your database and shows on the dashboard.
            </p>
            <Button onClick={openCreate}>Add gig</Button>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">All gigs</h2>
            <span className="text-sm tabular-nums text-muted-foreground">{gigs.length} places</span>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10">
            {gigs.map((gig, idx) => {
              const c = seriesColor(idx);
              const phoneDisp = gig.phone ? formatINMobileDisplay(digitsOnlyPhone(String(gig.phone))) : "";
              return (
                <article
                  key={gig.id}
                  role="button"
                  tabIndex={0}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card text-left text-card-foreground shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openDetail(gig, idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetail(gig, idx);
                    }
                  }}
                >
                  <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted/40">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(165deg, color-mix(in srgb, ${c} 22%, hsl(var(--muted))) 0%, hsl(var(--muted) / 0.35) 100%)`,
                      }}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,255,255,0.18),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,255,255,0.05),transparent_55%)]" />
                    <div className="absolute right-3 top-3 rounded-lg border border-border/40 bg-background/95 px-2.5 py-1 text-sm font-semibold tabular-nums text-foreground shadow-sm backdrop-blur-sm dark:bg-background/90">
                      ₹{fmtINR(gig.amount)}
                      <span className="text-muted-foreground"> / {gig.work_days} {gig.work_days === 1 ? "day" : "days"}</span>
                    </div>
                  </div>
                  <div className="border-t border-border/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="truncate text-[15px] font-semibold leading-snug tracking-tight">{gig.client_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {phoneDisp ? (
                            <span className="inline-flex items-center gap-1.5 tabular-nums">
                              <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
                              {phoneDisp}
                            </span>
                          ) : (
                            <span>No phone</span>
                          )}
                        </p>
                        {gig.notes ? (
                          <p className="line-clamp-2 pt-1 text-[13px] leading-relaxed text-muted-foreground">{gig.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(gig)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={() => remove(gig)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-sm font-medium text-foreground">
                      <span className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
                        Show details
                        <ChevronRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" mobilePage>
          <EntityFormMobileHeader
            title={editing ? "Edit gig" : "New gig"}
            onBack={() => setOpen(false)}
          />
          <DialogHeader className="hidden sm:flex text-left sm:text-left">
            <DialogTitle>{editing ? "Edit freelance gig" : "Add freelance gig"}</DialogTitle>
            <DialogDescription>Client, payout, and duration. Saved to the database on submit.</DialogDescription>
          </DialogHeader>
          <p className="text-[15px] text-muted-foreground max-sm:mt-0 max-sm:mb-2 max-sm:px-0 sm:hidden leading-relaxed">
            Client, amount, and work days.
          </p>
          <form
            className="max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:gap-0 sm:space-y-4"
            onSubmit={save}
          >
            <div className="space-y-4 max-sm:space-y-5 max-sm:min-h-0 max-sm:flex-1 max-sm:overflow-y-auto max-sm:overscroll-contain max-sm:px-0.5 max-sm:pb-6 max-sm:pt-0">
            <div className="space-y-2">
              <Label htmlFor="client-name" variant="form">
                Client name
              </Label>
              <Input
                id="client-name"
                className="text-sm"
                value={form.client_name}
                onChange={(e) => setForm((prev) => ({ ...prev, client_name: e.target.value }))}
                placeholder="Client or company name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone" variant="form">
                  Phone
                </Label>
                <Input
                  id="phone"
                  className="text-sm tabular-nums"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={11}
                  placeholder="98765 43210"
                  value={formatINMobileDisplay(form.phone)}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: digitsOnlyPhone(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" variant="form">
                  Amount (₹)
                </Label>
                <Input
                  id="amount"
                  className="text-sm"
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="days" variant="form">
                Days of work
              </Label>
              <Input
                id="days"
                className="text-sm"
                type="number"
                min={1}
                value={form.work_days}
                onChange={(e) => setForm((prev) => ({ ...prev, work_days: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" variant="form">
                Notes
              </Label>
              <Textarea
                id="notes"
                className="text-sm min-h-[88px]"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            </div>
            <DialogFooter className="max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:mt-auto max-sm:grid max-sm:grid-cols-2 max-sm:gap-3 max-sm:border-t max-sm:border-border/50 max-sm:bg-background max-sm:px-5 max-sm:pt-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)] dark:max-sm:shadow-[0_-8px_28px_-8px_rgba(0,0,0,0.35)] sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pt-2 sm:pb-0 sm:shadow-none">
              <Button
                type="button"
                variant="outline"
                className="max-sm:h-12 max-sm:w-full max-sm:rounded-full max-sm:border-border/70 max-sm:text-[15px] max-sm:font-semibold"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="max-sm:h-12 max-sm:w-full max-sm:rounded-full max-sm:text-[15px] max-sm:font-semibold gap-2"
              >
                {saving ? (
                  <>
                    <Spinner className="text-base" />
                    Saving…
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Add gig"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FreelanceDetailDialog
        open={!!detailId}
        onOpenChange={(v) => {
          if (!v) setDetailId(null);
        }}
        gigId={detailId}
        accentColor={detailColor}
        onEdit={(g) => openEdit(g)}
        onDelete={(g) => remove(g)}
      />
    </div>
  );
}

export default function FreelancePage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 py-4">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      }
    >
      <FreelancePageInner />
    </React.Suspense>
  );
}
