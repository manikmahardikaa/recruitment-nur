"use client";

export async function logout(callbackUrl = "/login") {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = callbackUrl;
  }
}
