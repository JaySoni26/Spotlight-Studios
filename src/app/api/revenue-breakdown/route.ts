import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonDbError } from "@/lib/http-db-error";
import { endOfMonth, format, startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type Scope = "combined_all" | "combined_month" | "studio_month" | "freelance_month" | "cash" | "online";

function asScope(v: string | null): Scope {
  if (v === "combined_month" || v === "studio_month" || v === "freelance_month" || v === "cash" || v === "online") return v;
  return "combined_all";
}

function buildWhere(scope: Scope) {
  if (scope === "combined_all") return { txWhere: "", args: [] as any[] };
  const now = new Date();
  const from = startOfMonth(now).getTime();
  const to = endOfMonth(now).getTime();
  if (scope === "combined_month") {
    return {
      txWhere: "WHERE created_at BETWEEN ? AND ?",
      args: [from, to],
    };
  }
  if (scope === "studio_month") {
    return {
      txWhere: "WHERE created_at BETWEEN ? AND ? AND COALESCE(entity_type, 'student') != 'freelance'",
      args: [from, to],
    };
  }
  if (scope === "cash") {
    return {
      txWhere: "WHERE amount > 0 AND COALESCE(payment_method, 'cash') = 'cash'",
      args: [] as any[],
    };
  }
  if (scope === "online") {
    return {
      txWhere: "WHERE amount > 0 AND COALESCE(payment_method, 'cash') = 'online'",
      args: [] as any[],
    };
  }
  return {
    txWhere: "WHERE created_at BETWEEN ? AND ? AND COALESCE(entity_type, 'student') = 'freelance'",
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
    const { txWhere, args } = buildWhere(scope);

    const rows = await d.all<any>(
      `
      SELECT
        id,
        CASE WHEN COALESCE(entity_type, 'student') = 'freelance' THEN 'freelance' ELSE 'studio' END AS source,
        COALESCE(student_name, CASE WHEN COALESCE(entity_type, 'student') = 'freelance' THEN 'Client' ELSE 'Student' END) AS label,
        action,
        amount,
        payment_method,
        note,
        created_at
      FROM transaction_events
      ${txWhere}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...args, pageSize, offset],
    );

    const countRow = await d.get<{ c: number }>(
      `
      SELECT COUNT(*) AS c FROM transaction_events ${txWhere}
    `,
      [...args],
    );

    const totalsRow = await d.get<{ studio: number; freelance: number; combined: number }>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN COALESCE(entity_type, 'student') = 'freelance' THEN 0 ELSE amount END), 0) AS studio,
        COALESCE(SUM(CASE WHEN COALESCE(entity_type, 'student') = 'freelance' THEN amount ELSE 0 END), 0) AS freelance,
        COALESCE(SUM(amount), 0) AS combined
      FROM transaction_events
      ${txWhere}
    `,
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
        studio: totalsRow?.studio || 0,
        freelance: totalsRow?.freelance || 0,
        combined: totalsRow?.combined || 0,
      },
      rows,
    });
  } catch (e) {
    return jsonDbError(e, "[GET /api/revenue-breakdown]");
  }
}
