import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StudentLeaveUpdateInput } from "@/lib/schemas";
import { endDateOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; leaveId: string } },
) {
  try {
    const body = await req.json();
    const parsed = StudentLeaveUpdateInput.parse(body);
    const d = await db();

    const row = await d.get<{ id: string; student_id: string; leave_days: number; transfer_days: number }>(
      "SELECT id, student_id, leave_days, transfer_days FROM student_leaves WHERE id = ? AND student_id = ?",
      [params.leaveId, params.id],
    );
    if (!row) return NextResponse.json({ error: "Leave record not found" }, { status: 404 });

    let transfer = Math.min(parsed.transfer_days, parsed.leave_days);
    transfer = Math.max(0, transfer);
    const delta = transfer - row.transfer_days;

    const st = await d.get<{ validity_days: number }>("SELECT validity_days FROM students WHERE id = ?", [params.id]);
    if (!st) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const newValidity = Math.max(1, st.validity_days + delta);
    await d.run("UPDATE students SET validity_days = ? WHERE id = ?", [newValidity, params.id]);
    await d.run(
      `UPDATE student_leaves SET leave_days = ?, transfer_days = ?, note = ? WHERE id = ?`,
      [parsed.leave_days, transfer, parsed.notes?.trim() || null, params.leaveId],
    );

    const student = await d.get<any>(
      `SELECT s.*, b.name AS batch_name FROM students s LEFT JOIN batches b ON b.id = s.batch_id WHERE s.id = ?`,
      [params.id],
    );
    const leaves = await d.all<any>(
      `SELECT id, leave_days, transfer_days, note, created_at FROM student_leaves WHERE student_id = ? ORDER BY created_at DESC LIMIT 20`,
      [params.id],
    );
    return NextResponse.json({
      ...student,
      end_date: endDateOf(student.start_date, student.validity_days),
      leaves,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; leaveId: string } }) {
  const d = await db();
  const row = await d.get<{ transfer_days: number }>(
    "SELECT transfer_days FROM student_leaves WHERE id = ? AND student_id = ?",
    [params.leaveId, params.id],
  );
  if (!row) return NextResponse.json({ error: "Leave record not found" }, { status: 404 });

  const st = await d.get<{ validity_days: number }>("SELECT validity_days FROM students WHERE id = ?", [params.id]);
  if (!st) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const newValidity = Math.max(1, st.validity_days - row.transfer_days);
  await d.run("UPDATE students SET validity_days = ? WHERE id = ?", [newValidity, params.id]);
  await d.run("DELETE FROM student_leaves WHERE id = ?", [params.leaveId]);

  const student = await d.get<any>(
    `SELECT s.*, b.name AS batch_name FROM students s LEFT JOIN batches b ON b.id = s.batch_id WHERE s.id = ?`,
    [params.id],
  );
  const leaves = await d.all<any>(
    `SELECT id, leave_days, transfer_days, note, created_at FROM student_leaves WHERE student_id = ? ORDER BY created_at DESC LIMIT 20`,
    [params.id],
  );
  return NextResponse.json({
    ...student,
    end_date: endDateOf(student.start_date, student.validity_days),
    leaves,
  });
}
