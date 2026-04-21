"use client";
import * as React from "react";
import Link from "next/link";
import { Users, Wallet, TrendingUp, AlertTriangle, Calendar, BriefcaseBusiness, ArrowRight, Activity, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  RevenueAreaChart,
  BatchPieChart,
  StatusBarChart,
  EnrolmentLineChart,
  TopBatchesBarChart,
  ValidityBarChart,
  StudioFreelanceStackedBarChart,
  MonthlyEnrolmentsBarChart,
} from "@/components/charts";
import { api } from "@/lib/api";
import { cn, fmtDateShort, fmtINR, getInitials, getStatus } from "@/lib/utils";
import {
  batchAccentColor,
  batchAvatarStyles,
  MEMBERSHIP_STATUS_DOT,
  trialEnrollmentChipStyles,
} from "@/lib/chart-palette";
import { Avatar } from "@/components/ui/avatar";
import { endOfMonth, startOfMonth } from "date-fns";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl sm:tracking-tight">{title}</h2>
      {description ? (
        <p className="text-sm text-muted-foreground leading-relaxed sm:text-base max-w-2xl">{description}</p>
      ) : null}
    </header>
  );
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card plain className={cn("flex h-full min-h-0 flex-col overflow-hidden rounded-2xl", className)}>
      {/* Single inset; gap matches separation — no flex-1 justify-end (that added dead space below heading vs tight top). */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-5 sm:p-6">
        <div className="shrink-0 space-y-2">
          <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">{title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed sm:text-[15px]">{description}</CardDescription>
        </div>
        <div className="min-h-0 w-full shrink-0">{children}</div>
      </div>
    </Card>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  value: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Card className="h-full border-border/70">
      <Wrapper
        {...(onClick
          ? {
              type: "button",
              onClick,
              className:
                "w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            }
          : {})}
      >
      <CardHeader className="space-y-2.5 pb-2 pt-5 px-5 sm:space-y-3 sm:pt-5 sm:px-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-snug pr-1 sm:text-[11px]">
            {title}
          </p>
          <div className="text-muted-foreground/80 shrink-0 [&_svg]:size-[15px] sm:[&_svg]:size-4">{icon}</div>
        </div>
        <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground leading-none sm:text-[1.75rem]">{value}</div>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5 sm:px-5 sm:pb-5">
        <div className="text-xs text-muted-foreground leading-snug sm:text-sm">{subtitle}</div>
      </CardContent>
      </Wrapper>
    </Card>
  );
}

function ListRow({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 sm:px-3.5",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

function ExpiringSoonAttention({ list, batches }: { list: any[]; batches: { id: string }[] }) {
  const slice = list.slice(0, 12);
  return (
    <section
      className="rounded-[1.25rem] border border-border/50 bg-muted/35 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-border/60 dark:bg-muted/20 dark:shadow-none"
      aria-labelledby="dash-expiring-heading"
    >
      <div className="border-b border-border/40 px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <header className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Up next</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                id="dash-expiring-heading"
                className="text-[1.375rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.625rem]"
              >
                Expiring soon
              </h2>
              <span className="inline-flex min-h-[1.75rem] items-center rounded-full bg-background/90 px-2.5 text-sm font-semibold tabular-nums text-foreground shadow-sm ring-1 ring-border/60 dark:bg-background/50">
                {list.length}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Memberships ending within 10 days. Open someone to renew, extend a trial, or convert to paid.
            </p>
          </header>
          <Button
            asChild
            size="lg"
            className="h-11 shrink-0 rounded-xl px-6 text-[15px] font-semibold shadow-sm transition-all hover:shadow-md"
          >
            <Link href="/students?status=expiring_soon" className="inline-flex items-center gap-1">
              Show all
              <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:gap-3 sm:p-5 lg:grid-cols-3 lg:p-6">
        {slice.map((student: any) => {
          const days = student.days_remaining;
          const isTrial = (student.enrollment_kind || "paid") === "trial";
          const ac = batchAccentColor(student.batch_id, batches);
          const dayLabel =
            days < 0
              ? `Ended ${Math.abs(days)}d ago`
              : days === 0
                ? "Ends today"
                : days === 1
                  ? "1 day left"
                  : `${days} days left`;

          return (
            <Link
              key={student.id}
              href={`/students?student=${encodeURIComponent(student.id)}`}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border-y border-r border-border/60 bg-card py-2 pl-2 pr-2.5 text-left shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 ease-out sm:gap-3 sm:py-2.5 sm:pl-2.5 sm:pr-3",
                "hover:-translate-y-px hover:border-border hover:shadow-md hover:ring-black/[0.06]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "dark:ring-white/[0.06] dark:hover:shadow-md",
              )}
              style={{
                borderLeftWidth: 3,
                borderLeftStyle: "solid",
                borderLeftColor: ac,
              }}
            >
              <Avatar
                className="h-9 w-9 shrink-0 rounded-lg border-2 font-semibold shadow-inner ring-0 sm:h-10 sm:w-10 sm:text-xs"
                style={batchAvatarStyles(student.batch_id, batches)}
              >
                {getInitials(student.name)}
              </Avatar>
              <div className="min-w-0 flex-1 py-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold leading-tight tracking-tight text-foreground sm:text-sm">
                    {student.name}
                  </p>
                  {isTrial ? (
                    <span
                      className="shrink-0 rounded border px-1 py-px text-[9px] font-bold uppercase tracking-wider"
                      style={trialEnrollmentChipStyles(student.batch_id, batches)}
                    >
                      Trial
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground sm:text-[12px]">
                  <span>{student.batch_name || "Unassigned"}</span>
                  <span className="text-border"> · </span>
                  <span className="tabular-nums">{fmtDateShort(student.end_date)}</span>
                  <span className="text-border"> · </span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      days < 0 && "text-destructive",
                      days >= 0 && days <= 3 && "text-foreground",
                      days > 3 && "text-muted-foreground",
                    )}
                  >
                    {dayLabel}
                  </span>
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover:translate-x-px group-hover:text-muted-foreground"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [moneyDetailOpen, setMoneyDetailOpen] = React.useState(false);
  const [moneyScope, setMoneyScope] = React.useState<"combined_all" | "combined_month" | "studio_month" | "freelance_month" | null>(null);
  const [moneyPage, setMoneyPage] = React.useState(1);
  const [moneyLoading, setMoneyLoading] = React.useState(false);
  const [moneyBreakdown, setMoneyBreakdown] = React.useState<any>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .analytics()
      .then((d) => {
        setData(d);
      })
      .catch((e) => {
        setData(null);
        setLoadError(e.message || "Could not load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const membershipCounts = React.useMemo(() => {
    const statusDistribution = data?.statusDistribution as { key: string; value: number }[] | undefined;
    const m = Object.fromEntries(
      (statusDistribution ?? []).map((x) => [x.key, x.value]),
    ) as Record<string, number>;
    return {
      paidActive: m.active ?? 0,
      trial: m.trial ?? 0,
      paidExpiring: (m.expiring ?? 0) + (m.critical ?? 0),
    };
  }, [data?.statusDistribution]);

  React.useEffect(() => {
    if (!moneyDetailOpen || !moneyScope) return;
    setMoneyLoading(true);
    api
      .revenueBreakdown({ scope: moneyScope, page: moneyPage, page_size: 50 })
      .then((res) => setMoneyBreakdown(res))
      .catch(() => setMoneyBreakdown(null))
      .finally(() => setMoneyLoading(false));
  }, [moneyDetailOpen, moneyScope, moneyPage]);

  const moneyTitle =
    moneyScope === "combined_all"
      ? "Combined revenue breakdown"
      : moneyScope === "combined_month"
        ? "This month revenue breakdown"
        : moneyScope === "studio_month"
          ? "Studio (month) breakdown"
          : "Freelance (month) breakdown";
  const moneyRows = moneyBreakdown?.rows ?? [];
  const moneyTotal = moneyBreakdown?.totals?.combined ?? 0;
  const totalCount = moneyBreakdown?.total_count ?? 0;
  const pageSize = moneyBreakdown?.page_size ?? 50;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (loading && !data) return <DashboardSkeleton />;
  if (!data && loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        <p className="text-destructive text-sm font-medium leading-relaxed mb-2">{loadError}</p>
        <p className="text-sm text-muted-foreground mb-6">Check your connection and database configuration.</p>
        <Button onClick={() => load()} variant="default">
          Retry
        </Button>
      </div>
    );
  }
  if (!data) {
    return <DashboardSkeleton />;
  }

  const {
    kpis,
    monthlyRevenue,
    batchDistribution,
    statusDistribution,
    topBatches,
    recentFreelance,
    recentActivity,
    expiringList,
    enrolmentTrend,
    validityDistribution,
    monthlyStudioFreelance,
    batchesForAccent,
  } = data;
  const batchesAccent = (batchesForAccent ?? []) as { id: string }[];
  const isEmpty = kpis.totalStudents === 0 && kpis.totalBatches === 0;
  const hasExpiringSoon = (expiringList?.length ?? 0) > 0;

  return (
    <div className="space-y-9 md:space-y-11">
      <section className="space-y-4 md:space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground px-0.5">Overview</p>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 md:gap-4">
          <KpiCard
            title="Combined revenue"
            value={<>₹{fmtINR(kpis.combinedRevenue)}</>}
            subtitle={`Studio ₹${fmtINR(kpis.totalRevenue)} + freelance ₹${fmtINR(kpis.freelanceRevenue)}`}
            icon={<Wallet className="h-4 w-4" />}
            onClick={() => {
              setMoneyScope("combined_all");
              setMoneyPage(1);
              setMoneyDetailOpen(true);
            }}
          />
          <KpiCard
            title="This month"
            value={<>₹{fmtINR(kpis.thisMonthCombined)}</>}
            subtitle={`${kpis.revenueGrowth}% vs last month`}
            icon={<TrendingUp className="h-4 w-4" />}
            onClick={() => {
              setMoneyScope("combined_month");
              setMoneyPage(1);
              setMoneyDetailOpen(true);
            }}
          />
          <KpiCard
            title="Students"
            value={kpis.totalStudents}
            subtitle={
              <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: MEMBERSHIP_STATUS_DOT.active }} />
                  {membershipCounts.paidActive} paid active
                </span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: MEMBERSHIP_STATUS_DOT.trial }} />
                  {membershipCounts.trial} trial
                </span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${MEMBERSHIP_STATUS_DOT.expiring}, ${MEMBERSHIP_STATUS_DOT.critical})`,
                    }}
                  />
                  {membershipCounts.paidExpiring} expiring (paid)
                </span>
              </span>
            }
            icon={<Users className="h-4 w-4" />}
          />
          <KpiCard
            title="Freelance gigs"
            value={kpis.totalFreelanceGigs}
            subtitle={`Avg ₹${fmtINR(kpis.avgFreelanceAmount)}`}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
          />
          <KpiCard
            title="Studio (month)"
            value={<>₹{fmtINR(kpis.thisMonthRevenue)}</>}
            subtitle={`Prior ₹${fmtINR(kpis.lastMonthRevenue)}`}
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => {
              setMoneyScope("studio_month");
              setMoneyPage(1);
              setMoneyDetailOpen(true);
            }}
          />
          <KpiCard
            title="Freelance (month)"
            value={<>₹{fmtINR(kpis.thisMonthFreelance)}</>}
            subtitle={`Prior ₹${fmtINR(kpis.lastMonthFreelance)}`}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            onClick={() => {
              setMoneyScope("freelance_month");
              setMoneyPage(1);
              setMoneyDetailOpen(true);
            }}
          />
          <KpiCard
            title="Avg fee"
            value={<>₹{fmtINR(kpis.avgFee)}</>}
            subtitle={`${kpis.newThisMonth} new this month`}
            icon={<Users className="h-4 w-4" />}
          />
          <KpiCard
            title="30-day renewals"
            value={<>₹{fmtINR(kpis.projectedNext30Days)}</>}
            subtitle="Near-expiry potential"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </div>
      </section>

      {hasExpiringSoon ? <ExpiringSoonAttention list={expiringList} batches={batchesAccent} /> : null}

      {isEmpty && (
        <Card className="border-dashed border-border/70">
          <CardContent className="py-8 text-center px-5 sm:py-10 sm:px-6">
            <h3 className="text-lg font-semibold tracking-tight sm:text-xl">Add a batch or freelance gig</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-5 max-w-sm mx-auto leading-relaxed sm:text-base">
              Charts and activity will appear here once you have data.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/batches">Create batch</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link href="/freelance">Add gig</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-5 md:space-y-6">
        <SectionHeading
          eyebrow="Revenue"
          title="Income & membership"
          description="Six-month trend and how students are distributed by status."
        />
        <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
          <ChartCard title="Revenue trend" description="Studio + freelance by month." className="lg:col-span-2">
            <RevenueAreaChart data={monthlyRevenue} />
          </ChartCard>
          <ChartCard title="Membership status" description="Headcount in each state.">
            <StatusBarChart data={statusDistribution} />
          </ChartCard>
        </div>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
          <ChartCard
            title="Studio vs freelance"
            description="Stacked fees by month — see the mix."
            className="lg:col-span-2"
          >
            <StudioFreelanceStackedBarChart data={monthlyStudioFreelance ?? []} />
          </ChartCard>
          <ChartCard title="Monthly sign-ups" description="New students whose start date falls in each month.">
            <MonthlyEnrolmentsBarChart
              data={(monthlyRevenue ?? []).map(({ label, students }: { label: string; students: number }) => ({
                label,
                students,
              }))}
            />
          </ChartCard>
        </div>
      </section>

      <section className="space-y-5 md:space-y-6">
        <SectionHeading
          eyebrow="Classes"
          title="Batches"
          description="Student mix and which classes earn the most."
        />
        <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
          <ChartCard title="By batch" description="Share of students per class.">
            <BatchPieChart data={batchDistribution} />
          </ChartCard>
          <ChartCard title="Top by revenue" description="Ranked by fees collected." className="lg:col-span-2">
            <TopBatchesBarChart data={topBatches} />
          </ChartCard>
        </div>
      </section>

      <section className="space-y-5 md:space-y-6">
        <SectionHeading
          eyebrow="Growth"
          title="Sign-ups & runway"
          description="Daily enrolments and validity buckets."
        />
        <div className="grid gap-4 md:gap-5 md:grid-cols-2">
          <ChartCard title="Enrolment" description="New students per day · 30 days.">
            <EnrolmentLineChart data={enrolmentTrend} />
          </ChartCard>
          <ChartCard title="Validity" description="Time left on memberships.">
            <ValidityBarChart data={validityDistribution} />
          </ChartCard>
        </div>
      </section>

      <section className="space-y-5 md:space-y-6">
        <SectionHeading
          eyebrow="Activity"
          title="Action items"
          description={
            hasExpiringSoon ? "Freelance gigs and recent payments." : "Renewals, gigs, and recent payments."
          }
        />
        <div
          className={cn(
            "grid gap-4 md:gap-5",
            hasExpiringSoon ? "lg:grid-cols-1" : "lg:grid-cols-3",
          )}
        >
          {!hasExpiringSoon ? (
            <Card plain className="lg:col-span-2 overflow-hidden">
              <CardHeader className="space-y-2 px-5 pt-5 pb-2 sm:pt-5">
                <CardTitle className="text-base font-semibold tracking-tight sm:text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary shrink-0" />
                  Expiring soon
                </CardTitle>
                <CardDescription className="text-sm sm:text-[15px]">Priority renewals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 px-5 pb-5 sm:pb-5">
                {expiringList?.length ? (
                  expiringList.slice(0, 8).map((student: any) => {
                    const status = getStatus(student.end_date);
                    const days = student.days_remaining;
                    const dayLabel =
                      days < 0 ? `Ended ${Math.abs(days)}d ago` : days === 0 ? "Ends today" : `${days}d left`;
                    const ac = batchAccentColor(student.batch_id, batchesAccent);
                    return (
                      <Link
                        key={student.id}
                        href={`/students?student=${encodeURIComponent(student.id)}`}
                        className="block rounded-xl outline-none ring-offset-background transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                      >
                        <ListRow
                          className="border-border/50 bg-muted/25"
                          style={{
                            borderLeftWidth: 3,
                            borderLeftStyle: "solid",
                            borderLeftColor: ac,
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 sm:gap-3">
                            <Avatar
                              className="h-8 w-8 shrink-0 border-2 text-[10px] font-semibold shadow-inner sm:text-xs"
                              style={batchAvatarStyles(student.batch_id, batchesAccent)}
                            >
                              {getInitials(student.name)}
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 sm:text-xs leading-snug">
                                {student.batch_name || "Unassigned"} · {fmtDateShort(student.end_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-[11px] font-medium tabular-nums text-muted-foreground sm:text-xs">{dayLabel}</span>
                            <Badge
                              variant={
                                status.key === "expired"
                                  ? "destructive"
                                  : status.key === "critical"
                                    ? "warning"
                                    : "secondary"
                              }
                              className="shrink-0 text-[10px] sm:text-xs"
                            >
                              {status.label}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-70" aria-hidden />
                          </div>
                        </ListRow>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-2 sm:text-sm">Nothing urgent.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card plain className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-2 sm:pt-5">
              <div className="space-y-2 pr-2 min-w-0">
                <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">Freelance</CardTitle>
                <CardDescription className="text-sm sm:text-[15px]">Latest gigs.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="icon" className="shrink-0 h-8 w-8 rounded-full">
                <Link href="/freelance" aria-label="Open freelance">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5 px-5 pb-5 sm:pb-5">
              {recentFreelance?.length ? (
                recentFreelance.map((gig: any) => (
                  <ListRow key={gig.id} className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{gig.client_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 sm:text-xs">{gig.work_days} days</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums sm:text-right">₹{fmtINR(gig.amount)}</p>
                  </ListRow>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 sm:text-sm">No gigs yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card plain className="overflow-hidden">
          <CardHeader className="space-y-2 px-5 pt-5 pb-2 sm:pt-5">
            <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">Recent students</CardTitle>
            <CardDescription className="text-sm sm:text-[15px]">Latest fees recorded.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 px-5 pb-5 sm:pb-5">
            {recentActivity?.length ? (
              recentActivity.map((activity: any) => (
                <ListRow key={activity.id} className="flex-col items-stretch gap-1.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 sm:text-xs">{activity.batch_name || "No batch"}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">₹{fmtINR(activity.amount)}</p>
                </ListRow>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-2 sm:col-span-2 sm:text-sm lg:col-span-3">No activity yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={moneyDetailOpen} onOpenChange={setMoneyDetailOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{moneyTitle}</DialogTitle>
            <DialogDescription>
              Net = Studio (₹{fmtINR(moneyBreakdown?.totals?.studio || 0)}) + Freelance (₹{fmtINR(moneyBreakdown?.totals?.freelance || 0)})
              {" "} = <span className="font-semibold text-foreground">₹{fmtINR(moneyTotal)}</span>
              {" "} · {moneyBreakdown?.period_label || "Period"}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border/60 bg-muted/25 p-3 text-xs text-muted-foreground">
            Showing {totalCount === 0 ? 0 : (moneyPage - 1) * pageSize + 1}-{Math.min(moneyPage * pageSize, totalCount)} of {totalCount} records.
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moneyLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell>
                  </TableRow>
                ) : moneyRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No records.</TableCell>
                  </TableRow>
                ) : moneyRows.map((row: any) => (
                  <TableRow key={`${row.source}-${row.id}`}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="capitalize">{row.source}</TableCell>
                    <TableCell>{String(row.action).replaceAll("_", " ")}</TableCell>
                    <TableCell>{row.payment_method ? String(row.payment_method).replaceAll("_", " ") : "—"}</TableCell>
                    <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${row.amount < 0 ? "text-destructive" : "text-foreground"}`}>
                      {row.amount < 0 ? "-" : "+"}₹{fmtINR(Math.abs(row.amount || 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden max-h-[55dvh] overflow-auto">
            {moneyLoading ? (
              <div className="rounded-xl border border-border/55 bg-muted/20 p-3 text-sm text-muted-foreground">Loading…</div>
            ) : moneyRows.length === 0 ? (
              <div className="rounded-xl border border-border/55 bg-muted/20 p-3 text-sm text-muted-foreground">No records.</div>
            ) : moneyRows.map((row: any) => (
              <div key={`${row.source}-${row.id}`} className="rounded-xl border border-border/55 bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{row.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {row.source} · {String(row.action).replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${row.amount < 0 ? "text-destructive" : "text-foreground"}`}>
                    {row.amount < 0 ? "-" : "+"}₹{fmtINR(Math.abs(row.amount || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={moneyPage <= 1 || moneyLoading} onClick={() => setMoneyPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {moneyPage} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={moneyPage >= totalPages || moneyLoading} onClick={() => setMoneyPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-8 md:space-y-11">
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 md:gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-2xl sm:h-[118px]" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
        <div className="grid gap-3 lg:grid-cols-3 md:gap-4">
          <Skeleton className="h-[300px] rounded-2xl lg:col-span-2 sm:h-[320px]" />
          <Skeleton className="h-[300px] rounded-2xl sm:h-[320px]" />
        </div>
        <div className="grid gap-3 lg:grid-cols-3 md:gap-4">
          <Skeleton className="h-[280px] rounded-2xl lg:col-span-2 sm:h-[300px]" />
          <Skeleton className="h-[280px] rounded-2xl sm:h-[300px]" />
        </div>
      </div>
    </div>
  );
}
