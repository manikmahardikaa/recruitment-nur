"use client";

import React from "react";
import { Alert, Card, Space, Typography } from "antd";
import type { ApplicantDataModel } from "@/app/models/applicant";

const { Text } = Typography;

type Props = {
  candidate: ApplicantDataModel;
};

export default function OfferContractManager({ candidate }: Props) {
  return (
    <Card style={{ borderRadius: 14 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Text strong>Offering Information</Text>
        <Alert
          showIcon
          type="warning"
          message="Contract template is unavailable"
          description="Fitur kontrak/template offering telah dihapus. Anda masih bisa melanjutkan proses offering tanpa membuat dokumen dari template."
        />
        <Space direction="vertical" size={4}>
          <Text type="secondary">Candidate</Text>
          <Text strong>{candidate.user?.name ?? "Candidate"}</Text>
          <Text type="secondary">Position</Text>
          <Text strong>{candidate.job?.job_title ?? "—"}</Text>
        </Space>
      </Space>
    </Card>
  );
}
