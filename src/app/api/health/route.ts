import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Confirms DB connectivity and basic table access. */
export async function GET() {
  try {
    const d = await db();
    const batches = (await d.get<{ n: number }>("SELECT COUNT(*) AS n FROM batches"))?.n ?? 0;
    const students = (await d.get<{ n: number }>("SELECT COUNT(*) AS n FROM students"))?.n ?? 0;
    const gigs = (await d.get<{ n: number }>("SELECT COUNT(*) AS n FROM freelance_gigs"))?.n ?? 0;
    return NextResponse.json({
      ok: true,
      database: "connected",
      counts: { batches, students, freelance_gigs: gigs },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Database error" }, { status: 503 });
  }
}
