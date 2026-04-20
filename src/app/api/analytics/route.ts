import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { endDateOf } from "@/lib/utils";
import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();
  const now = new Date();

  const students = d.prepare(`
    SELECT s.*, b.name AS batch_name
    FROM students s LEFT JOIN batches b ON b.id = s.batch_id
  `).all() as any[];

  const batches = d.prepare(`
    SELECT b.*, 
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS studentCount,
      (SELECT COALESCE(SUM(amount),0) FROM students s WHERE s.batch_id = b.id) AS revenue
    FROM batches b
  `).all() as any[];

  // Enrich students with end_date & status
  const enriched = students.map((s) => {
    const end_date = endDateOf(s.start_date, s.validity_days);
    const days = differenceInCalendarDays(parseISO(end_date), now);
    let status: "active" | "expiring" | "critical" | "expired" = "active";
    if (days < 0) status = "expired";
    else if (days <= 3) status = "critical";
    else if (days <= 10) status = "expiring";
    return { ...s, end_date, days_remaining: days, status };
  });

  // --- KPIs ---
  const totalStudents = enriched.length;
  const activeStudents = enriched.filter((s) => s.status !== "expired").length;
  const expiredStudents = enriched.filter((s) => s.status === "expired").length;
  const expiringSoon = enriched.filter((s) => s.status === "critical" || s.status === "expiring").length;
  const totalRevenue = enriched.reduce((a, s) => a + (s.amount || 0), 0);
  const avgFee = totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0;

  // This month / last month revenue (by start_date)
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const sumInRange = (from: Date, to: Date) =>
    enriched.filter((s) => {
      const d = parseISO(s.start_date);
      return d >= from && d <= to;
    }).reduce((a, s) => a + (s.amount || 0), 0);

  const thisMonthRevenue = sumInRange(thisMonthStart, thisMonthEnd);
  const lastMonthRevenue = sumInRange(lastMonthStart, lastMonthEnd);
  const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : (thisMonthRevenue > 0 ? 100 : 0);

  // New students this month / last month
  const newThisMonth = enriched.filter((s) => {
    const d = new Date(s.created_at);
    return d >= thisMonthStart && d <= thisMonthEnd;
  }).length;
  const newLastMonth = enriched.filter((s) => {
    const d = new Date(s.created_at);
    return d >= lastMonthStart && d <= lastMonthEnd;
  }).length;

  // --- Revenue last 6 months (chart) ---
  const monthlyRevenue: Array<{ label: string; revenue: number; students: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const from = startOfMonth(monthDate);
    const to = endOfMonth(monthDate);
    monthlyRevenue.push({
      label: format(monthDate, "MMM"),
      revenue: sumInRange(from, to),
      students: enriched.filter((s) => {
        const d = parseISO(s.start_date);
        return d >= from && d <= to;
      }).length,
    });
  }

  // --- Enrolment trend last 30 days ---
  const thirtyDaysAgo = subDays(now, 29);
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
  const enrolmentTrend = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const count = enriched.filter((s) => {
      const createdDate = format(new Date(s.created_at), "yyyy-MM-dd");
      return createdDate === dayStr;
    }).length;
    return { date: format(day, "d MMM"), count };
  });

  // --- Batch distribution pie ---
  const batchDistribution = batches.map((b) => ({
    name: b.name,
    value: b.studentCount,
    revenue: b.revenue,
  }));
  const unassigned = enriched.filter((s) => !s.batch_id).length;
  if (unassigned > 0) {
    batchDistribution.push({ name: "Unassigned", value: unassigned, revenue: 0 });
  }

  // --- Status distribution ---
  const statusDistribution = [
    { name: "Active", value: enriched.filter((s) => s.status === "active").length, key: "active" },
    { name: "Expiring", value: enriched.filter((s) => s.status === "expiring").length, key: "expiring" },
    { name: "Critical", value: enriched.filter((s) => s.status === "critical").length, key: "critical" },
    { name: "Expired", value: enriched.filter((s) => s.status === "expired").length, key: "expired" },
  ];

  // --- Expiring soon list (sorted) ---
  const expiringList = enriched
    .filter((s) => s.days_remaining <= 10)
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 20);

  // --- Top batches by revenue ---
  const topBatches = [...batches]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((b) => ({ name: b.name, revenue: b.revenue, students: b.studentCount }));

  // --- Recent activity (last 10 students added) ---
  const recentActivity = [...enriched]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      batch_name: s.batch_name,
      amount: s.amount,
      created_at: s.created_at,
    }));

  // --- Projected revenue (next 30 days: expiring renewals potential) ---
  const next30Days = enriched
    .filter((s) => s.days_remaining >= 0 && s.days_remaining <= 30)
    .reduce((a, s) => a + (s.amount || 0), 0);

  // --- Validity distribution buckets ---
  const validityBuckets: Record<string, number> = { "0-7d": 0, "8-30d": 0, "31-90d": 0, "90d+": 0, "Expired": 0 };
  enriched.forEach((s) => {
    if (s.days_remaining < 0) validityBuckets["Expired"]++;
    else if (s.days_remaining <= 7) validityBuckets["0-7d"]++;
    else if (s.days_remaining <= 30) validityBuckets["8-30d"]++;
    else if (s.days_remaining <= 90) validityBuckets["31-90d"]++;
    else validityBuckets["90d+"]++;
  });
  const validityDistribution = Object.entries(validityBuckets).map(([label, count]) => ({ label, count }));

  return NextResponse.json({
    kpis: {
      totalStudents,
      activeStudents,
      expiredStudents,
      expiringSoon,
      totalRevenue,
      avgFee,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      newThisMonth,
      newLastMonth,
      totalBatches: batches.length,
      projectedNext30Days: next30Days,
    },
    monthlyRevenue,
    enrolmentTrend,
    batchDistribution,
    statusDistribution,
    expiringList,
    topBatches,
    recentActivity,
    validityDistribution,
  });
}
