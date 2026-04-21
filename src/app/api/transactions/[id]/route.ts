import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentMethod } from "@/lib/schemas";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateTransactionInput = z.object({
  payment_method: PaymentMethod,
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = UpdateTransactionInput.parse(body);
    const d = await db();
    const result = await d.run(
      `
      UPDATE transaction_events
      SET payment_method = ?
      WHERE id = ?
    `,
      [parsed.payment_method, params.id],
    );
    if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = await d.get<any>(
      `
      SELECT id, entity_type, entity_id, student_name, action, amount, payment_method, note, created_at
      FROM transaction_events
      WHERE id = ?
    `,
      [params.id],
    );
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
