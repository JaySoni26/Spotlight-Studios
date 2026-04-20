import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BatchInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = BatchInput.parse(body);
    const d = db();
    const result = d.prepare(`
      UPDATE batches SET name = ?, price = ?, schedule = ?, description = ?
      WHERE id = ?
    `).run(parsed.name, parsed.price, parsed.schedule ?? null, parsed.description ?? null, params.id);

    if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = d.prepare("SELECT * FROM batches WHERE id = ?").get(params.id);
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = db();
  // Unassign students from this batch (FK is SET NULL but we do explicit for clarity)
  d.prepare("UPDATE students SET batch_id = NULL WHERE batch_id = ?").run(params.id);
  const result = d.prepare("DELETE FROM batches WHERE id = ?").run(params.id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
