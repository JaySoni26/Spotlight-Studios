import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "spotlight_session";

/** HS256 signing key — server only */
const DEV_FALLBACK_SECRET = "development-only-spotlight-jwt-secret-minimum-32-chars!!";

export function getJwtSecretKey(): Uint8Array {
  const raw = process.env.SPOTLIGHT_JWT_SECRET?.trim();
  const s =
    raw && raw.length >= 32
      ? raw
      : process.env.NODE_ENV === "development"
        ? DEV_FALLBACK_SECRET
        : "";
  if (!s || s.length < 32) {
    throw new Error("SPOTLIGHT_JWT_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export async function signSessionJwt(): Promise<string> {
  const secret = getJwtSecretKey();
  return new SignJWT({ v: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject("spotlight")
    .sign(secret);
}

export async function verifySessionJwt(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecretKey();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
