"use client";

import FormLogin, { LoginFormValues } from "@/app/components/common/form/login";
import { notification } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import styles from "../../auth.module.css";

export default function LoginContent() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      const rawCallbackUrl = searchParams?.get("callbackUrl");
      const safeCallbackUrl =
        rawCallbackUrl &&
        rawCallbackUrl.startsWith("/") &&
        !rawCallbackUrl.startsWith("//")
          ? rawCallbackUrl
          : null;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        user?: { role?: "SUPER_ADMIN" | "ADMIN" | "CANDIDATE" };
      };

      if (!response.ok || !result.success) {
        notification.error({
          message: "Sign in failed",
          description: result?.message ?? "Invalid email or password.",
        });
        return;
      }

      const role = result?.user?.role;

      notification.success({ message: "Signed in successfully" });
      if (safeCallbackUrl) {
        router.replace(safeCallbackUrl);
        return;
      }
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        router.replace("/admin/dashboard/home");
        return;
      }

      router.replace("/user/job");
    } catch (error) {
      notification.error({
        message: "Sign in failed",
        description:
          error instanceof Error ? error.message : "Unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const highlightStats = [
    { value: "120+", label: "Active openings every month" },
    { value: "50+", label: "Trusted hiring partners" },
    { value: "24/7", label: "Responsive candidate support" },
  ];

  return (
    <div className={styles.wrapper}>
      <span className={`${styles.glow} ${styles.glowPrimary}`} />
      <span className={`${styles.glow} ${styles.glowSecondary}`} />

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.leftPane}>
            <span className={styles.badge}>
              Nur Cahaya Tunggal Recruitment Platform
            </span>
            <h1 className={styles.title}>
              Explore thousands of overseas job <span>opportunities</span> from
              trusted companies.
            </h1>
            <p className={styles.subtitle}>
              Discover roles from diverse employers, track each hiring step
              clearly, and get support throughout your application journey.
            </p>

            <ul className={styles.highlights}>
              {highlightStats.map((item) => (
                <li key={item.label} className={styles.highlightItem}>
                  <span className={styles.statValue}>{item.value}</span>
                  <span className={styles.statLabel}>{item.label}</span>
                </li>
              ))}
            </ul>

            <div className={styles.infoCard}>
              <div className={styles.infoCardImage}>
                <Image
                  src="/assets/images/icon.png"
                  alt="Nur Cahaya Tunggal Recruitment"
                  width={64}
                  height={64}
                  priority
                  unoptimized
                />
              </div>
              <div className={styles.infoCardText}>
                <span className={styles.infoTitle}>
                  Centralized Nur Cahaya Tunggal recruitment portal
                </span>
                <span className={styles.infoSubtitle}>
                  Trusted by hundreds of professionals every month
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.formHeaderTitle}>Welcome Back</p>
                <p className={styles.formHeaderSubtitle}>
                  Sign in to continue your recruitment journey.
                </p>
              </div>

              <p className={styles.formHelper}>
                Use the email and password associated with your candidate
                account.
              </p>

              <FormLogin onFinish={handleLogin} loading={loading} />

              <div className={styles.formFooter} style={{ marginTop: 12 }}>
                <Link href="/forgot-password">Forgot your password?</Link>
              </div>

              <div className={styles.formFooter}>
                <span>Don&apos;t have an account?</span>
                <Link href="/register">Create one now</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
