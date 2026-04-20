"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const misconfigured = searchParams.get("misconfigured") === "jwt";
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Enter your access code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not sign in");
        return;
      }
      toast.success("Signed in");
      const target = searchParams.get("from") || "/";
      router.replace(target.startsWith("/") ? target : "/");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[min(100dvh,100vh)] flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-[min(100%,22rem)] border-border/70 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
            SP
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight">Spotlight</CardTitle>
          <CardDescription className="text-[15px] leading-relaxed">
            Enter the same <strong className="font-semibold text-foreground">studio code</strong> you configure under
            Settings (default <strong className="font-semibold text-foreground">0000</strong>). Your browser keeps a signed
            session cookie after you sign in.
          </CardDescription>
          {misconfigured ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/[0.08] px-3 py-2 text-[13px] text-destructive leading-snug">
              Server is missing <code className="text-xs">SPOTLIGHT_JWT_SECRET</code> (32+ characters). Add it to{" "}
              <code className="text-xs">.env.local</code> and restart.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Access code</Label>
              <Input
                id="access-code"
                name="code"
                type="password"
                autoComplete="current-password"
                placeholder="e.g. 0000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 rounded-xl"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" /> Signing in…
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[min(100dvh,100vh)] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
