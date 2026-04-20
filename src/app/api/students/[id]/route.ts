import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StudentInput } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { endDateOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = db();
  const row = d.prepare(`
    SELECT s.*, b.name AS batch_name
    FROM students s LEFT JOIN batches b ON b.id = s.batch_id
    WHERE s.id = ?
  `).get(params.id) as any;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...row, end_date: endDateOf(row.start_date, row.validity_days) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = StudentInput.parse(body);
    const d = db();

    // Get existing to detect batch change
    const existing = d.prepare("SELECT batch_id FROM students WHERE id = ?").get(params.id) as { batch_id: string | null } | undefined;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    d.prepare(`
      UPDATE students SET name = ?, phone = ?, amount = ?, start_date = ?, validity_days = ?, batch_id = ?, notes = ?
      WHERE id = ?
    `).run(
      parsed.name,
      parsed.phone ?? null,
      parsed.amount,
      parsed.start_date,
      parsed.validity_days,
      parsed.batch_id || null,
      parsed.notes ?? null,
      params.id,
    );

    // Log batch change if different
    const newBatchId = parsed.batch_id || null;
    if (existing.batch_id !== newBatchId) {
      d.prepare(`
        INSERT INTO batch_history (id, student_id, from_batch_id, to_batch_id, note)
        VALUES (?, ?, ?, ?, 'Updated via edit')
      `).run(randomUUID(), params.id, existing.batch_id, newBatchId);
    }

    const row = d.prepare(`
      SELECT s.*, b.name AS batch_name
      FROM students s LEFT JOIN batches b ON b.id = s.batch_id
      WHERE s.id = ?
    `).get(params.id) as any;

    return NextResponse.json({ ...row, end_date: endDateOf(row.start_date, row.validity_days) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = db();
  const result = d.prepare("DELETE FROM students WHERE id = ?").run(params.id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
