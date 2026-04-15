"use client";

import { useQuery } from "@tanstack/react-query";

type AuthRole = "SUPER_ADMIN" | "ADMIN" | "CANDIDATE";
type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

type SessionResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

async function fetchAuthSession(): Promise<SessionResponse> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return { authenticated: false, user: null };
  }

  return (await response.json()) as SessionResponse;
}

export const useAuth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchAuthSession,
    staleTime: 30_000,
  });

  return {
    user_id: data?.user?.id,
    user_name: data?.user?.name,
    isAuthenticated: Boolean(data?.authenticated && data?.user),
    role: data?.user?.role,
    loading: isLoading,
  };
};
