import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonDbError } from "@/lib/http-db-error";

/** Public — theme only (no secrets). Used before login so the sign-in screen can render. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const d = await db();
    const raw =
      (await d.get<{ value: string }>("SELECT value FROM studio_settings WHERE key = 'ui_theme'"))?.value ||
      "system";
    const ui_theme =
      raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
    return NextResponse.json({ ui_theme });
  } catch (e) {
    return jsonDbError(e, "[GET /api/theme]");
  }
}
