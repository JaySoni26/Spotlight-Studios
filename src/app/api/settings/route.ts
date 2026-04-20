import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonDbError } from "@/lib/http-db-error";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSettingsInput = z
  .object({
    delete_admin_code: z.string().min(4).max(20).optional(),
    leave_transfer_percent: z.coerce.number().int().min(0).max(100).optional(),
    ui_theme: z.enum(["light", "dark", "system"]).optional(),
  })
  .refine(
    (d) =>
      d.delete_admin_code !== undefined ||
      d.leave_transfer_percent !== undefined ||
      d.ui_theme !== undefined,
    { message: "Provide at least one field" },
  );

async function readSettings(d: Awaited<ReturnType<typeof db>>) {
  const code =
    (await d.get<{ value: string }>("SELECT value FROM studio_settings WHERE key = 'delete_admin_code'"))?.value ||
    "0000";
  const pctRaw =
    (await d.get<{ value: string }>("SELECT value FROM studio_settings WHERE key = 'leave_transfer_percent'"))
      ?.value || "50";
  const leave_transfer_percent = Math.min(100, Math.max(0, parseInt(pctRaw, 10) || 50));
  const themeRaw =
    (await d.get<{ value: string }>("SELECT value FROM studio_settings WHERE key = 'ui_theme'"))?.value || "system";
  const ui_theme =
    themeRaw === "light" || themeRaw === "dark" || themeRaw === "system" ? themeRaw : "system";
  return { delete_admin_code: code, leave_transfer_percent, ui_theme };
}

export async function GET() {
  try {
    const d = await db();
    return NextResponse.json(await readSettings(d));
  } catch (e) {
    return jsonDbError(e, "[GET /api/settings]");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateSettingsInput.parse(body);
    let d;
    try {
      d = await db();
    } catch (err) {
      return jsonDbError(err, "[PATCH /api/settings] db()");
    }
    const now = Date.now();
    if (parsed.delete_admin_code !== undefined) {
      await d.run(
        `
        INSERT INTO studio_settings (key, value, updated_at)
        VALUES ('delete_admin_code', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `,
        [parsed.delete_admin_code.trim(), now],
      );
    }
    if (parsed.leave_transfer_percent !== undefined) {
      await d.run(
        `
        INSERT INTO studio_settings (key, value, updated_at)
        VALUES ('leave_transfer_percent', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `,
        [String(parsed.leave_transfer_percent), now],
      );
    }
    if (parsed.ui_theme !== undefined) {
      await d.run(
        `
        INSERT INTO studio_settings (key, value, updated_at)
        VALUES ('ui_theme', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `,
        [parsed.ui_theme, now],
      );
    }
    return NextResponse.json(await readSettings(d));
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues.map((x) => x.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
