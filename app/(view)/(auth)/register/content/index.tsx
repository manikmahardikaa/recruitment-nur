"use client";

import RegisterForm, {
  RegisterFormValues,
} from "@/app/components/common/form/register";
import { notification } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import styles from "../../auth.module.css";

export default function RegisterContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ?? "Something went wrong while saving your data.",
        );
      }

      notification.success({
        message: "Registration successful",
        description: "Please sign in to start applying for roles.",
      });
      router.push("/login");
    } catch (error) {
      notification.error({
        message: "Registration failed",
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
      });
    } finally {
      setLoading(false);
    }
  };

  const highlightStats = [
    { value: "3 steps", label: "Fast-track onboarding" },
    { value: "1 profile", label: "Apply to multiple roles" },
    { value: "Realtime", label: "Live recruitment tracking" },
  ];

  return (
    <div className={styles.wrapper}>
      <span className={`${styles.glow} ${styles.glowPrimary}`} />
      <span className={`${styles.glow} ${styles.glowSecondary}`} />

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.leftPane}>
            <span className={styles.badge}>
              Start your journey with Nur Cahaya Tunggal
            </span>
            <h1 className={styles.title}>
              Join and experience a <span>more personal</span> recruitment flow
            </h1>
            <p className={styles.subtitle}>
              Manage documents, keep your candidate profile polished, and
              receive real-time updates for every hiring milestone in one modern
              workspace.
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
                  Candidate onboarding support
                </span>
                <span className={styles.infoSubtitle}>
                  Our talent team helps review your profile so it stands out to
                  hiring managers.
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.formHeaderTitle}>
                  Create Candidate Account
                </p>
                <p className={styles.formHeaderSubtitle}>
                  Tell us a few details so we can match you with the right
                  opportunity faster.
                </p>
              </div>

              <p className={styles.formHelper}>
                Your dashboard lets you save progress, upload documents, and get
                personalized recommendations.
              </p>

              <RegisterForm onFinish={handleRegister} loading={loading} />

              <div className={styles.formFooter}>
                <span>Already have an account?</span>
                <Link href="/login">Sign in instead</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
