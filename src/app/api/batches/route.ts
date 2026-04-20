import { NextRequest, NextResponse } from "next/server";
import { db, BatchRow } from "@/lib/db";
import { BatchInput } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { formatBatchScheduleLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = await db();
  const rows = await d.all<any>(`
    SELECT 
      b.*,
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS studentCount,
      (SELECT COALESCE(SUM(s.amount), 0) FROM students s WHERE s.batch_id = b.id) AS revenue
    FROM batches b
    ORDER BY b.created_at DESC
  `);
  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      schedule: formatBatchScheduleLabel(row.schedule_json, row.schedule),
    })),
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BatchInput.parse(body);
    const id = randomUUID();
    const d = await db();
    const scheduleJson = parsed.schedule_entries?.length ? JSON.stringify(parsed.schedule_entries) : null;
    const scheduleLabel = formatBatchScheduleLabel(scheduleJson, parsed.schedule ?? null);
    await d.run(`
      INSERT INTO batches (id, name, price, schedule, schedule_json, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, parsed.name, parsed.price, scheduleLabel, scheduleJson, parsed.description ?? null]);

    const row = (await d.get<BatchRow>("SELECT * FROM batches WHERE id = ?", [id])) as BatchRow;
    return NextResponse.json({ ...row, schedule: formatBatchScheduleLabel(row.schedule_json, row.schedule) }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
