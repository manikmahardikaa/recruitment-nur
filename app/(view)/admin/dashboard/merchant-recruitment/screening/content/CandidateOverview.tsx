"use client";
import React, { useMemo } from "react";
import { Row, Col, Space, Tabs, Empty } from "antd";
import type { ApplicantDataModel } from "@/app/models/applicant";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import CandidateInfoPanel from "@/app/components/common/information-panel";
import { PDFViewer } from "@/app/utils/pdf-viewer";
import AnswerScreening from "./AnswerScreening";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrain,
  faFilePdf,
  faFolderOpen,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import MBTITestComponent from "./MBTITest";
import DISCTest from "./DSICTest";
dayjs.extend(utc);
dayjs.extend(timezone);

export default function CandidateOverview({
  candidate,
  onCreateMbtiTest,
  isCreatingMbtiTest = false,
}: {
  candidate: ApplicantDataModel | null;
  onCreateMbtiTest: () => void;
  isCreatingMbtiTest?: boolean;
}) {
  const tabs = useMemo(
    () => [
      {
        key: "cv",
        label: (
          <Space>
            <FontAwesomeIcon icon={faFilePdf} />
            Curriculum Vitae
          </Space>
        ),
        children: <PDFViewer src={candidate?.user?.curiculum_vitae_url} />,
      },
      {
        key: "cert",
        label: (
          <Space>
            <FontAwesomeIcon icon={faFolderOpen} />
            Portofolio
          </Space>
        ),
        children: <PDFViewer src={candidate?.user?.portfolio_url} />,
      },
      // {
      //   key: "screening",
      //   label: (
      //     <Space>
      //       <FontAwesomeIcon icon={faListCheck} />
      //       Screening Answers
      //     </Space>
      //   ),
      //   children: <AnswerScreening applicantId={candidate?.id as string} />,
      // },
      // {
      //   key: "mbti",
      //   label: (
      //     <Space>
      //       <FontAwesomeIcon icon={faBrain} />
      //       MBTI Test
      //     </Space>
      //   ),
      //   children: (
      //     <MBTITestComponent
      //       stage={candidate?.stage ?? null}
      //       mbtiTest={candidate?.mbti_test ?? null}
      //       onCreateMbtiTest={onCreateMbtiTest}
      //       isCreating={isCreatingMbtiTest}
      //     />
      //   ),
      // },
      // {
      //   key: "dsic",
      //   label: (
      //     <Space>
      //       <FontAwesomeIcon icon={faBrain} />
      //       DISC Test
      //     </Space>
      //   ),
      //   children: <DISCTest></DISCTest>,
      // },
    ],
    [
      candidate?.id,
      candidate?.user?.curiculum_vitae_url,
      candidate?.user?.portfolio_url,
      candidate?.mbti_test,
      candidate?.mbti_test?.link_url,
      candidate?.mbti_test?.id,
      candidate?.mbti_test?.is_complete,
      candidate?.mbti_test?.createdAt,
      candidate?.mbti_test?.updatedAt,
      candidate?.stage,
      onCreateMbtiTest,
      isCreatingMbtiTest,
    ]
  );

  if (!candidate) {
    return (
      <div
        style={{
          height: 560,
          display: "grid",
          placeItems: "center",
          color: "#bfbfbf",
        }}
      >
        <Empty description="No Candidate Selected" />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {/* LEFT PANEL */}
      <Col xs={24} md={8}>
        {/* Profile card */}

        {/* Contact info */}
        <CandidateInfoPanel
          email={candidate.user?.email}
          phone={candidate.user?.phone}
          dateOfBirth={candidate.user?.date_of_birth}
          jobName={candidate.job?.job_title}
          appliedAt={candidate?.createdAt}
          updatedAt={candidate?.updatedAt}
          link_test_mbti={candidate.mbti_test?.link_url}
          stage={candidate.stage}
        />
      </Col>

      {/* RIGHT PANEL */}
      <Col xs={24} md={16}>
        <Tabs
          items={tabs}
          defaultActiveKey="cv"
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 8,
          }}
          tabBarStyle={{ marginBottom: 12 }}
        />
      </Col>
    </Row>
  );
}
