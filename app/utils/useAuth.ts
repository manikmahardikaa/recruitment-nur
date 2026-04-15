"use client";

import { useSession } from "next-auth/react";

export const useAuth = () => {
  const { data: session, status } = useSession();
  return {
    user_id: session?.user?.id,
    user_name: session?.user?.name,
    isAuthenticated: status === "authenticated",
    role: session?.user?.role,
    loading: status === "loading",
  };
};
