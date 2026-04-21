import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonDbError } from "@/lib/http-db-error";
import { endOfMonth, format, startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type Scope = "combined_all" | "combined_month" | "studio_month" | "freelance_month";

function asScope(v: string | null): Scope {
  if (v === "combined_month" || v === "studio_month" || v === "freelance_month") return v;
  return "combined_all";
}

function buildWhere(scope: Scope) {
  if (scope === "combined_all") return { txWhere: "", gigWhere: "", args: [] as any[] };
  const now = new Date();
  const from = startOfMonth(now).getTime();
  const to = endOfMonth(now).getTime();
  if (scope === "combined_month") {
    return {
      txWhere: "WHERE created_at BETWEEN ? AND ?",
      gigWhere: "WHERE created_at BETWEEN ? AND ?",
      args: [from, to],
    };
  }
  if (scope === "studio_month") {
    return {
      txWhere: "WHERE created_at BETWEEN ? AND ?",
      gigWhere: "WHERE 1=0",
      args: [from, to],
    };
  }
  return {
    txWhere: "WHERE 1=0",
    gigWhere: "WHERE created_at BETWEEN ? AND ?",
    args: [from, to],
  };
}

export async function GET(req: NextRequest) {
  try {
    const d = await db();
    const sp = req.nextUrl.searchParams;
    const scope = asScope(sp.get("scope"));
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = Math.min(100, Math.max(10, Number(sp.get("page_size") || 50)));
    const offset = (page - 1) * pageSize;
    const { txWhere, gigWhere, args } = buildWhere(scope);

    const rows = await d.all<any>(
      `
      SELECT * FROM (
        SELECT
          id,
          'studio' AS source,
          COALESCE(student_name, 'Student') AS label,
          action,
          amount,
          payment_method,
          note,
          created_at
        FROM transaction_events
        ${txWhere}
        UNION ALL
        SELECT
          id,
          'freelance' AS source,
          COALESCE(client_name, 'Client') AS label,
          'gig_payment' AS action,
          amount,
          NULL AS payment_method,
          notes AS note,
          created_at
        FROM freelance_gigs
        ${gigWhere}
      )
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...args, ...args, pageSize, offset],
    );

    const countRow = await d.get<{ c: number }>(
      `
      SELECT COUNT(*) AS c FROM (
        SELECT id FROM transaction_events ${txWhere}
        UNION ALL
        SELECT id FROM freelance_gigs ${gigWhere}
      )
    `,
      [...args, ...args],
    );

    const studioRow = await d.get<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transaction_events ${txWhere}`,
      [...args],
    );
    const freelanceRow = await d.get<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM freelance_gigs ${gigWhere}`,
      [...args],
    );

    return NextResponse.json({
      scope,
      period_label:
        scope === "combined_all"
          ? "All time"
          : format(startOfMonth(new Date()), "MMM yyyy"),
      page,
      page_size: pageSize,
      total_count: countRow?.c || 0,
      totals: {
        studio: studioRow?.total || 0,
        freelance: freelanceRow?.total || 0,
        combined: (studioRow?.total || 0) + (freelanceRow?.total || 0),
      },
      rows,
    });
  } catch (e) {
    return jsonDbError(e, "[GET /api/revenue-breakdown]");
  }
}
