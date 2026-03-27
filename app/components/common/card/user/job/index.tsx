import { Button, Card, Row, Col, Typography, Tag, Space } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import stripHtml from "@/app/utils/strip-html";
import { JobDataModel } from "@/app/models/job";
import { useRouter } from "next/navigation";

const { Text } = Typography;

const formatEnum = (value?: string | null) => {
  if (!value) return "-";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function JobCard({ job }: { job: JobDataModel }) {
  const hoursLeft = dayjs(job.until_at).diff(dayjs(), "hour");
  const deadlineStr =
    hoursLeft < 0
      ? "Closed"
      : hoursLeft < 24
      ? `${hoursLeft} hours left`
      : `${Math.floor(hoursLeft / 24)} days left`;

  const router = useRouter();
  const workTypeLabel = formatEnum(job.arrangement);
  const employmentLabel = formatEnum(job.commitment);
  const merchantName = job.merchant?.name || "Merchant Name"
  const locationLabel = job.location?.name || "Flexible";
  const isClosed = hoursLeft < 0;
  return (
    <Card
      bodyStyle={{ padding: 24 }}
      style={{
        borderRadius: 20,
        boxShadow: "0 18px 36px rgba(15,23,42,0.08)",
        border: "1px solid rgba(148,163,184,0.25)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))",
        backdropFilter: "blur(4px)",
      }}
    >
      <Row
        align="middle"
        justify="space-between"
        style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}
      >
        <Col>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>
            {job.job_title} | {merchantName}
          </Text>
          <br />
          <Space size="small" wrap style={{ marginTop: 10 }}>
            <Tag color="blue">{workTypeLabel}</Tag>
            <Tag color="geekblue">{employmentLabel}</Tag>
            <Tag color="default">{locationLabel}</Tag>
            <Tag color={isClosed ? "default" : "green"}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              {deadlineStr}
            </Tag>
          </Space>
        </Col>
        <Col />
      </Row>
      <Text style={{ color: "#475569", fontSize: 16, lineHeight: 1.6 }}>
        {stripHtml(job.description).slice(0, 120)}...
      </Text>
      <Row justify="end" style={{ marginTop: 22, gap: 12 }}>
        {/* <Button
          size="large"
          style={{
            borderColor: "#d0d5dd",
            color: "#1f2937",
            borderRadius: 12,
            fontWeight: 600,
            padding: "0 22px",
          }}
        >
          View Detail
        </Button> */}
        <Button
          type="primary"
          size="large"
          style={{
            background: "#2467e7",
            borderRadius: 12,
            fontWeight: 600,
            padding: "0 26px",
            boxShadow: "0 12px 20px rgba(36,103,231,0.25)",
          }}
          onClick={() => {
            router.push(`/user/apply-job/${job.id}`);
          }}
        >
          Apply Now
        </Button>
      </Row>
    </Card>
  );
}
