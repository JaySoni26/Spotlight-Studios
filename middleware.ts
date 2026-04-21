import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { jwtVerify } from "jose";

const DEV_FALLBACK_SECRET = "development-only-spotlight-jwt-secret-minimum-32-chars!!";

function jwtKey(): Uint8Array | null {
  const raw = process.env.SPOTLIGHT_JWT_SECRET?.trim();
  const s =
    raw && raw.length >= 32 ? raw : process.env.NODE_ENV === "development" ? DEV_FALLBACK_SECRET : "";
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/theme") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const secret = jwtKey();
  if (!secret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Server misconfigured: SPOTLIGHT_JWT_SECRET (min 32 chars)" }, { status: 500 });
    }
    const u = new URL("/login", request.url);
    u.searchParams.set("misconfigured", "jwt");
    return NextResponse.redirect(u);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Root `/` must be listed explicitly — patterns like `/((?!…).*)` often do not match
     * an empty path segment, so the dashboard could load without auth.
     */
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
