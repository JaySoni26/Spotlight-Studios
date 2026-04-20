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
import { Shield, Palette, Percent, Save } from "lucide-react";

const shell = "mx-auto w-full max-w-2xl space-y-8 pb-10";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteCode, setDeleteCode] = React.useState("");
  const [leavePercent, setLeavePercent] = React.useState("50");

  const load = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .getSettings()
      .then((data) => {
        setDeleteCode(data.delete_admin_code || "0000");
        setLeavePercent(String(data.leave_transfer_percent ?? 50));
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
    setSaving(true);
    try {
      await api.updateSettings({ delete_admin_code: deleteCode.trim(), leave_transfer_percent: pct });
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Preferences</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Control how Spotlight looks and how sensitive actions behave.
        </p>
      </header>

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
              <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">Delete protection</CardTitle>
              <CardDescription className="text-[15px] leading-relaxed">
                Required before removing students or batches. Pick something stronger than the default in production.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="space-y-2">
            <Label htmlFor="delete-code" variant="form">
              Special code
            </Label>
            <Input
              id="delete-code"
              value={deleteCode}
              onChange={(e) => setDeleteCode(e.target.value)}
              placeholder="Minimum 4 characters"
              className="text-base sm:text-sm"
            />
            <p className="text-[13px] leading-relaxed text-muted-foreground">Default is often 0000 until you change it here.</p>
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
    </div>
  );
}
