import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = await db();
  const row = await d.get("SELECT * FROM freelance_gigs WHERE id = ?", [params.id]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

const FreelanceInput = z.object({
  client_name: z.string().min(1).max(100),
  phone: z.string().max(30).optional().nullable(),
  amount: z.coerce.number().int().nonnegative(),
  work_days: z.coerce.number().int().positive().max(365),
  notes: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = FreelanceInput.parse(body);
    const d = await db();
    const result = await d.run(
      `
      UPDATE freelance_gigs
      SET client_name = ?, phone = ?, amount = ?, work_days = ?, notes = ?
      WHERE id = ?
    `,
      [parsed.client_name.trim(), parsed.phone ?? null, parsed.amount, parsed.work_days, parsed.notes ?? null, params.id],
    );
    if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = await d.get("SELECT * FROM freelance_gigs WHERE id = ?", [params.id]);
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = await db();
  const result = await d.run("DELETE FROM freelance_gigs WHERE id = ?", [params.id]);
  if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
