"use client";
import * as React from "react";
import Link from "next/link";
import { Users, Wallet, TrendingUp, AlertTriangle, Calendar, BriefcaseBusiness, ArrowRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Avatar } from "@/components/ui/avatar";

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
    <Card plain className={cn("overflow-hidden flex flex-col", className)}>
      <CardHeader className="space-y-2 shrink-0 px-5 pt-5 pb-1 sm:pt-5 sm:pb-1.5">
        <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed sm:text-[15px]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-4 sm:pb-5 sm:pt-5 flex-1 flex flex-col min-h-0">
        <div className="w-full min-h-0 flex-1">{children}</div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ title, value, subtitle, icon }: { title: string; value: React.ReactNode; subtitle: string; icon: React.ReactNode }) {
  return (
    <Card className="h-full border-border/70">
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
        <p className="text-xs text-muted-foreground leading-snug sm:text-sm">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ListRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 sm:px-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

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
  } = data;
  const isEmpty = kpis.totalStudents === 0 && kpis.totalBatches === 0;

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
          />
          <KpiCard
            title="This month"
            value={<>₹{fmtINR(kpis.thisMonthCombined)}</>}
            subtitle={`${kpis.revenueGrowth}% vs last month`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            title="Students"
            value={kpis.totalStudents}
            subtitle={`${kpis.activeStudents} active · ${kpis.expiringSoon} expiring`}
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
          />
          <KpiCard
            title="Freelance (month)"
            value={<>₹{fmtINR(kpis.thisMonthFreelance)}</>}
            subtitle={`Prior ₹${fmtINR(kpis.lastMonthFreelance)}`}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
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
        <SectionHeading eyebrow="Activity" title="Action items" description="Renewals, gigs, and recent payments." />
        <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
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
                  return (
                    <ListRow key={student.id}>
                      <div className="flex items-center gap-2.5 min-w-0 sm:gap-3">
                        <Avatar className="h-8 w-8 bg-primary/10 text-primary text-[10px] sm:text-xs shrink-0">
                          {getInitials(student.name)}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 sm:text-xs leading-snug">
                            {student.batch_name || "Unassigned"} · {fmtDateShort(student.end_date)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={status.key === "expired" ? "destructive" : status.key === "critical" ? "warning" : "secondary"}
                        className="shrink-0 text-[10px] sm:text-xs"
                      >
                        {status.label}
                      </Badge>
                    </ListRow>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground py-2 sm:text-sm">Nothing urgent.</p>
              )}
            </CardContent>
          </Card>

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
