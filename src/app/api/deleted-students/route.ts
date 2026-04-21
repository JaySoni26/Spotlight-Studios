import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonDbError } from "@/lib/http-db-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const d = await db();
    const rows = await d.all<any>(
      `
      SELECT id, entity_id, entity_name, refund_amount, deleted_payload, deleted_at
      FROM delete_events
      WHERE entity_type = 'student'
      ORDER BY deleted_at DESC
      LIMIT 500
    `,
    );
    const parsed = rows.map((r) => {
      let payload = null;
      if (typeof r.deleted_payload === "string" && r.deleted_payload.trim()) {
        try {
          payload = JSON.parse(r.deleted_payload);
        } catch {
          payload = null;
        }
      }
      return { ...r, payload };
    });
    return NextResponse.json(parsed);
  } catch (e) {
    return jsonDbError(e, "[GET /api/deleted-students]");
  }
}
