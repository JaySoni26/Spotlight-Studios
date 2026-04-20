import { NextResponse } from "next/server";

function hintFor(detail: string): string | undefined {
  const d = detail.toLowerCase();
  if (d.includes("404") || d.includes("not found")) {
    return "Turso returned 404: TURSO_DATABASE_URL is usually wrong or the database was removed. In the Turso dashboard open the database → Connect → copy the libsql://… URL exactly into .env.local. Recreate the DB or token if this URL used to work.";
  }
  if (d.includes("401") || d.includes("403") || d.includes("unauthorized")) {
    return "Check TURSO_AUTH_TOKEN in .env.local (Connect → create token). Restart npm run dev after edits.";
  }
  if (d.includes("database url missing") || d.includes("libsql_url")) {
    return "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local (not .env.example), then restart the dev server.";
  }
  if (d.includes("placeholder") || d.includes(".env.example")) {
    return "Open Turso → select your database → Connect → copy the real libsql URL and a new token into .env.local (do not leave example values).";
  }
  return undefined;
}

/** Map DB setup / connection failures to a JSON response (avoids opaque 500s). */
export function jsonDbError(e: unknown, logLabel: string) {
  const detail = e instanceof Error ? e.message : String(e);
  const notConfigured =
    detail.includes("Database URL missing") ||
    detail.includes("TURSO_DATABASE_URL") ||
    detail.includes("LIBSQL_URL");
  const hint = hintFor(detail);
  console.error(logLabel, e);
  return NextResponse.json(
    {
      error: notConfigured ? "Database not configured" : "Database unavailable",
      detail,
      ...(hint ? { hint } : {}),
    },
    { status: 503 },
  );
}
