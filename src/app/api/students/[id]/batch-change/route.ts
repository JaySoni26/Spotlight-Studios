import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { z } from "zod";

const Input = z.object({
  to_batch_id: z.string().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = Input.parse(body);
    const d = db();

    const student = d.prepare("SELECT batch_id FROM students WHERE id = ?").get(params.id) as { batch_id: string | null } | undefined;
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newId = parsed.to_batch_id || null;

    if (student.batch_id === newId) {
      return NextResponse.json({ error: "Already in this batch" }, { status: 400 });
    }

    // Validate target batch exists if given
    if (newId) {
      const b = d.prepare("SELECT id FROM batches WHERE id = ?").get(newId);
      if (!b) return NextResponse.json({ error: "Target batch not found" }, { status: 404 });
    }

    d.prepare("UPDATE students SET batch_id = ? WHERE id = ?").run(newId, params.id);
    d.prepare(`
      INSERT INTO batch_history (id, student_id, from_batch_id, to_batch_id, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), params.id, student.batch_id, newId, parsed.note ?? null);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid" }, { status: 400 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = db();
  const rows = d.prepare(`
    SELECT h.*, 
      bf.name AS from_batch_name,
      bt.name AS to_batch_name
    FROM batch_history h
    LEFT JOIN batches bf ON bf.id = h.from_batch_id
    LEFT JOIN batches bt ON bt.id = h.to_batch_id
    WHERE h.student_id = ?
    ORDER BY h.changed_at DESC
  `).all(params.id);
  return NextResponse.json(rows);
}
