"use client";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { Shield, Palette, Percent, Save, LogOut, ReceiptText, Trash2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const shell = "mx-auto w-full max-w-2xl space-y-8 pb-10";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteCode, setDeleteCode] = React.useState("");
  const [leavePercent, setLeavePercent] = React.useState("50");
  const [refundPercent, setRefundPercent] = React.useState("50");

  const load = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .getSettings()
      .then((data) => {
        setDeleteCode(data.delete_admin_code || "0000");
        setLeavePercent(String(data.leave_transfer_percent ?? 50));
        setRefundPercent(String(data.default_refund_percent ?? 50));
      })
      .catch((e) => {
        const msg = e.message || "Could not load settings";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (deleteCode.trim().length < 4) {
      toast.error("Delete code must be at least 4 characters");
      return;
    }
    const pct = parseInt(leavePercent, 10);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Leave transfer must be 0–100%");
      return;
    }
    const refundPct = parseInt(refundPercent, 10);
    if (Number.isNaN(refundPct) || refundPct < 0 || refundPct > 100) {
      toast.error("Default refund must be 0–100%");
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({
        delete_admin_code: deleteCode.trim(),
        leave_transfer_percent: pct,
        default_refund_percent: refundPct,
      });
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className={shell}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-9 w-48 max-w-full rounded-lg" />
          <Skeleton className="h-5 w-full max-w-md rounded-md" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={shell}>
        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Preferences</h1>
          <p className="text-[15px] text-muted-foreground">Security and membership defaults for your studio.</p>
        </header>
        <Card className="border-destructive/30 bg-destructive/[0.06] plain">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-destructive">{loadError}</p>
            <Button variant="outline" className="rounded-full font-semibold" onClick={() => load()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={shell}>
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Account & studio</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Airbnb-style simple controls, audit access, and security defaults.
        </p>
      </header>

      <Card className="plain overflow-hidden rounded-2xl border-border/55 shadow-sm">
        <CardHeader className="space-y-3 p-5 sm:p-8 sm:pb-5">
          <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">Audit & records</CardTitle>
          <CardDescription className="text-[15px] leading-relaxed">
            Open full pages for transaction history and deleted students.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pb-6 sm:px-8 sm:pb-8">
          <Link
            href="/settings/transactions"
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 hover:bg-muted/35"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <ReceiptText className="h-4 w-4" />
              </span>
              <span>
                <p className="text-sm font-semibold">Transaction audit log</p>
                <p className="text-xs text-muted-foreground">Payments, renewals, refunds, methods</p>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/deleted-students"
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 hover:bg-muted/35"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Trash2 className="h-4 w-4" />
              </span>
              <span>
                <p className="text-sm font-semibold">Deleted students</p>
                <p className="text-xs text-muted-foreground">Deleted records, refunds, saved snapshots</p>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card className="plain overflow-hidden rounded-2xl border-border/55 shadow-sm">
        <CardHeader className="space-y-3 p-5 sm:p-8 sm:pb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Palette className="h-5 w-5 text-foreground" strokeWidth={2} />
            </span>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">Appearance</CardTitle>
              <CardDescription className="text-[15px] leading-relaxed">
                Light or dark mode. Saved automatically and synced with this device.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="rounded-2xl border border-border/50 bg-muted/25 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <ThemeToggle />
                <p className="text-[15px] text-muted-foreground">
                  {theme === "system" ? "Following your device" : theme === "dark" ? "Dark" : "Light"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full border-border/70 font-semibold"
                onClick={() => setTheme("system")}
              >
                Use system theme
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="plain overflow-hidden rounded-2xl border-border/55 shadow-sm">
        <CardHeader className="space-y-3 p-5 sm:p-8 sm:pb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Shield className="h-5 w-5 text-foreground" strokeWidth={2} />
            </span>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">Studio code</CardTitle>
              <CardDescription className="text-[15px] leading-relaxed">
                Sign in to Spotlight and confirm deletes (students / batches). Default is <strong className="font-semibold text-foreground">0000</strong>{" "}
                until you change it — use something stronger in production.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="space-y-2">
            <Label htmlFor="delete-code" variant="form">
              Access code
            </Label>
            <Input
              id="delete-code"
              value={deleteCode}
              onChange={(e) => setDeleteCode(e.target.value)}
              placeholder="Minimum 4 characters"
              className="text-base sm:text-sm"
            />
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              This is the code on the login screen and when deleting data.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="plain overflow-hidden rounded-2xl border-border/55 shadow-sm">
        <CardHeader className="space-y-3 p-5 sm:p-8 sm:pb-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Percent className="h-5 w-5 text-foreground" strokeWidth={2} />
            </span>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">Student leave</CardTitle>
              <CardDescription className="text-[15px] leading-relaxed">
                When you record leave, this share of those days is added back to membership. You can override per entry on the form.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="space-y-2">
            <Label htmlFor="leave-pct" variant="form">
              Transfer to validity (%)
            </Label>
            <Input
              id="leave-pct"
              type="number"
              min={0}
              max={100}
              value={leavePercent}
              onChange={(e) => setLeavePercent(e.target.value)}
              className="max-w-[12rem] text-base sm:text-sm"
            />
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Example: at 50%, 10 days of leave → 5 extra days on the plan unless you change it when recording leave.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-pct" variant="form">
              Default refund on delete (% of total paid)
            </Label>
            <Input
              id="refund-pct"
              type="number"
              min={0}
              max={100}
              value={refundPercent}
              onChange={(e) => setRefundPercent(e.target.value)}
              className="max-w-[12rem] text-base sm:text-sm"
            />
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Prefills the delete dialog refund amount. Example: 50% means a student with ₹10,000 paid starts at ₹5,000 refund.
            </p>
          </div>
          <Separator className="bg-border/60" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted-foreground">Changes apply after you save.</p>
            <Button onClick={save} disabled={saving} className="h-11 gap-2 rounded-full px-6 font-semibold sm:shrink-0">
              {saving ? (
                <>
                  <Spinner className="text-base" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="plain overflow-hidden rounded-2xl border-border/55 shadow-sm">
        <CardHeader className="space-y-3 p-5 sm:p-8 sm:pb-5">
          <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">Session</CardTitle>
          <CardDescription className="text-[15px] leading-relaxed">
            Sign out on this browser. You will need the access code again to open Spotlight.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-full border-border/70 font-semibold"
            onClick={() => void logout()}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <>
                <Spinner className="h-4 w-4" /> Signing out…
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" /> Sign out
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
