import {
  Card,
  Space,
  Tag,
  Switch,
  Button,
  Typography,
  Divider,
  Flex,
  Dropdown,
  Tooltip,
} from "antd";
import {
  MoreOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { JobDataModel } from "@/app/models/job";

const { Title, Text } = Typography;

type Props = {
  job: JobDataModel;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, next: boolean) => void;
};

const EMPLOYMENT_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
};

const WORK_TYPE_LABEL: Record<string, string> = {
  ONSITE: "Onsite",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};



function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatSalaryRange(min?: number | null, max?: number | null) {
  if (min === null || min === undefined) {
    return formatCurrency(max);
  }
  if (max === null || max === undefined) {
    return formatCurrency(min);
  }
  if (min === max) {
    return formatCurrency(min);
  }
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}




export default function JobCard({
  job,
  onEdit,
  onDelete,
  onTogglePublish,
}: Props) {
  const published = Boolean(job.is_published);
  const menu = {
    items: [
      { key: "edit", label: "Edit", onClick: () => onEdit(job.id) },
      {
        key: "delete",
        danger: true,
        label: "Delete",
        onClick: () => onDelete(job.id),
      },
    ],
  };

  const employmentLabel =
    EMPLOYMENT_LABEL[job.commitment] ?? job.commitment;
  const workTypeLabel = WORK_TYPE_LABEL[job.arrangement] ?? job.arrangement;
  const salaryLabel = job.show_salary
    ? formatSalaryRange(job.salary_min, job.salary_max)
    : "Hidden for candidates";
  const salaryPrefix = job.type_job === "REFFERAL" ? "Reward" : "Salary";

  return (
    <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
        {/* Left: Title + meta */}
        <Space direction="vertical" size={6} style={{ minWidth: 280 }}>
          <Title level={4} style={{ margin: 0 }}>
            {job.job_title}
          </Title>

          <Space size="small">
            <Tooltip title={workTypeLabel}>
              <Tag color="blue">{workTypeLabel}</Tag>
            </Tooltip>
            <Tooltip title={employmentLabel}>
              <Tag color="geekblue">{employmentLabel}</Tag>
            </Tooltip>
          </Space>

          <Space direction="vertical" size={4}>
            <Space size="small">
              <EnvironmentOutlined />
              <Text>
                {job.location?.name || "-"}
                {job.location?.address ? `, ${job.location.address}` : ""}
              </Text>
            </Space>
            <Space size="small">
              <ClockCircleOutlined />
              <Text>
                Active until: {dayjs(job.until_at).format("DD MMM YYYY")}
              </Text>
            </Space>
            <Space size="small">
              <DollarOutlined />
              <Text>
                {salaryPrefix}: {salaryLabel}
              </Text>
            </Space>
          </Space>
        </Space>

        {/* Right: status */}
        <Space align="center">
          <Tag
            color={published ? "green" : "default"}
            style={{ marginRight: 8 }}
          >
            {published ? "Active" : "Inactive"}
          </Tag>
          <Switch
            checked={published}
            onChange={(v) => onTogglePublish(job.id, v)}
          />
          <Dropdown menu={menu} trigger={["click"]}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      </Flex>

      <Divider style={{ margin: "12px 0" }} />

      {/* Stats panel */}
      <Flex gap={12} wrap="wrap">
        {/* <StatBox
          label="Chat Started"
          value={job.stats?.chatStarted ?? 0}
        /> */}
        <StatBox
          label="Connected"
          value={job.stats?.connected ?? 0}
        />
        {/* <StatBox
          label="Not Suitable"
          value={job.stats?.notSuitable ?? 0}
        /> */}
      </Flex>

      <Divider style={{ margin: "12px 0" }} />

      <Flex gap={12} wrap="wrap">
        {/* <Button icon={<ThunderboltOutlined />} type="default">
          Boost Job
        </Button> */}
        {/* <Button onClick={() => onShowRecommendations(job)}>
          Recommended Candidates
        </Button>
        <Button onClick={handleGeneratePoster}>
          Generate Poster
        </Button> */}
      </Flex>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <Card
      size="small"
      style={{ width: 200, borderRadius: 10 }}
      bodyStyle={{ padding: 12, textAlign: "center" }}
    >
      <Title level={4} style={{ margin: 0 }}>
        {value}
      </Title>
      <Text type="secondary">{label}</Text>
    </Card>
  );
}
