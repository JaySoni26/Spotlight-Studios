"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, short: "Home" },
  { href: "/students", label: "Students", icon: Users, short: "Students" },
  { href: "/batches", label: "Batches", icon: Calendar, short: "Batches" },
];

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-base font-semibold tracking-tight">Spotlight</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">Studios</span>
      </div>
    </Link>
  );
}

function NavLink({ href, label, icon: Icon, onNavigate }: { href: string; label: string; icon: any; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-60 flex-col border-r bg-card/30 backdrop-blur-sm">
        <div className="h-16 flex items-center px-6 border-b">
          <Brand />
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="px-3 py-4 border-t">
          <p className="font-display italic text-xs text-muted-foreground px-3">
            &ldquo;Every step counts.&rdquo;
          </p>
        </div>
      </aside>

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-20 h-16 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-full flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Brand />
          </div>
          <div className="hidden lg:block text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r shadow-xl animate-in slide-in-from-left duration-200 flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b">
              <Brand />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-60 pt-16 pb-24 lg:pb-8">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto animate-fade-in">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3 h-16">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
