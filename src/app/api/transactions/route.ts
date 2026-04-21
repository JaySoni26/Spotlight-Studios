import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonDbError } from "@/lib/http-db-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const d = await db();
    const rows = await d.all<any>(
      `
      SELECT id, student_name, action, amount, payment_method, note, created_at
      FROM transaction_events
      ORDER BY created_at DESC
      LIMIT 500
    `,
    );
    return NextResponse.json(rows);
  } catch (e) {
    return jsonDbError(e, "[GET /api/transactions]");
  }
}
