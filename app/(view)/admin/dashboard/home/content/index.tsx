"use client";

import { FileSearchOutlined, ShopOutlined, TeamOutlined } from "@ant-design/icons";
import {
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo } from "react";

import { useCandidates } from "@/app/hooks/applicant";
import { useJobs } from "@/app/hooks/job";
import { useMerchants } from "@/app/hooks/merchant";
import {
  SUMMARY_STAGE_CONFIG,
  SummaryStageKey,
  stageMatches,
} from "@/app/utils/recruitment-stage";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;

type StageSummary = Record<SummaryStageKey, number>;

const stageOrder: SummaryStageKey[] = [
  "screening",
  "interview",
  "offering",
  "hired",
];

const stageColors: Record<SummaryStageKey, string> = {
  screening: "#1677ff",
  interview: "#fa8c16",
  offering: "#722ed1",
  hired: "#52c41a",
  rejected: "#ff4d4f",
  waiting: "#bfbfbf",
};

export default function DashboardContent() {
  const { data: candidates, fetchLoading: candidatesLoading } = useCandidates({
    queryString: "",
  });
  const { data: jobs, fetchLoading: jobsLoading } = useJobs({
    queryString: "",
  });
  const { data: merchants, fetchLoading: merchantsLoading } = useMerchants();
  const loading = candidatesLoading || jobsLoading || merchantsLoading;

  const stageSummary = useMemo<StageSummary>(() => {
    const base = SUMMARY_STAGE_CONFIG.reduce((acc, curr) => {
      acc[curr.key] = 0;
      return acc;
    }, {} as StageSummary);

    candidates?.forEach((candidate) => {
      SUMMARY_STAGE_CONFIG.forEach((config) => {
        if (stageMatches(candidate.stage, ...config.stages)) {
          base[config.key] += 1;
        }
      });
    });

    return base;
  }, [candidates]);

  const totalApplicants = candidates?.length ?? 0;
  const newThisWeek = useMemo(() => {
    if (!candidates) return 0;
    const lastWeek = dayjs().subtract(7, "day");
    return candidates.filter((candidate) =>
      candidate.createdAt ? dayjs(candidate.createdAt).isAfter(lastWeek) : false
    ).length;
  }, [candidates]);

  const openJobs = jobs?.filter((job) => job.is_published).length ?? 0;
  const closingSoon = useMemo(() => {
    if (!jobs) return 0;
    return jobs.filter((job) =>
      dayjs(job.until_at).isBefore(dayjs().add(7, "day"))
    ).length;
  }, [jobs]);

  const topJobs = useMemo(() => {
    if (!candidates || !jobs) return [];
    const counts = new Map<
      string,
      {
        id: string;
        name: string;
        merchantName: string;
        applicants: number;
        isPublished: boolean;
      }
    >();
    const jobsById = new Map(jobs.map((job) => [job.id, job]));

    candidates.forEach((candidate) => {
      const jobId = candidate.job?.id ?? candidate.job_id ?? "unassigned";
      const jobFromList = jobsById.get(jobId);
      const jobName =
        candidate.job?.job_title ?? jobFromList?.job_title ?? "Unassigned";
      const merchantName = candidate.merchant?.name ?? "—";
      const published =
        candidate.job?.is_published ?? jobFromList?.is_published ?? false;
      const current = counts.get(jobId) ?? {
        id: jobId,
        name: jobName,
        merchantName,
        applicants: 0,
        isPublished: published,
      };
      current.applicants += 1;
      if (!current.merchantName || current.merchantName === "—") {
        current.merchantName = merchantName;
      }
      counts.set(jobId, current);
    });

    if (!counts.size) {
      return jobs.slice(0, 5).map((job) => ({
        id: job.id,
        name: job.job_title,
        merchantName: job.merchant?.name ?? "—",
        applicants: 0,
        isPublished: job.is_published,
      }));
    }

    return [...counts.values()]
      .sort((a, b) => b.applicants - a.applicants)
      .slice(0, 5);
  }, [candidates, jobs]);

  const latestCandidates = useMemo(() => {
    if (!candidates) return [];
    return [...candidates]
      .sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      )
      .slice(0, 6);
  }, [candidates]);

  const summaryCards = [
    {
      key: "applicants",
      title: "Total Applicants",
      value: totalApplicants,
      helper: `+${newThisWeek} new this week`,
      icon: <TeamOutlined />,
      color: "#1677ff",
    },
    {
      key: "merchants",
      title: "Total Merchant",
      value: merchants?.length ?? 0,
      helper: "Active recruiting partners",
      icon: <ShopOutlined />,
      color: "#10b981",
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Recruitment Dashboard
        </Title>
        <Text type="secondary">
          Monitor your talent pipeline, interviews, and job performance at a
          glance.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {summaryCards.map((card) => (
          <Col key={card.key} xs={24} sm={12} xl={6}>
            <Card
              hoverable
              // onMouseEnter={card.onMouseEnter}
              onClick={card.onClick}
            >
              <Space align="start" size={16}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: `${card.color}14`,
                    color: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">{card.title}</Text>
                  <div style={{ marginTop: 4 }}>
                    {(card.loading ?? loading) ? (
                      <Skeleton.Input
                        active
                        size="small"
                        style={{ width: 120 }}
                      />
                    ) : (
                      <Title level={3} style={{ marginBottom: 0 }}>
                        {card.value}
                      </Title>
                    )}
                  </div>
                  <Text type="secondary">{card.helper}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Pipeline Overview">
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {stageOrder.map((key) => {
                  const config = SUMMARY_STAGE_CONFIG.find(
                    (item) => item.key === key
                  );
                  if (!config) return null;
                  const count = stageSummary[key] ?? 0;
                  const percent = totalApplicants
                    ? Math.round((count / totalApplicants) * 100)
                    : 0;
                  return (
                    <div key={key}>
                      <Space
                        align="center"
                        style={{ width: "100%", marginBottom: 4 }}
                      >
                        <Text strong style={{ flex: 1 }}>
                          {config.label}
                        </Text>
                        <Text type="secondary">{count} candidates</Text>
                      </Space>
                      <Progress
                        percent={percent}
                        showInfo
                        strokeColor={stageColors[key]}
                      />
                    </div>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Job Health">
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Statistic
                  title="Open roles"
                  value={openJobs}
                  prefix={<FileSearchOutlined />}
                />
                <Statistic
                  title="Closing within 7 days"
                  value={closingSoon}
                  valueStyle={{ color: closingSoon ? "#fa8c16" : undefined }}
                />
                <Table
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: "Merchant",
                      dataIndex: "merchantName",
                      key: "merchantName",
                    },
                    { title: "Position", dataIndex: "name", key: "name" },
                    {
                      title: "Applicants",
                      dataIndex: "applicants",
                      key: "applicants",
                      width: 100,
                    },
                    {
                      title: "Status",
                      key: "status",
                      width: 90,
                      render: (_, record: (typeof topJobs)[number]) => (
                        <Tag color={record.isPublished ? "green" : "gold"}>
                          {record.isPublished ? "Open" : "Draft"}
                        </Tag>
                      ),
                    },
                  ]}
                  dataSource={topJobs.map((job) => ({
                    key: job.id,
                    ...job,
                  }))}
                  locale={{ emptyText: "No applicant data yet" }}
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Latest applicants">
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : latestCandidates.length ? (
              <List
                itemLayout="horizontal"
                dataSource={latestCandidates}
                pagination={{ pageSize: 5 }}
                renderItem={(candidate) => (
                  <List.Item key={candidate.id}>
                    <List.Item.Meta
                      title={
                        <Space size={10} wrap>
                          <Text strong style={{ fontSize: 16 }}>
                            {candidate.user?.name ?? "Candidate"}
                          </Text>
                          <Tag color="blue">
                            {candidate.job?.job_title ?? "—"}
                          </Tag>
                          <Tag color="geekblue">
                            {candidate.merchant?.name ??
                              candidate?.merchant?.name ??
                              "—"}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space size={12} wrap>
                          <Text type="secondary">
                            {dayjs(candidate.createdAt).fromNow()}
                          </Text>
                          <Tag color="processing" style={{ borderRadius: 999 }}>
                            {candidate.stage ?? "APPLICATION"}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Applicants by Merchant">
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : merchants?.length ? (
              <Table
                size="small"
                pagination={{ pageSize: 6 }}
                rowKey={(row) => row.id}
                columns={[
                  { title: "Merchant", dataIndex: "name", key: "name" },
                  {
                    title: "Jobs",
                    dataIndex: "_count",
                    key: "jobs",
                    width: 100,
                    render: (value) => value?.jobs ?? 0,
                  },
                  {
                    title: "Applicants",
                    dataIndex: "_count",
                    key: "applicants",
                    width: 120,
                    render: (value) => value?.applicants ?? 0,
                  },
                ]}
                dataSource={merchants}
                locale={{ emptyText: "No merchant data yet" }}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
