import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonDbError } from "@/lib/http-db-error";
import { getStudentEndDate } from "@/lib/utils";
import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return await computeAnalytics();
  } catch (e) {
    return jsonDbError(e, "[GET /api/analytics]");
  }
}

async function computeAnalytics(): Promise<NextResponse> {
  const d = await db();
  const now = new Date();

  const students = await d.all<any>(`
    SELECT s.*, b.name AS batch_name
    FROM students s LEFT JOIN batches b ON b.id = s.batch_id
  `);

  const batches = await d.all<any>(`
    SELECT b.*, 
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS studentCount,
      (SELECT COALESCE(SUM(amount),0) FROM students s WHERE s.batch_id = b.id) AS revenue
    FROM batches b
    ORDER BY b.created_at DESC
  `);
  const freelance = await d.all<any>(`
    SELECT *
    FROM freelance_gigs
  `);
  const transactions = await d.all<any>(`
    SELECT id, entity_type, student_name, action, amount, payment_method, note, created_at
    FROM transaction_events
    ORDER BY created_at DESC
  `);

  // Enrich students with end_date & status
  const enriched = students.map((s) => {
    const end_date = getStudentEndDate(s);
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
  const trialsActive = enriched.filter((s) => (s.enrollment_kind || "paid") === "trial" && s.status !== "expired").length;
  const trialsExpired = enriched.filter((s) => (s.enrollment_kind || "paid") === "trial" && s.status === "expired").length;
  const expiringSoon = enriched.filter((s) => s.status === "critical" || s.status === "expiring").length;
  const totalRevenue = transactions
    .filter((t) => (t.entity_type || "student") !== "freelance")
    .reduce((a, t) => a + (t.amount || 0), 0);
  const freelanceRevenue = transactions
    .filter((t) => (t.entity_type || "student") === "freelance")
    .reduce((a, t) => a + (t.amount || 0), 0);
  const combinedRevenue = totalRevenue + freelanceRevenue;
  const avgFee = totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0;
  const paidTransactions = transactions.filter((t) => (t.amount || 0) > 0);
  const cashPaid = paidTransactions
    .filter((t) => (t.payment_method || "cash") === "cash")
    .reduce((a, t) => a + (t.amount || 0), 0);
  const onlinePaid = paidTransactions
    .filter((t) => (t.payment_method || "cash") === "online")
    .reduce((a, t) => a + (t.amount || 0), 0);
  const cashCount = paidTransactions.filter((t) => (t.payment_method || "cash") === "cash").length;
  const onlineCount = paidTransactions.filter((t) => (t.payment_method || "cash") === "online").length;

  // This month / last month revenue (from transaction ledger)
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const sumInRange = (from: Date, to: Date) =>
    transactions
      .filter((t) => {
        const d = new Date(t.created_at);
        return (t.entity_type || "student") !== "freelance" && d >= from && d <= to;
      })
      .reduce((a, t) => a + (t.amount || 0), 0);

  const thisMonthRevenue = sumInRange(thisMonthStart, thisMonthEnd);
  const lastMonthRevenue = sumInRange(lastMonthStart, lastMonthEnd);
  const thisMonthFreelance = transactions
    .filter((g) => {
      const d = new Date(g.created_at);
      return (g.entity_type || "student") === "freelance" && d >= thisMonthStart && d <= thisMonthEnd;
    })
    .reduce((a, g) => a + (g.amount || 0), 0);
  const lastMonthFreelance = transactions
    .filter((g) => {
      const d = new Date(g.created_at);
      return (g.entity_type || "student") === "freelance" && d >= lastMonthStart && d <= lastMonthEnd;
    })
    .reduce((a, g) => a + (g.amount || 0), 0);
  const thisMonthCombined = thisMonthRevenue + thisMonthFreelance;
  const lastMonthCombined = lastMonthRevenue + lastMonthFreelance;
  const revenueGrowth =
    lastMonthCombined > 0 ? ((thisMonthCombined - lastMonthCombined) / lastMonthCombined) * 100 : thisMonthCombined > 0 ? 100 : 0;

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
  const monthlyRevenue: Array<{ label: string; revenue: number; students: number; studio: number; freelanceOnly: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const from = startOfMonth(monthDate);
    const to = endOfMonth(monthDate);
    const studioOnly = sumInRange(from, to);
    const freelanceOnly = transactions
      .filter((g) => {
        const d = new Date(g.created_at);
        return (g.entity_type || "student") === "freelance" && d >= from && d <= to;
      })
      .reduce((a, g) => a + (g.amount || 0), 0);
    monthlyRevenue.push({
      label: format(monthDate, "MMM"),
      revenue: studioOnly + freelanceOnly,
      studio: studioOnly,
      freelanceOnly,
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

  // --- Status distribution (trial = non-expired trials; paid-only for time buckets) ---
  const isTrialEnrolment = (s: (typeof enriched)[0]) => (s.enrollment_kind || "paid") === "trial";
  const statusDistribution = [
    {
      name: "Trial",
      value: enriched.filter((s) => isTrialEnrolment(s) && s.status !== "expired").length,
      key: "trial",
    },
    {
      name: "Active",
      value: enriched.filter((s) => !isTrialEnrolment(s) && s.status === "active").length,
      key: "active",
    },
    {
      name: "Expiring",
      value: enriched.filter((s) => !isTrialEnrolment(s) && s.status === "expiring").length,
      key: "expiring",
    },
    {
      name: "Critical",
      value: enriched.filter((s) => !isTrialEnrolment(s) && s.status === "critical").length,
      key: "critical",
    },
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
  const recentFreelance = [...freelance]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 5);

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

  const monthlyStudioFreelance = monthlyRevenue.map(({ label, studio, freelanceOnly }) => ({
    label,
    studio,
    freelance: freelanceOnly,
  }));

  return NextResponse.json({
    kpis: {
      totalStudents,
      activeStudents,
      expiredStudents,
      expiringSoon,
      totalRevenue,
      freelanceRevenue,
      combinedRevenue,
      avgFee,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthFreelance,
      lastMonthFreelance,
      thisMonthCombined,
      lastMonthCombined,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      newThisMonth,
      newLastMonth,
      totalBatches: batches.length,
      projectedNext30Days: next30Days,
      totalFreelanceGigs: freelance.length,
      avgFreelanceAmount: freelance.length ? Math.round(freelanceRevenue / freelance.length) : 0,
      trialsActive,
      trialsExpired,
      cashPaid,
      onlinePaid,
      cashCount,
      onlineCount,
    },
    monthlyRevenue,
    enrolmentTrend,
    batchDistribution,
    statusDistribution,
    expiringList,
    topBatches,
    recentActivity,
    recentFreelance,
    validityDistribution,
    monthlyStudioFreelance,
    revenueEntries: {
      studio: transactions.map((t) => ({
        id: t.id,
        source: "studio",
        label: t.student_name || "Student",
        action: t.action,
        amount: t.amount || 0,
        payment_method: t.payment_method || null,
        note: t.note || null,
        created_at: t.created_at,
      })),
      freelance: freelance.map((g) => ({
        id: g.id,
        source: "freelance",
        label: g.client_name || "Client",
        action: "gig_payment",
        amount: g.amount || 0,
        payment_method: null,
        note: g.notes || null,
        created_at: g.created_at,
      })),
    },
    /** Same order as GET /api/batches — drives `batchAccentColor` / trial tint on dashboard. */
    batchesForAccent: batches.map((b) => ({ id: b.id })),
  });
}
