"use client";

import React, { useMemo } from "react";
import {
  Avatar,
  Card,
  Col,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
  Button,
  Progress,
  Badge,
} from "antd";
import {
  CheckCircleTwoTone,
  SearchOutlined,
  MessageOutlined,
  LaptopOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ApplicantDataModel } from "@/app/models/applicant";
import {
  PROGRESS_STAGE_ORDER,
  getStageLabel,
  toProgressStage,
} from "@/app/utils/recruitment-stage";
 

const { Title, Text } = Typography;

type Props = {
  applicant: ApplicantDataModel;
  meta?: {
    screeningStartedOn?: string;
    screeningDeadline?: string;
    assignedTo?: string;
    interviewDate?: string;
    offerUrl?: string;
    rejectedReason?: string;
  };
};

const stageOrder = PROGRESS_STAGE_ORDER;

type SummaryMetric = {
  key: string;
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
};

// ---------------- Component ----------------
export default function CandidateProgress({ applicant }: Props) {
  const currentStage = toProgressStage(applicant.stage);
  const nowStageIndex = stageOrder.findIndex((s) => s === currentStage);
  const normalizedStageIndex = nowStageIndex === -1 ? 0 : nowStageIndex;
  const initials =
    (applicant.user?.name || "Candidate")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";

  const progressTotal =
    currentStage === "REJECTED"
      ? stageOrder.length
      : Math.max(stageOrder.length - 1, 1);
  const progressPosition = Math.min(normalizedStageIndex + 1, progressTotal);
  const stageProgressPercent = Math.round(
    (progressPosition / progressTotal) * 100,
  );
  const nextStageKey =
    normalizedStageIndex < stageOrder.length - 1
      ? stageOrder[normalizedStageIndex + 1]
      : null;
  const nextStageLabel =
    nextStageKey != null
      ? getStageLabel(nextStageKey)
      : currentStage === "REJECTED"
        ? "Process Closed"
        : "Journey Complete";
  const statusValue = getStageLabel(currentStage);
  const summaryMetrics = useMemo<SummaryMetric[]>(
    () => [
      {
        key: "submitted",
        label: "Submitted",
        value: dayjs(applicant.createdAt).format("MMM D, YYYY"),
        caption: "Application received",
      },
      {
        key: "status",
        label: "Status",
        value: statusValue,
        caption: `Current stage • ${getStageLabel(currentStage)}`,
      },
      {
        key: "next",
        label: nextStageKey ? "Next Milestone" : "Pipeline Status",
        value: nextStageLabel,
        caption: nextStageKey ? "Next stage pending" : "No outstanding actions",
      },
    ],
    [
      applicant.createdAt,
      currentStage,
      nextStageKey,
      nextStageLabel,
      statusValue,
    ],
  );

  const stepsItems = useMemo(
    () =>
      stageOrder.map((stageKey, index) => {
        const isCompleted = normalizedStageIndex > index;
        const isCurrent = normalizedStageIndex === index;
        const status: "finish" | "process" | "wait" = isCompleted
          ? "finish"
          : isCurrent
            ? "process"
            : "wait";
        let descriptor: string;
        if (isCompleted) {
          descriptor = "Completed";
        } else if (isCurrent) {
          descriptor = stageKey === "REJECTED" ? "Closed" : "In progress";
        } else {
          descriptor = stageKey === "REJECTED" ? "N/A" : "Pending";
        }

        return {
          title: getStageLabel(stageKey),
          description: descriptor,
          icon:
            stageKey === "APPLICATION" ? (
              <FileTextOutlined />
            ) : stageKey === "SCREENING" ? (
              <SearchOutlined />
            ) : stageKey === "INTERVIEW" ? (
              <MessageOutlined />
            ) : stageKey === "OFFERING" ? (
              <FileDoneOutlined />
            ) : stageKey === "HIRING" ? (
              <LaptopOutlined />
            ) : (
              <CloseCircleOutlined />
            ),
          status,
        };
      }),
    [normalizedStageIndex],
  );

  return (
    <div
      style={{
        padding: "48px clamp(16px, 5vw, 72px)",
      }}
    >
      <div
        style={{
          margin: "0 auto",
        }}
      >
        <Space direction="vertical" size={24} style={{ display: "flex" }}>
          <Card
            bordered={false}
            style={{
              borderRadius: 24,
              background:
                "linear-gradient(130deg, rgba(44,62,180,1) 0%, rgba(100,71,229,1) 55%, rgba(137,107,255,1) 100%)",
              color: "#fff",
              boxShadow: "0 24px 60px rgba(60,51,153,0.35)",
            }}
            bodyStyle={{ padding: 32 }}
          >
            <Row gutter={[24, 24]} align="middle" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={18}>
                  <Badge
                    status="processing"
                    text={
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>
                        Apply Job Progress Tracking
                      </span>
                    }
                  />
                  <Space align="center" size={20}>
                    <Avatar
                      size={72}
                      src={applicant.user?.photo_url || undefined}
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        color: "#fff",
                        fontSize: 28,
                        fontWeight: 600,
                        border: "2px solid rgba(255,255,255,0.35)",
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Space direction="vertical" size={4}>
                      <Title level={3} style={{ margin: 0, color: "#fff" }}>
                        {applicant.merchant?.name ||
                          applicant.merchant?.name ||
                          "Candidate"}{" "}
                        ·{" "}
                        {applicant.job?.job_title || "—"}
                      </Title>
                      <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                        Application ID: #
                        {applicant.id.toUpperCase().slice(0, 8)}
                      </Text>
                      <Tag
                        color="success"
                        style={{
                          borderRadius: 999,
                          padding: "2px 12px",
                          width: "fit-content",
                        }}
                      >
                        Current Stage — {getStageLabel(currentStage)}
                      </Tag>
                    </Space>
                  </Space>
                </Space>
              </Col>
              <Col>
                <Space direction="vertical" align="center">
                  <Progress
                    type="circle"
                    percent={stageProgressPercent}
                    size={120}
                    strokeColor="#ffce73"
                    trailColor="rgba(255,255,255,0.25)"
                    format={(percent) => (
                      <span style={{ color: "#fff", fontWeight: 600 }}>
                        {percent}%
                      </span>
                    )}
                  />
                  <Button
                    size="large"
                    style={{
                      background: "#ffce73",
                      borderColor: "#ffce73",
                      color: "#1e2b5c",
                      fontWeight: 600,
                      boxShadow: "0 12px 24px rgba(255,206,115,0.35)",
                    }}
                    onClick={() =>
                      window.open("https://wa.me/6281338948759", "_blank")
                    }
                    icon={<MessageOutlined />}
                  >
                    Contact Recruiter
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[20, 20]}>
            {summaryMetrics.map((metric) => (
              <Col xs={24} md={8} key={metric.key}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 18,
                    background: "#ffffff",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
                    height: "100%",
                  }}
                  bodyStyle={{ padding: 20, height: "100%" }}
                >
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ display: "flex" }}
                  >
                    <Text
                      type="secondary"
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                        fontSize: 12,
                      }}
                    >
                      {metric.label}
                    </Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {metric.value}
                    </Title>
                    <Text type="secondary">{metric.caption}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              background: "#ffffff",
              boxShadow: "0 20px 56px rgba(15,23,42,0.12)",
            }}
            title={
              <Space align="center">
                <CheckCircleTwoTone twoToneColor="#52c41a" />
                <span>Pipeline Timeline</span>
              </Space>
            }
            bodyStyle={{ paddingTop: 12 }}
          >
            <Steps
              current={normalizedStageIndex}
              responsive
              items={stepsItems}
            />
          </Card>
        </Space>
      </div>
    </div>
  );
}
