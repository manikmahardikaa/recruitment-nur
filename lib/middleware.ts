// middleware.ts
import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * JANGAN pakai import { Role } from "@prisma/client" di middleware.
 * Pakai string union biasa supaya aman di Edge Runtime.
 */
type Role = "ADMIN" | "SUPER_ADMIN" | "CANDIDATE";

// Halaman publik (kalau nanti pakai matcher global / route lain)
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/public",
  "/",
];

// Mapping prefix route → role yang boleh akses
const roleAccessMap: Record<string, Role[]> = {
  // HANYA SUPER_ADMIN boleh akses user-management
  "/admin/dashboard/user-management": ["SUPER_ADMIN"],
  "/admin/dashboard/template": ["SUPER_ADMIN"],
  "/admin/dashboard/evaluation": ["SUPER_ADMIN"],
  "/admin/dashboard/assignment-setting": ["SUPER_ADMIN"],
  "/admin/dashboard/procedure-document": ["SUPER_ADMIN"],

  // Halaman lain di bawah /admin boleh ADMIN & SUPER_ADMIN
  "/admin": ["ADMIN", "SUPER_ADMIN"],

  // contoh lain: semua route /user hanya untuk CANDIDATE
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

/**
 * Helper biar rule yang PALING SPESIFIK (prefix terpanjang) yang kepakai.
 * Jadi "/admin/dashboard/user-management" bakal menang dibanding "/admin".
 */
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

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // @ts-expect-error - next-auth inject token ke req
    const token = req.nextauth.token as { role?: Role } | null;

    const isPublic = isPublicPath(pathname);
    if (isPublic) {
      return NextResponse.next();
    }

    const matchedRule = getMatchedRule(pathname);

    // Kalau ada aturan role & user sudah login tapi role tidak cocok → tendang ke /403
    if (matchedRule && token?.role) {
      const [, allowedRoles] = matchedRule;

      if (!allowedRoles.includes(token.role)) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Di sini cuma cek "perlu login atau tidak".
       * Kalau `authorized` return false → NextAuth redirect ke pages.signIn ("/login").
       */
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // route publik boleh diakses tanpa login
        if (isPublicPath(pathname)) return true;

        // sisanya: asalkan ada token (sudah login)
        return !!token;
      },
    },
  }
);

// Route yang dilewatin middleware
// config ada di root middleware.ts agar matcher terbaca oleh Next.js
