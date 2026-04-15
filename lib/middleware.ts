import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAuthTokenEdge } from "./auth-token-edge";

type Role = "ADMIN" | "SUPER_ADMIN" | "CANDIDATE";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/public",
  "/",
];

const roleAccessMap: Record<string, Role[]> = {
  "/admin/dashboard/user-management": ["SUPER_ADMIN"],
  "/admin/dashboard/template": ["SUPER_ADMIN"],
  "/admin/dashboard/evaluation": ["SUPER_ADMIN"],
  "/admin/dashboard/assignment-setting": ["SUPER_ADMIN"],
  "/admin/dashboard/procedure-document": ["SUPER_ADMIN"],
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/user": ["CANDIDATE"],
};

function isPublicPath(pathname: string) {
  if (pathname === "/user/job") return true;
  if (pathname.startsWith("/user/apply-job/")) {
    return !pathname.includes("/question-screening");
  }
  if (pathname.startsWith("/apply/ref/")) return true;
  if (pathname.startsWith("/ref/")) return true;

  return PUBLIC_PATHS.some((p) => {
    if (p === "/") return pathname === "/";
    return pathname === p || pathname.startsWith(`${p}/`);
  });
}

function getMatchedRule(pathname: string): [string, Role[]] | undefined {
  let bestMatch: [string, Role[]] | undefined;

  for (const entry of Object.entries(roleAccessMap)) {
    const [prefix, roles] = entry;
    if (pathname.startsWith(prefix)) {
      if (!bestMatch || prefix.length > bestMatch[0].length) {
        bestMatch = [prefix, roles];
      }
    }
  }

  return bestMatch;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const token = req.cookies.get("auth_token")?.value;
  const session = await verifyAuthTokenEdge(token, secret);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const matchedRule = getMatchedRule(pathname);
  if (matchedRule) {
    const [, allowedRoles] = matchedRule;
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  return NextResponse.next();
}
