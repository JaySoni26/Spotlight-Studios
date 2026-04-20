"use client";
import * as React from "react";
import Link from "next/link";
import { Users, Wallet, TrendingUp, AlertTriangle, Calendar, UserPlus, ChevronRight, Activity, PieChart, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import {
  RevenueAreaChart, EnrolmentLineChart, BatchPieChart,
  StatusBarChart, TopBatchesBarChart, ValidityBarChart,
} from "@/components/charts";
import { api } from "@/lib/api";
import { fmtDate, fmtDateShort, fmtINR, getInitials, getStatus } from "@/lib/utils";

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function statusBadge(status: { key: string; label: string; days: number }) {
  const variantMap: Record<string, any> = {
    active: "success", expiring: "warning", critical: "danger", expired: "muted",
  };
  return <Badge variant={variantMap[status.key]}>{status.label}</Badge>;
}

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    api.analytics().then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return <div>Failed to load</div>;

  const { kpis, monthlyRevenue, enrolmentTrend, batchDistribution, statusDistribution, expiringList, topBatches, recentActivity, validityDistribution } = data;
  const isEmpty = kpis.totalStudents === 0 && kpis.totalBatches === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-primary" /> Overview
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Good {getTimeGreeting()}, <span className="italic text-primary">Spotlight</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Here&rsquo;s what&rsquo;s happening at the studio · {fmtDate(new Date().toISOString())}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/batches"><Calendar className="h-4 w-4" /> Batches</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/students"><UserPlus className="h-4 w-4" /> Add Student</Link>
          </Button>
        </div>
      </div>

      {isEmpty && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <h3 className="font-display italic text-2xl text-primary mb-2">Welcome to Spotlight</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Let&rsquo;s set you up. Create your first batch, then enrol students.
            </p>
            <div className="flex justify-center gap-2">
              <Button asChild><Link href="/batches">Create Batch</Link></Button>
              <Button asChild variant="outline"><Link href="/students">Add Student</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Students"
          value={kpis.totalStudents}
          icon={<Users className="h-4 w-4" />}
          subtext={`${kpis.activeStudents} active · ${kpis.expiredStudents} expired`}
        />
        <StatCard
          label="Total Revenue"
          value={<>₹{fmtINR(kpis.totalRevenue)}</>}
          icon={<Wallet className="h-4 w-4" />}
          subtext={`Avg ₹${fmtINR(kpis.avgFee)}/student`}
          accent="primary"
        />
        <StatCard
          label="This Month"
          value={<>₹{fmtINR(kpis.thisMonthRevenue)}</>}
          icon={<TrendingUp className="h-4 w-4" />}
          change={kpis.revenueGrowth}
          changeLabel="vs last month"
        />
        <StatCard
          label="Expiring Soon"
          value={kpis.expiringSoon}
          icon={<AlertTriangle className="h-4 w-4" />}
          subtext="in next 10 days"
          accent={kpis.expiringSoon > 0 ? "warning" : "default"}
        />
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active Batches"
          value={kpis.totalBatches}
          icon={<Calendar className="h-4 w-4" />}
          subtext={kpis.totalBatches === 0 ? "Create your first" : "Running now"}
        />
        <StatCard
          label="New This Month"
          value={kpis.newThisMonth}
          icon={<UserPlus className="h-4 w-4" />}
          change={kpis.newLastMonth > 0 ? ((kpis.newThisMonth - kpis.newLastMonth) / kpis.newLastMonth) * 100 : undefined}
          changeLabel={`${kpis.newLastMonth} last month`}
        />
        <StatCard
          label="Projected (30d)"
          value={<>₹{fmtINR(kpis.projectedNext30Days)}</>}
          icon={<Target className="h-4 w-4" />}
          subtext="Expiring renewals"
        />
        <StatCard
          label="Last Month"
          value={<>₹{fmtINR(kpis.lastMonthRevenue)}</>}
          icon={<Activity className="h-4 w-4" />}
          subtext="Previous period"
        />
      </div>

      {/* Revenue Trend + Status */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-xl">Revenue Trend</CardTitle>
                <CardDescription>Last 6 months, by enrolment date</CardDescription>
              </div>
              <Badge variant="muted">₹{fmtINR(monthlyRevenue.reduce((a: number, m: any) => a + m.revenue, 0))}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Membership Status</CardTitle>
            <CardDescription>Current breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBarChart data={statusDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Enrolment + Validity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Enrolment — Last 30 Days</CardTitle>
            <CardDescription>New students added per day</CardDescription>
          </CardHeader>
          <CardContent>
            <EnrolmentLineChart data={enrolmentTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Validity Buckets</CardTitle>
            <CardDescription>Days remaining across all students</CardDescription>
          </CardHeader>
          <CardContent>
            <ValidityBarChart data={validityDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Batch Distribution + Top Batches */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Batch Distribution</CardTitle>
            <CardDescription>Students per batch</CardDescription>
          </CardHeader>
          <CardContent>
            <BatchPieChart data={batchDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Top Batches</CardTitle>
            <CardDescription>Ranked by total revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <TopBatchesBarChart data={topBatches} />
          </CardContent>
        </Card>
      </div>

      {/* Expiring + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-xl">Expiring Soon</CardTitle>
                <CardDescription>Next 10 days plus expired</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/students">View all <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expiringList.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <div className="text-3xl mb-2 opacity-30">✦</div>
                All memberships are comfortably active.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {expiringList.map((s: any) => {
                  const status = getStatus(s.end_date);
                  const borderColor =
                    status.key === "critical" || status.key === "expired" ? "border-l-red-500" :
                    status.key === "expiring" ? "border-l-amber-500" :
                    "border-l-emerald-500";
                  return (
                    <Link
                      key={s.id}
                      href="/students"
                      className={`flex items-center gap-3 rounded-md border border-l-4 ${borderColor} bg-card px-3 py-2.5 hover:bg-accent/50 transition-colors`}
                    >
                      <Avatar className="h-9 w-9 bg-primary/10 text-primary">
                        {getInitials(s.name)}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.batch_name || "No batch"} · ends {fmtDateShort(s.end_date)}
                        </p>
                      </div>
                      {statusBadge(status)}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Recent Activity</CardTitle>
            <CardDescription>Latest enrolments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No activity yet</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 bg-muted text-foreground text-[10px]">
                      {getInitials(a.name)}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {a.batch_name || "No batch"} · ₹{fmtINR(a.amount)}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {fmtDateShort(new Date(a.created_at).toISOString())}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-1/2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
