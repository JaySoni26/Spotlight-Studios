import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { SESSION_COOKIE_NAME, signSessionJwt } from "@/lib/auth-session";
import { db } from "@/lib/db";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function safeCompare(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

async function expectedAccessCode(): Promise<string> {
  /** Optional deploy-time override — otherwise use Settings → studio code (DB). */
  const envOverride = process.env.SPOTLIGHT_ACCESS_CODE?.trim();
  if (envOverride && envOverride.length > 0) return envOverride;

  try {
    const d = await db();
    const row = await d.get<{ value: string }>(
      "SELECT value FROM studio_settings WHERE key = 'delete_admin_code'",
    );
    return row?.value?.trim() || "0000";
  } catch {
    return "0000";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const expected = await expectedAccessCode();

    if (!code || !safeCompare(code, expected)) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
    }

    const token = await signSessionJwt();

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SEC,
    });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Login failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
