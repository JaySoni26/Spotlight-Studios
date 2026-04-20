import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StudentLeaveInput } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { endDateOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getLeavePercent(d: Awaited<ReturnType<typeof db>>): Promise<number> {
  const row = await d.get<{ value: string }>(
    "SELECT value FROM studio_settings WHERE key = 'leave_transfer_percent'",
  );
  const n = parseInt(row?.value ?? "50", 10);
  if (Number.isNaN(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = StudentLeaveInput.parse(body);
    const d = await db();

    const student = await d.get<{ id: string; validity_days: number }>(
      "SELECT id, validity_days FROM students WHERE id = ?",
      [params.id],
    );
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const percent = await getLeavePercent(d);
    let transfer =
      parsed.transfer_days !== undefined
        ? parsed.transfer_days
        : Math.round((parsed.leave_days * percent) / 100);
    transfer = Math.min(transfer, parsed.leave_days);
    transfer = Math.max(0, transfer);

    const newValidity = student.validity_days + transfer;
    await d.run("UPDATE students SET validity_days = ? WHERE id = ?", [newValidity, params.id]);
    await d.run(
      `INSERT INTO student_leaves (id, student_id, leave_days, transfer_days, note)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), params.id, parsed.leave_days, transfer, parsed.notes?.trim() || null],
    );

    const row = await d.get<any>(
      `
      SELECT s.*, b.name AS batch_name
      FROM students s LEFT JOIN batches b ON b.id = s.batch_id
      WHERE s.id = ?
    `,
      [params.id],
    );

    const leaves = await d.all<any>(
      `SELECT id, leave_days, transfer_days, note, created_at
       FROM student_leaves WHERE student_id = ? ORDER BY created_at DESC LIMIT 20`,
      [params.id],
    );

    return NextResponse.json({
      ...row,
      end_date: endDateOf(row.start_date, newValidity),
      leaves,
      leave_record: { leave_days: parsed.leave_days, transfer_days: transfer },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
