"use client";

import React from "react";
import { Card, Col, Empty, Row, Space } from "antd";

import type { ApplicantDataModel } from "@/app/models/applicant";
import CandidateOverview from "@/app/(view)/admin/dashboard/merchant-recruitment/screening/content/CandidateOverview";
import OfferContractManager from "@/app/(view)/admin/dashboard/merchant-recruitment/offering/content/OfferContractManager";

type Props = {
  candidate: ApplicantDataModel | null;
};

export default function OfferingCandidate({ candidate }: Props) {
  if (!candidate) {
    return (
      <Card style={{ borderRadius: 14, minHeight: 320 }}>
        <Empty description="Select a candidate to manage the offer" />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <CandidateOverview
        candidate={candidate}
        onCreateMbtiTest={() => {}}
        isCreatingMbtiTest={false}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <OfferContractManager candidate={candidate} />
        </Col>
      </Row>
    </Space>
  );
}
