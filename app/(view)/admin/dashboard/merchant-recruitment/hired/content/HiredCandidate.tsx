"use client";

import React from "react";
import { Card, Col, Empty, Row, Space } from "antd";

import type { ApplicantDataModel } from "@/app/models/applicant";
import CandidateOverview from "@/app/(view)/admin/dashboard/merchant-recruitment/screening/content/CandidateOverview";

type Props = {
  candidate: ApplicantDataModel | null;
};

export default function HiredCandidate({ candidate }: Props) {
  if (!candidate) {
    return (
      <Card style={{ borderRadius: 14, minHeight: 320 }}>
        <Empty description="No Candidate Selected" />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <CandidateOverview candidate={candidate} />
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card style={{ borderRadius: 14 }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <strong>Hired Summary</strong>
              <div>Employee setup & schedule features have been removed.</div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
