import { createHmac, timingSafeEqual } from "crypto";

export type AuthRole = "SUPER_ADMIN" | "ADMIN" | "CANDIDATE";

export type AuthSessionPayload = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  exp: number;
};

const ONE_DAY_SECONDS = 60 * 60 * 24;

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET environment variable is not set.");
  }
  return secret;
}

function sign(base64Payload: string, secret: string): string {
  return createHmac("sha256", secret).update(base64Payload).digest("base64url");
}

export function createAuthToken(
  payload: Omit<AuthSessionPayload, "exp">,
  expiresInDays = 7
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * ONE_DAY_SECONDS;
  const fullPayload: AuthSessionPayload = { ...payload, exp };
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString(
    "base64url"
  );
  const signature = sign(base64Payload, getSecret());
  return `${base64Payload}.${signature}`;
}

export function verifyAuthToken(token?: string | null): AuthSessionPayload | null {
  if (!token) return null;
  const [base64Payload, signature] = token.split(".");
  if (!base64Payload || !signature) return null;

  const expectedSignature = sign(base64Payload, getSecret());
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(base64Payload, "base64url").toString("utf8")
    ) as AuthSessionPayload;

    if (!payload?.id || !payload?.role || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
