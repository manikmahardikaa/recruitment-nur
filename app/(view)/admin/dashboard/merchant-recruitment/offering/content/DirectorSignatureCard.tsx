"use client";

import React from "react";
import dayjs from "dayjs";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import { MailOutlined, DownloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  hasExistingContract: boolean;
  hasDirectorSigned: boolean;
  directorSignatureRequestedAt: string | Date | null;
  directorSignatureSignedAt: string | Date | null;
  directorEmail: string;
  isDirectorEmailValid: boolean;
  showDirectorEmailError: boolean;
  onDirectorEmailChange: (value: string) => void;
  onRequestSignature: () => void;
  requestLoading: boolean;
  directorSignatureUrl: string | null;
  directorSignedPdfUrl: string | null;
  candidateSignedPdfUrl: string | null;
};

export default function DirectorSignatureCard({
  hasExistingContract,
  hasDirectorSigned,
  directorSignatureRequestedAt,
  directorSignatureSignedAt,
  directorEmail,
  isDirectorEmailValid,
  showDirectorEmailError,
  onDirectorEmailChange,
  onRequestSignature,
  requestLoading,
  directorSignatureUrl,
  directorSignedPdfUrl,
  candidateSignedPdfUrl,
}: Props) {
  const requestedLabel = directorSignatureRequestedAt
    ? dayjs(directorSignatureRequestedAt).format("MMM D, YYYY HH:mm")
    : null;
  const isDirectorSigned = Boolean(
    directorSignatureSignedAt || directorSignedPdfUrl
  );
  const signedLabel = directorSignatureSignedAt
    ? dayjs(directorSignatureSignedAt).format("MMM D, YYYY HH:mm")
    : directorSignedPdfUrl
    ? "Director PDF uploaded"
    : null;
  const directorFileUrl = directorSignedPdfUrl || directorSignatureUrl;
  const directorFileLabel = directorSignedPdfUrl
    ? "View director signed PDF"
    : "View uploaded director document";

  return (
    <Card
      style={{ borderRadius: 14, marginTop: 12 }}
      title={
        <Space>
          <MailOutlined />
          <span>Director Signature</span>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Alert
          type={
            hasDirectorSigned
              ? "success"
              : requestedLabel
              ? "info"
              : "warning"
          }
          showIcon
          message={
            hasDirectorSigned
              ? "Signed document received from directors."
              : requestedLabel
              ? "Awaiting director signature. You can resend the email request if needed."
              : "Send the contract to directors for signature."
          }
        />

        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Text strong>Director email</Text>
          <Input
            placeholder="director@example.com"
            value={directorEmail}
            onChange={(event) => onDirectorEmailChange(event.target.value)}
            type="email"
          />
          {showDirectorEmailError ? (
            <Text type="danger">Please enter a valid email address.</Text>
          ) : null}
        </Space>

        <Space align="center" wrap>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={onRequestSignature}
            disabled={!hasExistingContract || !isDirectorEmailValid}
            loading={requestLoading}
          >
            {requestedLabel ? "Resend Request" : "Send Signature Request"}
          </Button>
          {!hasExistingContract ? (
            <Tag>Generate contract first</Tag>
          ) : requestedLabel ? (
            <Tag color="purple">Requested {requestedLabel}</Tag>
          ) : null}
          {isDirectorSigned && signedLabel ? (
            <Tag color="green">
              {directorSignatureSignedAt ? `Signed ${signedLabel}` : signedLabel}
            </Tag>
          ) : null}
        </Space>

        {directorFileUrl ? (
          <Typography.Link
            href={directorFileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {directorFileLabel}
          </Typography.Link>
        ) : (
          <Text type="secondary">
            Candidate-signed PDFs are sent automatically. No manual upload is
            required here. Once the director uploads the final PDF, it will
            appear in this section.
          </Text>
        )}

        {candidateSignedPdfUrl ? (
          <Space size={8} align="center">
            <DownloadOutlined />
            <Link
              href={candidateSignedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View candidate signed PDF
            </Link>
          </Space>
        ) : null}
      </Space>
    </Card>
  );
}
