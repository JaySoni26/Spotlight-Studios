import { NextRequest, NextResponse } from "next/server";
import { db, BatchRow } from "@/lib/db";
import { BatchInput } from "@/lib/schemas";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = db();
  const rows = d.prepare(`
    SELECT 
      b.*,
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS studentCount,
      (SELECT COALESCE(SUM(s.amount), 0) FROM students s WHERE s.batch_id = b.id) AS revenue
    FROM batches b
    ORDER BY b.created_at DESC
  `).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BatchInput.parse(body);
    const id = randomUUID();
    const d = db();
    d.prepare(`
      INSERT INTO batches (id, name, price, schedule, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, parsed.name, parsed.price, parsed.schedule ?? null, parsed.description ?? null);

    const row = d.prepare("SELECT * FROM batches WHERE id = ?").get(id) as BatchRow;
    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
