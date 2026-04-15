"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export default function AuthWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authRoutes = ["/login", "/register", "/"];
  const shouldProtect = !authRoutes.some((route) => {
    const regex = new RegExp(`^${route}(/.*)?$`);
    return regex.test(pathname);
  });

  useEffect(() => {
    if (loading) return;

    if (shouldProtect && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router, shouldProtect]);

  return <>{children}</>;
}
