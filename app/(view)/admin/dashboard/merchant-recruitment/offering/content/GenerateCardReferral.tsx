import React from "react";
import { IdcardOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Typography } from "antd";

const { Text } = Typography;

type GenerateCardReferralProps = {
  applicant_id: string;
  consultantName?: string;
  candidateName?: string;
  no_unique?: string;
  loading?: boolean;
  onClose?: () => void;
};

export default function GenerateCardReferral({
  candidateName,
  no_unique,
  onClose,
}: GenerateCardReferralProps) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        border: "1px solid #e8ecf4",
      }}
      bodyStyle={{ padding: 16 }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space align="center" size={10}>
          <IdcardOutlined style={{ fontSize: 18, color: "#1d4ed8" }} />
          <Text strong>Referral Card</Text>
        </Space>

        <Alert
          showIcon
          type="warning"
          message="Referral card template is unavailable"
          description="Fitur template kartu referral telah dihapus. Silakan lanjutkan proses offering tanpa generate kartu."
        />

        <Space direction="vertical" size={4}>
          <Text type="secondary">Candidate</Text>
          <Text strong>{candidateName ?? "Candidate"}</Text>
          {no_unique && (
            <>
              <Text type="secondary">Member ID</Text>
              <Text strong>{no_unique}</Text>
            </>
          )}
        </Space>

        {onClose && (
          <Button onClick={onClose} block>
            Close
          </Button>
        )}
      </Space>
    </Card>
  );
}
