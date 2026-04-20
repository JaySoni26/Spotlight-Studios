import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BatchInput, DeleteWithCodeInput } from "@/lib/schemas";
import { formatBatchScheduleLabel, verifyDeleteCode } from "@/lib/utils";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = await db();
  const row = await d.get<any>(
    `
    SELECT b.*,
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS studentCount,
      (SELECT COALESCE(SUM(s.amount), 0) FROM students s WHERE s.batch_id = b.id) AS revenue
    FROM batches b WHERE b.id = ?
  `,
    [params.id],
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...row,
    schedule: formatBatchScheduleLabel(row.schedule_json, row.schedule),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = BatchInput.parse(body);
    const d = await db();
    const scheduleJson = parsed.schedule_entries?.length ? JSON.stringify(parsed.schedule_entries) : null;
    const scheduleLabel = formatBatchScheduleLabel(scheduleJson, parsed.schedule ?? null);
    const result = await d.run(`
      UPDATE batches SET name = ?, price = ?, schedule = ?, schedule_json = ?, description = ?
      WHERE id = ?
    `, [parsed.name, parsed.price, scheduleLabel, scheduleJson, parsed.description ?? null, params.id]);

    if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = await d.get<any>("SELECT * FROM batches WHERE id = ?", [params.id]);
    return NextResponse.json({ ...row, schedule: formatBatchScheduleLabel(row.schedule_json, row.schedule) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const parsed = DeleteWithCodeInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Special code is required" }, { status: 400 });
  }

  const d = await db();
  if (!(await verifyDeleteCode(d, parsed.data.code))) {
    return NextResponse.json({ error: "Invalid special code" }, { status: 403 });
  }

  const existing = await d.get<{ id: string; name: string }>("SELECT id, name FROM batches WHERE id = ?", [params.id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Unassign students from this batch (FK is SET NULL but we do explicit for clarity)
  await d.run("UPDATE students SET batch_id = NULL WHERE batch_id = ?", [params.id]);
  const result = await d.run("DELETE FROM batches WHERE id = ?", [params.id]);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await d.run(`
    INSERT INTO delete_events (id, entity_type, entity_id, entity_name, refund_amount)
    VALUES (?, 'batch', ?, ?, 0)
  `, [randomUUID(), existing.id, existing.name]);
  return NextResponse.json({ ok: true });
}
