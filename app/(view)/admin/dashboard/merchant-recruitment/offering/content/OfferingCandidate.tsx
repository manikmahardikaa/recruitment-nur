"use client";

import React from "react";
import { Card, Col, Empty, Row, Space } from "antd";

import type { ApplicantDataModel } from "@/app/models/applicant";
import CandidateInfoPanel from "@/app/components/common/information-panel";
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
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <CandidateInfoPanel
          email={candidate.user.email}
          phone={candidate.user.phone}
          dateOfBirth={candidate.user.date_of_birth}
          jobName={candidate.job?.job_title}
          appliedAt={candidate.createdAt}
          stage={candidate.stage}
          updatedAt={candidate.updatedAt}
          cvUrl={candidate.user.curiculum_vitae_url}
          portfolioUrl={candidate.user.portfolio_url}
        />
      </Col>
      <Col xs={24} md={16}>
        <Space
          direction="vertical"
          size={12}
          style={{ width: "100%", display: "block" }}
        >
          <OfferContractManager candidate={candidate} />
        </Space>
      </Col>
    </Row>
  );
}
