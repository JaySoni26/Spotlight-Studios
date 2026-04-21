import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DeleteWithCodeInput, StudentInput } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { endDateOf, getStudentEndDate, verifyDeleteCode } from "@/lib/utils";
import { logStudentTransaction } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = await db();
  const row = await d.get<any>(`
    SELECT s.*, b.name AS batch_name
    FROM students s LEFT JOIN batches b ON b.id = s.batch_id
    WHERE s.id = ?
  `, [params.id]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const leaves = await d.all<any>(
    `SELECT id, leave_days, transfer_days, note, created_at
     FROM student_leaves WHERE student_id = ? ORDER BY created_at DESC LIMIT 20`,
    [params.id],
  );
  const payments = await d.all<any>(
    `SELECT id, action, amount, payment_method, note, created_at
     FROM transaction_events
     WHERE entity_type = 'student' AND entity_id = ?
     ORDER BY created_at DESC`,
    [params.id],
  );
  return NextResponse.json({ ...row, end_date: getStudentEndDate(row), leaves, payments });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = StudentInput.parse(body);
    const d = await db();

    // Get existing to detect batch change
    const existing = await d.get<any>("SELECT id, name, batch_id, created_at, amount, enrollment_kind FROM students WHERE id = ?", [params.id]);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kind = parsed.enrollment_kind === "trial" ? "trial" : "paid";
    const trialEnd = kind === "trial" ? endDateOf(parsed.start_date, parsed.validity_days) : null;
    const amount = kind === "trial" ? 0 : parsed.amount;

    await d.run(`
      UPDATE students SET name = ?, phone = ?, amount = ?, start_date = ?, validity_days = ?, batch_id = ?, notes = ?, enrollment_kind = ?, trial_end_date = ?
      WHERE id = ?
    `, [
      parsed.name,
      parsed.phone ?? null,
      amount,
      parsed.start_date,
      parsed.validity_days,
      parsed.batch_id || null,
      parsed.notes ?? null,
      kind,
      trialEnd,
      params.id,
    ]);

    // Log batch change if different
    const newBatchId = parsed.batch_id || null;
    if (existing.batch_id !== newBatchId) {
      await d.run(`
        INSERT INTO batch_history (id, student_id, from_batch_id, to_batch_id, note)
        VALUES (?, ?, ?, ?, 'Updated via edit')
      `, [randomUUID(), params.id, existing.batch_id, newBatchId]);
    }

    if (kind === "paid" && parsed.payment_method) {
      const updatedAny = await d.run(
        `
        UPDATE transaction_events
        SET payment_method = ?
        WHERE id = (
          SELECT id FROM transaction_events
          WHERE entity_type = 'student' AND entity_id = ? AND amount > 0
          ORDER BY created_at DESC
          LIMIT 1
        )
      `,
        [parsed.payment_method, params.id],
      );
      if (!updatedAny.changes && amount > 0) {
        await logStudentTransaction(d, {
          studentId: existing.id,
          studentName: parsed.name || existing.name,
          action: "enrolment",
          amount,
          paymentMethod: parsed.payment_method,
          note: "Imported from student edit",
        });
      }
    }

    const row = await d.get<any>(`
      SELECT s.*, b.name AS batch_name
      FROM students s LEFT JOIN batches b ON b.id = s.batch_id
      WHERE s.id = ?
    `, [params.id]);

    return NextResponse.json({ ...row, end_date: getStudentEndDate(row) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const d = await db();
  const body = await req.json().catch(() => ({}));
  const parsed = DeleteWithCodeInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Special code is required" }, { status: 400 });
  }
  if (!(await verifyDeleteCode(d, parsed.data.code))) {
    return NextResponse.json({ error: "Invalid special code" }, { status: 403 });
  }

  const existing = await d.get<any>("SELECT * FROM students WHERE id = ?", [params.id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await d.run("DELETE FROM students WHERE id = ?", [params.id]);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await d.run(`
    INSERT INTO delete_events (id, entity_type, entity_id, entity_name, refund_amount, deleted_payload)
    VALUES (?, 'student', ?, ?, ?, ?)
  `, [randomUUID(), existing.id, existing.name, parsed.data.refund_amount ?? 0, JSON.stringify(existing)]);
  const refundAmount = parsed.data.refund_amount ?? 0;
  if (refundAmount > 0) {
    await logStudentTransaction(d, {
      studentId: existing.id,
      studentName: existing.name,
      action: "refund",
      amount: -refundAmount,
      note: "Refund on student deletion",
    });
  }
  return NextResponse.json({ ok: true });
}
