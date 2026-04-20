import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StudentInput } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { endDateOf, getStudentEndDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = await db();
  const rows = await d.all<any>(`
    SELECT s.*, b.name AS batch_name
    FROM students s
    LEFT JOIN batches b ON b.id = s.batch_id
    ORDER BY s.created_at DESC
  `);

  const enriched = rows.map((r) => ({
    ...r,
    end_date: getStudentEndDate(r),
  }));
  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StudentInput.parse(body);
    const id = randomUUID();
    const d = await db();

    const kind = parsed.enrollment_kind === "trial" ? "trial" : "paid";
    const trialEnd = kind === "trial" ? endDateOf(parsed.start_date, parsed.validity_days) : null;
    const amount = kind === "trial" ? 0 : parsed.amount;

    await d.run(`
      INSERT INTO students (id, name, phone, amount, start_date, validity_days, batch_id, notes, enrollment_kind, trial_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      parsed.name,
      parsed.phone ?? null,
      amount,
      parsed.start_date,
      parsed.validity_days,
      parsed.batch_id || null,
      parsed.notes ?? null,
      kind,
      trialEnd,
    ]);

    // If assigned to a batch, log it as initial assignment
    if (parsed.batch_id) {
      await d.run(`
        INSERT INTO batch_history (id, student_id, from_batch_id, to_batch_id, note)
        VALUES (?, ?, NULL, ?, 'Initial enrolment')
      `, [randomUUID(), id, parsed.batch_id]);
    }

    const row = await d.get<any>(`
      SELECT s.*, b.name AS batch_name
      FROM students s LEFT JOIN batches b ON b.id = s.batch_id
      WHERE s.id = ?
    `, [id]);

    return NextResponse.json({ ...row, end_date: getStudentEndDate(row) }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
