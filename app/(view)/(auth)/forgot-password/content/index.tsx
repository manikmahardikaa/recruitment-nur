"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Form, Input, notification } from "antd";
import Image from "next/image";

import { primaryColor } from "@/app/utils/color";
import styles from "../../auth.module.css";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordContent() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ForgotPasswordFormValues>();

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notification.error({
          message: "Request failed",
          description: data?.message ?? "Unable to send reset email.",
        });
        return;
      }

      notification.success({
        message: "Check your email",
        description:
          "If an account exists for this email, we sent a reset link.",
      });
      form.resetFields();
    } catch (error) {
      notification.error({
        message: "Request failed",
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
              Recover access to your <span>OSS</span> candidate account
            </h1>
            <p className={styles.subtitle}>
              Enter the email you used to register, and we will send a secure
              link to reset your password.
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
                  Secure account recovery via email
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.formHeaderTitle}>Forgot your password?</p>
                <p className={styles.formHeaderSubtitle}>
                  We&apos;ll email you a reset link. It&apos;s valid for 60
                  minutes.
                </p>
              </div>

              <p className={styles.formHelper}>
                Use the email associated with your Nur Cahaya Tunggal Recruitment account.
              </p>

              <Form
                layout="vertical"
                onFinish={handleSubmit}
                form={form}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Email is required." },
                    { type: "email", message: "Email format is invalid." },
                  ]}
                >
                  <Input placeholder="name@example.com" size="large" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    style={{
                      width: "100%",
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                    }}
                  >
                    Send reset link
                  </Button>
                </Form.Item>
              </Form>

              <div className={styles.formFooter}>
                <span>Remembered your password?</span>
                <Link href="/login">Back to sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
