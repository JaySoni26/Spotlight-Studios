import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ConvertTrialInput } from "@/lib/schemas";
import { randomUUID } from "crypto";
import { getStudentEndDate } from "@/lib/utils";
import { logStudentTransaction } from "@/lib/transactions";

export const dynamic = "force-dynamic";

/** Trial → paid membership: first payment and proper validity window. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = ConvertTrialInput.parse(body);
    const d = await db();

    const student = await d.get<any>("SELECT * FROM students WHERE id = ?", [params.id]);
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if ((student.enrollment_kind || "paid") !== "trial") {
      return NextResponse.json({ error: "Student is not on trial" }, { status: 400 });
    }

    await d.run(
      `
      UPDATE students SET
        enrollment_kind = 'paid',
        trial_end_date = NULL,
        start_date = ?,
        validity_days = ?,
        amount = ?
      WHERE id = ?
    `,
      [parsed.start_date, parsed.validity_days, parsed.amount, params.id],
    );

    await d.run(
      `
      INSERT INTO batch_history (id, student_id, from_batch_id, to_batch_id, note)
      VALUES (?, ?, ?, ?, ?)
    `,
      [randomUUID(), params.id, student.batch_id, student.batch_id, "Converted from trial to paid membership"],
    );

    await logStudentTransaction(d, {
      studentId: student.id,
      studentName: student.name,
      action: "trial_convert",
      amount: parsed.amount,
      paymentMethod: parsed.payment_method,
      note: "Trial converted to paid",
    });

    const row = await d.get<any>(
      `
      SELECT s.*, b.name AS batch_name
      FROM students s LEFT JOIN batches b ON b.id = s.batch_id
      WHERE s.id = ?
    `,
      [params.id],
    );

    return NextResponse.json({ ...row, end_date: getStudentEndDate(row) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
