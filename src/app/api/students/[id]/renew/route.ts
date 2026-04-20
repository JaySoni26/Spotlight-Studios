import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { endDateOf } from "@/lib/utils";
import { addDays, format, parseISO } from "date-fns";

const RenewInput = z.object({
  additional_days: z.coerce.number().int().positive().max(3650),
  additional_amount: z.coerce.number().int().nonnegative(),
  extend_from: z.enum(["today", "current_end"]).default("current_end"),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = RenewInput.parse(body);
    const d = db();

    const student = d.prepare("SELECT * FROM students WHERE id = ?").get(params.id) as any;
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const currentEnd = endDateOf(student.start_date, student.validity_days);
    const today = new Date();
    let newStart = parseISO(student.start_date);
    let newValidity = student.validity_days + parsed.additional_days;

    if (parsed.extend_from === "today") {
      // Reset: start = today, validity = additional_days only
      newStart = today;
      newValidity = parsed.additional_days;
    } else {
      // Extend from current end or today, whichever is later
      const endDateObj = parseISO(currentEnd);
      if (endDateObj < today) {
        // Already expired — start fresh from today
        newStart = today;
        newValidity = parsed.additional_days;
      }
    }

    const newStartIso = format(newStart, "yyyy-MM-dd");
    const newAmount = student.amount + parsed.additional_amount;

    d.prepare(`
      UPDATE students SET start_date = ?, validity_days = ?, amount = ? WHERE id = ?
    `).run(newStartIso, newValidity, newAmount, params.id);

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
