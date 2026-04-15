type AuthRole = "SUPER_ADMIN" | "ADMIN" | "CANDIDATE";

export type EdgeAuthSessionPayload = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  exp: number;
};

function base64UrlToUint8Array(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(input.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodePayload(base64Payload: string): EdgeAuthSessionPayload | null {
  try {
    const bytes = base64UrlToUint8Array(base64Payload);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as EdgeAuthSessionPayload;
  } catch {
    return null;
  }
}

export async function verifyAuthTokenEdge(
  token: string | undefined,
  secret: string
): Promise<EdgeAuthSessionPayload | null> {
  if (!token) return null;
  const [base64Payload, signature] = token.split(".");
  if (!base64Payload || !signature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToUint8Array(signature),
    new TextEncoder().encode(base64Payload)
  );

  if (!isValidSignature) return null;

  const payload = decodePayload(base64Payload);
  if (!payload?.id || !payload?.role || !payload?.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}
