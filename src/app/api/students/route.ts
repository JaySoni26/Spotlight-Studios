import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StudentInput } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { endDateOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();
  const rows = d.prepare(`
    SELECT s.*, b.name AS batch_name
    FROM students s
    LEFT JOIN batches b ON b.id = s.batch_id
    ORDER BY s.created_at DESC
  `).all() as any[];

  const enriched = rows.map((r) => ({
    ...r,
    end_date: endDateOf(r.start_date, r.validity_days),
  }));
  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StudentInput.parse(body);
    const id = randomUUID();
    const d = db();

    d.prepare(`
      INSERT INTO students (id, name, phone, amount, start_date, validity_days, batch_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.name,
      parsed.phone ?? null,
      parsed.amount,
      parsed.start_date,
      parsed.validity_days,
      parsed.batch_id || null,
      parsed.notes ?? null,
    );

    // If assigned to a batch, log it as initial assignment
    if (parsed.batch_id) {
      d.prepare(`
        INSERT INTO batch_history (id, student_id, from_batch_id, to_batch_id, note)
        VALUES (?, ?, NULL, ?, 'Initial enrolment')
      `).run(randomUUID(), id, parsed.batch_id);
    }

    const row = d.prepare(`
      SELECT s.*, b.name AS batch_name
      FROM students s LEFT JOIN batches b ON b.id = s.batch_id
      WHERE s.id = ?
    `).get(id) as any;

    return NextResponse.json({ ...row, end_date: endDateOf(row.start_date, row.validity_days) }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
