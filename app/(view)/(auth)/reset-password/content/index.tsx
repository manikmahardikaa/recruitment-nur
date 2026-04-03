"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, Input, notification } from "antd";
import Image from "next/image";

import { primaryColor } from "@/app/utils/color";
import styles from "../../auth.module.css";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordContent() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ResetPasswordFormValues>();

  const email = useMemo(() => searchParams?.get("email")?.trim() ?? "", [
    searchParams,
  ]);
  const token = useMemo(() => searchParams?.get("token")?.trim() ?? "", [
    searchParams,
  ]);
  const isReady = Boolean(email && token);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!isReady) return;
    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password: values.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notification.error({
          message: "Reset failed",
          description: data?.message ?? "Unable to reset password.",
        });
        return;
      }

      notification.success({
        message: "Password updated",
        description: "You can now sign in with your new password.",
      });
      form.resetFields();
      router.push("/login");
    } catch (error) {
      notification.error({
        message: "Reset failed",
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
            <span className={styles.badge}>Nur Cahaya Tunggal Recruitment Platform</span>
            <h1 className={styles.title}>
              Set a new <span>secure</span> password
            </h1>
            <p className={styles.subtitle}>
              Create a strong password to keep your Nur Cahaya Tunggal Recruitment profile
              protected.
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
                  Centralized OSS recruitment portal
                </span>
                <span className={styles.infoSubtitle}>
                  Secure password reset in minutes
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.formHeaderTitle}>Reset your password</p>
                <p className={styles.formHeaderSubtitle}>
                  Enter a new password for your account.
                </p>
              </div>

              {!isReady && (
                <Alert
                  type="warning"
                  showIcon
                  message="Reset link is invalid."
                  description="Please request a new password reset email."
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form
                layout="vertical"
                onFinish={handleSubmit}
                form={form}
              >
                <Form.Item
                  name="password"
                  label="New Password"
                  rules={[
                    { required: true, message: "Password is required." },
                    {
                      min: 8,
                      message: "Password must be at least 8 characters.",
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="Minimum 8 characters"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Please confirm your password." },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match.")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Re-enter your password"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={!isReady}
                    size="large"
                    style={{
                      width: "100%",
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                    }}
                  >
                    Update password
                  </Button>
                </Form.Item>
              </Form>

              <div className={styles.formFooter}>
                <span>Need a new link?</span>
                <Link href="/forgot-password">Request another</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
