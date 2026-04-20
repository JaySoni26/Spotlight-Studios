import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TrialExtendInput } from "@/lib/schemas";
import { getStudentEndDate } from "@/lib/utils";
import { addDays, format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = TrialExtendInput.parse(body);
    const d = await db();

    const student = await d.get<any>("SELECT * FROM students WHERE id = ?", [params.id]);
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if ((student.enrollment_kind || "paid") !== "trial" || !student.trial_end_date) {
      return NextResponse.json({ error: "Not on trial" }, { status: 400 });
    }

    const newTrialEnd = format(addDays(parseISO(student.trial_end_date), parsed.additional_days), "yyyy-MM-dd");
    const newValidityDays = student.validity_days + parsed.additional_days;

    await d.run(
      `UPDATE students SET trial_end_date = ?, validity_days = ? WHERE id = ?`,
      [newTrialEnd, newValidityDays, params.id],
    );

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
