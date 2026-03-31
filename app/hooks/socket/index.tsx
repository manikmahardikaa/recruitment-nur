"use client";

import { useMemo } from "react";

type SocketAuth = {
  userId?: string;
  token?: string;
};

type NoopSocket = {
  connected: boolean;
  on: () => NoopSocket;
  off: () => NoopSocket;
  emit: () => boolean;
  disconnect: () => void;
};

const normalizeAuth = (auth?: SocketAuth) => {
  if (!auth) return null;
  const userId =
    typeof auth.userId === "string" ? auth.userId.trim() : undefined;
  if (!userId) return null;
  return { ...auth, userId };
};

const noopSocket: NoopSocket = {
  connected: false,
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => false,
  disconnect: () => undefined,
};

export function useSocket(auth?: SocketAuth) {
  const normalizedAuth = useMemo(() => normalizeAuth(auth), [auth]);
  if (!normalizedAuth) return null;
  return noopSocket;
}
