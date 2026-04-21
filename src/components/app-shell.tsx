"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, Settings, BriefcaseBusiness, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const navItems = [
  { href: "/", label: "Home", icon: Home, short: "Home" },
  { href: "/students", label: "Students", icon: Users, short: "Students" },
  { href: "/batches", label: "Batches", icon: Calendar, short: "Batches" },
  { href: "/freelance", label: "Freelance", icon: BriefcaseBusiness, short: "Gigs" },
  { href: "/settings", label: "Settings", icon: Settings, short: "Settings" },
];

const createActions: {
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
}[] = [
  { href: "/students?add=1", title: "New student", description: "Enrol someone in a batch", icon: Users },
  { href: "/batches?add=1", title: "New batch", description: "Create a class with a default fee", icon: Calendar },
  { href: "/freelance?add=1", title: "New gig", description: "Log freelance income", icon: BriefcaseBusiness },
];

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 min-w-0 group", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50">
        <Image src="/logo.svg" alt="Spotlight logo" width={30} height={30} className="h-7 w-7 object-contain" priority />
      </div>
      <span className="text-[15px] font-semibold tracking-tight truncate">Spotlight studios</span>
    </Link>
  );
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap sm:px-3 sm:py-2 sm:text-[12px] lg:text-[13px] lg:px-3.5",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const isLogin = pathname === "/login";
  const isStudentProfile = /^\/students\/[^/]+$/.test(pathname || "");

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (isStudentProfile) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-[900px] px-4 sm:px-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-0">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className={cn(
          "sticky top-0 z-30 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,backdrop-filter,border-color] duration-200",
          scrolled
            ? "border-border/50 bg-card/90 shadow-[0_1px_0_hsl(var(--border)/0.35)] dark:bg-card/85 dark:border-border/40 supports-[backdrop-filter]:bg-card/82 dark:supports-[backdrop-filter]:bg-card/78 backdrop-blur-2xl"
            : "border-border/55 bg-card/80 dark:bg-card/75 dark:border-border/45 supports-[backdrop-filter]:bg-card/72 dark:supports-[backdrop-filter]:bg-card/68",
        )}
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <Brand className="shrink-0" />
          <nav
            className="hidden md:flex flex-1 items-center justify-center gap-0.5 min-w-0 px-2"
            aria-label="Main"
          >
            {navItems.map((item) => (
              <DesktopNavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="hidden h-10 gap-1.5 rounded-full px-3.5 font-semibold md:inline-flex sm:h-9"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              <span className="hidden sm:inline">Create</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 pb-[calc(8.75rem+env(safe-area-inset-bottom))] pt-4 sm:pt-6 md:pb-8">
        <div className="animate-fade-in">{children}</div>
      </main>

      <button
        type="button"
        className="md:hidden fixed z-40 flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-primary text-primary-foreground shadow-[0_8px_28px_-4px_rgba(0,0,0,0.35)] transition-transform active:scale-95 dark:shadow-[0_10px_32px_-4px_rgba(0,0,0,0.55)] right-4"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 12px)" }}
        onClick={() => setCreateOpen(true)}
        aria-label="Create new"
      >
        <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
      </button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-sm:max-w-none gap-0 overflow-hidden rounded-3xl border-border/60 p-0 sm:max-w-[min(22rem,calc(100vw-1.5rem))] sm:rounded-3xl">
          <DialogHeader className="space-y-1.5 border-b border-border/50 px-5 pb-4 pt-5 text-left sm:px-6 sm:pb-5 sm:pt-6">
            <DialogTitle className="text-xl font-semibold tracking-tight">Create</DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed">
              Choose what you want to add. You can always come back from each page too.
            </DialogDescription>
          </DialogHeader>
          <nav className="flex flex-col gap-1 p-2 sm:p-3" aria-label="Create options">
            {createActions.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setCreateOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl px-3 py-3 text-left outline-none transition-colors hover:bg-muted/90 focus-visible:bg-muted/90 focus-visible:ring-2 focus-visible:ring-ring sm:px-3.5 sm:py-3.5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground shadow-inner">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-foreground">{title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground leading-snug">{description}</span>
                </span>
                <span className="text-muted-foreground/50 text-lg font-light" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </nav>
        </DialogContent>
      </Dialog>

      <nav
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl backdrop-saturate-150 pb-[env(safe-area-inset-bottom)] transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200",
          scrolled
            ? "border-border/40 bg-card/92 dark:bg-card/88 backdrop-blur-2xl shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.14)] dark:shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.5)]"
            : "border-border/45 bg-card/86 dark:bg-card/80 shadow-[0_-6px_28px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_-6px_28px_-8px_rgba(0,0,0,0.42)]",
        )}
        aria-label="Mobile navigation"
      >
        <div className="mx-auto grid h-[4rem] max-w-[1400px] grid-cols-5 px-2">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 py-2.5 min-h-[3.5rem] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-lg",
                  active ? "text-primary" : "text-muted-foreground active:text-foreground",
                )}
              >
                {active ? (
                  <span
                    className="absolute top-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className="h-6 w-6 shrink-0"
                  strokeWidth={active ? 2.25 : 1.85}
                  absoluteStrokeWidth
                />
                <span className="text-[11px] font-semibold leading-none tracking-tight">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
