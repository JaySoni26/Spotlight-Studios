import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { PaymentMethod } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const FreelanceInput = z.object({
  client_name: z.string().min(1).max(100),
  phone: z.string().max(30).optional().nullable(),
  amount: z.coerce.number().int().nonnegative(),
  payment_method: PaymentMethod.default("cash"),
  work_days: z.coerce.number().int().positive().max(365),
  notes: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const d = await db();
  const rows = await d.all(`
    SELECT *
    FROM freelance_gigs
    ORDER BY created_at DESC
  `);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = FreelanceInput.parse(body);
    const id = randomUUID();
    const d = await db();
    await d.run(
      `
      INSERT INTO freelance_gigs (id, client_name, phone, amount, payment_method, work_days, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [id, parsed.client_name.trim(), parsed.phone ?? null, parsed.amount, parsed.payment_method, parsed.work_days, parsed.notes ?? null],
    );
    if (parsed.amount > 0) {
      await d.run(
        `
        INSERT INTO transaction_events (id, entity_type, entity_id, student_name, action, amount, payment_method, note, created_at)
        VALUES (?, 'freelance', ?, ?, 'gig_payment', ?, ?, ?, ?)
      `,
        [randomUUID(), id, parsed.client_name.trim(), parsed.amount, parsed.payment_method, parsed.notes ?? null, Date.now()],
      );
    }
    const row = await d.get("SELECT * FROM freelance_gigs WHERE id = ?", [id]);
    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
