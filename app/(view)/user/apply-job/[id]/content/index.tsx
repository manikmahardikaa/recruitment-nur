"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  TeamOutlined,
  // ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

import { useJob } from "@/app/hooks/job";
import {
  useCandidateByUserId,
  useCandidates,
} from "@/app/hooks/applicant";
import { useMobile } from "@/app/hooks/use-mobile";
import { sanitizeHtml } from "@/app/utils/sanitize-html";
import { toCapitalized } from "@/app/utils/capitalized";
// import PreviewComponent from "../../../home/profile/content/PreviewComponent";
import formatSalary from "@/app/utils/format-salary";

const { Title, Text } = Typography;

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(47, 84, 235, 0.12)",
          display: "grid",
          placeItems: "center",
          color: "#2F54EB",
          flexShrink: 0,
          boxShadow: "inset 0 0 0 1px rgba(47, 84, 235, 0.15)",
        }}
      >
        {icon}
      </div>
      <div>
        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
          {title}
        </Title>
        {subtitle && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {subtitle}
          </Text>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Page ----------------------------------- */
export default function ApplyJobContent() {
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data, fetchLoading: isJobLoading } = useJob({ id: id ?? "" });
  const isMobile = useMobile();
  const jobData = data;
  const jobId = id;
  const isLoading = isJobLoading;
  const { onCreate: createApplicant, onCreateLoading: isApplying } =
    useCandidates({ disableNotification: true });
  const { data: myApplicants = [] } = useCandidateByUserId({
    id: session?.user?.id,
  });

  const isAlreadyApplied = useMemo(() => {
    if (!session?.user?.id || !jobId) return false;
    return myApplicants.some((app) => app.job_id === jobId);
  }, [jobId, myApplicants, session?.user?.id]);

  const overviewHTML = useMemo(
    () => sanitizeHtml(jobData?.description ?? ""),
    [jobData?.description],
  );

  const submitApplication = async () => {
    if (status === "loading") return;
    const userId = session?.user?.id;
    if (!userId) {
      const target = id ? `/user/apply-job/${id}` : "/user/apply-job";
      router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
      return;
    }
    if (isAlreadyApplied) {
      message.warning("You have already applied for this job.");
      return;
    }
    if (!jobId) {
      message.error("Job information is unavailable.");
      return;
    }
    try {
      await createApplicant({
        user_id: userId,
        job_id: jobId,
      });
      message.success("Application submitted.");
      router.push("/user/home/apply-job");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseMessage =
          (error.response?.data as { message?: string; details?: string })
            ?.details ||
          (error.response?.data as { message?: string; details?: string })
            ?.message;
        message.error(
          responseMessage || error.message || "Failed to submit application.",
        );
        return;
      }
      if (error instanceof Error) {
        message.error(error.message || "Failed to submit application.");
        return;
      }
      message.error("Failed to submit application.");
    }
  };

  const formattedClosingDate = jobData?.until_at
    ? dayjs(jobData.until_at).format("dddd, DD MMM YYYY")
    : undefined;
  const formattedLocation = jobData?.location
    ? `${toCapitalized(jobData.location.name)} • ${jobData.location.address}`
    : undefined;

  const metaItems: MetaItem[] = [
    {
      label: "Employment Type",
      value: formatLabel(jobData?.commitment),
    },
    {
      label: "Work Arrangement",
      value: formatLabel(jobData?.arrangement),
    },
    {
      label: "Salary Range",
      value: jobData?.show_salary
        ? formatSalary(jobData?.salary_min, jobData?.salary_max)
        : "Confidential",
    },
    {
      label: "Application Deadline",
      value: formattedClosingDate,
    },
    {
      label: "Location",
      value: formattedLocation,
      href: jobData?.location?.maps_url,
      icon: <EnvironmentOutlined />,
    },
  ].filter((item) => Boolean(item.value)) as MetaItem[];

  const stats: StatItem[] = [
    {
      label: "In Process",
      description: "Candidates still progressing",
      value: jobData?.stats?.connected ?? 0,
    },
  ];

  if (!isLoading && !jobData) {
    return (
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "16px 16px 48px" : "28px 24px 72px",
        }}
      >
        <Empty description="Job information is unavailable." />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: isMobile ? "16px 16px 32px" : "28px 24px 48px",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <Space
        direction="vertical"
        size={isMobile ? 16 : 24}
        style={{ width: "100%" }}
      >
        <HeroCard
          isMobile={isMobile}
          isLoading={isLoading}
          jobName={jobData?.job_title}
          locationLabel={formattedLocation}
          closingDate={formattedClosingDate}
          onApply={submitApplication}
        />

        <Row gutter={isMobile ? [16, 16] : [24, 24]}>
          <Col xs={24} lg={15}>
            <Space direction="vertical" size={24} style={{ width: "100%" }}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                  border: "1px solid rgba(226,232,240,0.9)",
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                }}
                bodyStyle={{ padding: 24 }}
              >
                <SectionHeader
                  icon={<FileTextOutlined />}
                  title="Role Overview"
                  subtitle="Understand what the team is looking for"
                />
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <div
                    style={{
                      whiteSpace: "pre-line",
                      padding: "12px 0",
                      color: "rgba(15, 23, 42, 0.85)",
                      lineHeight: 1.75,
                      fontSize: 14.5,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: overviewHTML || "<p>No overview provided.</p>",
                    }}
                  />
                )}
              </Card>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Card
              bordered={false}
              style={{
                borderRadius: 18,
                boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                border: "1px solid rgba(226,232,240,0.9)",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <SectionHeader
                icon={<CalendarOutlined />}
                title="Key Job Details"
                subtitle="Quick facts to help you decide"
              />
              <Space direction="vertical" style={{ width: "100%" }} size={16}>
                {metaItems.map((item) => (
                  <MetaInfoRow key={item.label} {...item} />
                ))}
              </Space>
            </Card>

            <Card
              bordered={false}
              style={{
                borderRadius: 18,
                color: "#E2E8F0",
                marginTop: "20px",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Space align="center">
                  <TeamOutlined style={{ color: "#9DB7FF", fontSize: 18 }} />
                  <div>
                    <Text>Recruitment Pulse</Text>
                    <Text type="secondary" style={{ display: "block" }}>
                      Latest pipeline insights
                    </Text>
                  </div>
                </Space>
                <Row gutter={[12, 12]}>
                  {stats.map((stat) => (
                    <Col xs={12} key={stat.label}>
                      <StatCard {...stat} />
                    </Col>
                  ))}
                </Row>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card
          bordered={false}
          style={{
            borderRadius: 18,
            background:
              "linear-gradient(135deg, rgba(79,129,255,0.12) 0%, rgba(96,110,255,0.08) 100%)",
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Row
            gutter={[16, 16]}
            align={isMobile ? "stretch" : "middle"}
            style={{ textAlign: isMobile ? "left" : "inherit" }}
          >
            <Col xs={24} md={16}>
              <Title level={4} style={{ margin: 0 }}>
                Ready to move forward?
              </Title>
              <Text type="secondary">
                Submit your application to let recruiters know you are
                interested.
              </Text>
              <div style={{ marginTop: 12 }}>
                <Tag
                  color={isAlreadyApplied ? "red" : "green"}
                  style={{ borderRadius: 999, padding: "2px 10px" }}
                >
                  {isAlreadyApplied
                    ? "Already applied"
                    : "Eligible to apply"}
                </Tag>
              </div>
            </Col>
            <Col
              xs={24}
              md={8}
              style={{ textAlign: isMobile ? "left" : "right" }}
            >
              <Button
                type="primary"
                size="large"
                style={{
                  width: isMobile ? "100%" : 200,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #1f4ed8 0%, #5a67f2 100%)",
                }}
                onClick={submitApplication}
                loading={isApplying}
                disabled={isAlreadyApplied}
              >
                {isAlreadyApplied ? "Already Applied" : "Submit Application"}
              </Button>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}

type MetaItem = {
  label: string;
  value: string;
  href?: string;
  icon?: React.ReactNode;
};

function MetaInfoRow({ label, value, href, icon }: MetaItem) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(248, 250, 252, 0.9)",
        border: "1px solid rgba(226, 232, 240, 0.9)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "#EEF2FF",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon ?? <CalendarOutlined style={{ color: "#1D39C4" }} />}
      </div>
      <div style={{ flex: 1 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {label}
        </Text>
        {href ? (
          <Typography.Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block", fontWeight: 600 }}
          >
            {value}
          </Typography.Link>
        ) : (
          <Text style={{ display: "block", fontWeight: 600 }}>{value}</Text>
        )}
      </div>
    </div>
  );
}

type StatItem = {
  label: string;
  value: number;
  description: string;
};

function StatCard({ label, value, description }: StatItem) {
  return (
    <Card
      bordered={false}
      style={{
        background: "rgba(255,255,255,0.14)",
        borderRadius: 14,
        color: "#E2E8F0",
        border: "1px solid rgba(148, 163, 184, 0.25)",
      }}
      bodyStyle={{ padding: 16 }}
    >
      <Text style={{ fontSize: 28, fontWeight: 700, display: "block" }}>
        {value}
      </Text>
      <Text style={{ display: "block", fontWeight: 600 }}>{label}</Text>
      <Text style={{ fontSize: 12, lineHeight: 1.4 }}>{description}</Text>
    </Card>
  );
}

type HeroCardProps = {
  isLoading: boolean;
  jobName?: string;
  locationLabel?: string;
  closingDate?: string;
  onApply: () => void;
  isMobile: boolean;
};

function HeroCard({
  isLoading,
  jobName,
  locationLabel,
  closingDate,
  isMobile,
}: HeroCardProps) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 24,
        background: "linear-gradient(135deg, #1d2760 0%, #1f4ed8 100%)",
        color: "white",
        boxShadow: "0 24px 48px rgba(29, 78, 216, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
      bodyStyle={{ padding: isMobile ? 20 : 32 }}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 2 }} title />
      ) : (
        <Space
          direction="vertical"
          size={isMobile ? 8 : 12}
          style={{ width: "100%" }}
        >
          <Space size={[8, 8]} wrap>
            <Tag
              style={{
                borderRadius: 999,
                border: "none",
                background: "rgba(255,255,255,0.16)",
                color: "#E0EAFF",
                fontWeight: 600,
              }}
            >
              Apply For
            </Tag>
            {locationLabel && (
              <Tag
                style={{
                  borderRadius: 999,
                  border: "none",
                  background: "rgba(255,255,255,0.16)",
                  color: "#E0EAFF",
                  fontWeight: 600,
                }}
              >
                {locationLabel}
              </Tag>
            )}
            {closingDate && (
              <Tag
                style={{
                  borderRadius: 999,
                  border: "none",
                  background: "rgba(253,224,71,0.25)",
                  color: "#FDE68A",
                  fontWeight: 600,
                }}
              >
                Close on {closingDate}
              </Tag>
            )}
          </Space>
          <Title level={2} style={{ color: "white", margin: 0 }}>
            {jobName ?? "Job Title"}
          </Title>
          <Text style={{ color: "rgba(226,232,240,0.85)" }}>
            Showcase your experience and demonstrate why you are the right fit
            for this opportunity.
          </Text>
          {/* <Button
            type="primary"
            size="large"
            style={{ width: "fit-content", marginTop: 8 }}
            onClick={onApply}
          >
            Submit Application
          </Button> */}
        </Space>
      )}
    </Card>
  );
}

function formatLabel(value?: string | null) {
  if (!value) return undefined;
  return toCapitalized(value.replace(/_/g, " "));
}
