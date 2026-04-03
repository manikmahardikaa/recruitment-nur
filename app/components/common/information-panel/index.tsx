"use client";

import React from "react";
import { Card, Typography, Space, Divider } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  SendOutlined,
  ReloadOutlined,
  FileTextOutlined,
  FolderOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { formatDate } from "@/app/utils/date-helper";

const { Title, Text, Link } = Typography;

type LeftPanelProps = {
  stage: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | Date | null;
  jobName?: string | null;
  appliedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  cvUrl?: string | null;
  portfolioUrl?: string | null;
};

function RowItem({
  icon,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  primary: React.ReactNode;
  secondary: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ fontSize: 20, color: "#2f66f5", flex: "0 0 auto" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontWeight: 600,
            color: "#0f172a",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {primary}
        </div>
        <Text
          type="secondary"
          style={{ marginTop: 2, display: "inline-block" }}
        >
          {secondary}
        </Text>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Title
      level={4}
      style={{
        color: "#2f66f5",
        margin: 0,
        fontWeight: 800,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </Title>
  );
}

export default function CandidateInfoPanel({
  email,
  phone,
  dateOfBirth,
  jobName,
  appliedAt,
  updatedAt,
  cvUrl,
  portfolioUrl,
  stage,
}: LeftPanelProps) {
  return (
    <Card
      style={{ borderRadius: 14 }}
      bodyStyle={{ padding: 0 }}
      bordered={false}
    >
      {/* Contact Information */}
      <div style={{ padding: "20px 20px 8px" }}>
        <SectionTitle>Contact Information</SectionTitle>
      </div>
      <Divider style={{ margin: "10px 0 0" }} />
      <div style={{ padding: "16px 20px 8px" }}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <RowItem
            icon={<MailOutlined />}
            primary={<span>{email || "-"}</span>}
            secondary="Email"
          />
          <RowItem
            icon={<PhoneOutlined />}
            primary={<span>{phone || "-"}</span>}
            secondary="Phone"
          />
        </Space>
      </div>

      {/* Personal Details */}
      <div style={{ padding: "20px 20px 8px" }}>
        <SectionTitle>Personal Details</SectionTitle>
      </div>
      <Divider style={{ margin: "10px 0 0" }} />
      <div style={{ padding: "16px 20px 8px" }}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <RowItem
            icon={<CalendarOutlined />}
            primary={<span>{formatDate(dateOfBirth)}</span>}
            secondary="Date of Birth"
          />
        </Space>
      </div>

      {/* Application Details */}
      <div style={{ padding: "20px 20px 8px" }}>
        <SectionTitle>Application Details</SectionTitle>
      </div>
      <Divider style={{ margin: "10px 0 0" }} />
      <div style={{ padding: "16px 20px 20px" }}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <RowItem
            icon={<FolderOpenOutlined />}
            primary={<span>{jobName || "-"}</span>}
            secondary="Position"
          />
          <RowItem
            icon={<SendOutlined />}
            primary={<span>{formatDate(appliedAt)}</span>}
            secondary="Applied"
          />
          <RowItem
            icon={<ReloadOutlined />}
            primary={<span>{formatDate(updatedAt)}</span>}
            secondary="Updated"
          />
          {stage !== "SCREENING" && (
            <>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ fontSize: 20, color: "#2f66f5" }}>
                  <FileTextOutlined />
                </div>
                <div>
                  <Link href={cvUrl!} target="_blank" rel="noreferrer">
                    <Space>
                      <LinkOutlined />
                      <span style={{ color: "#2f66f5", fontWeight: 600 }}>
                        View CV
                      </span>
                    </Space>
                  </Link>
                  <div>
                    <Text type="secondary">Resume</Text>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ fontSize: 20, color: "#2f66f5" }}>
                  <FolderOutlined />
                </div>
                <div>
                  <Link href={portfolioUrl!} target="_blank" rel="noreferrer">
                    <Space>
                      <LinkOutlined />
                      <span style={{ color: "#2f66f5", fontWeight: 600 }}>
                        View Portfolio
                      </span>
                    </Space>
                  </Link>
                  <div>
                    <Text type="secondary">Portfolio</Text>
                  </div>
                </div>
              </div>
            </>
          )}
        </Space>
      </div>
    </Card>
  );
}
