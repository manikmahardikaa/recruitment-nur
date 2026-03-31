"use client";

import React from "react";
import { IdcardOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Typography } from "antd";
import type { ApplicantDataModel } from "@/app/models/applicant";

const { Text } = Typography;

type Props = {
  candidate: ApplicantDataModel | null;
  onClose?: () => void;
};

export default function GenerateCardTeamMember({ candidate, onClose }: Props) {
  return (
    <Card
      style={{ borderRadius: 14 }}
      title={
        <Space>
          <IdcardOutlined />
          <span>Generate Team Member Card</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {!candidate && (
          <Alert
            type="warning"
            message="Select a candidate to generate a card."
            showIcon
          />
        )}

        <Alert
          type="warning"
          showIcon
          message="Team member card template is unavailable"
          description="Fitur template kartu team member telah dihapus. Silakan lanjutkan proses offering tanpa generate kartu."
        />

        <Space direction="vertical" size={4}>
          <Text type="secondary">Candidate</Text>
          <Text strong>{candidate?.user?.name ?? "Candidate"}</Text>
          {candidate?.user?.no_unique && (
            <>
              <Text type="secondary">Member ID</Text>
              <Text strong>{candidate.user.no_unique}</Text>
            </>
          )}
        </Space>

        {onClose ? (
          <Button onClick={onClose}>Back to card preview</Button>
        ) : null}
      </Space>
    </Card>
  );
}
