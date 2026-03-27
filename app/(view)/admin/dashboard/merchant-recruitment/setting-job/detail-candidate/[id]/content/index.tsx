import { useUser } from "@/app/hooks/user";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  ProfileOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useParams } from "next/navigation";

const { Title, Text } = Typography;

export default function DetailCandidateContent() {
  const params = useParams<{ id: string }>();
  const candidateIdParam = params?.id;
  const candidateId = Array.isArray(candidateIdParam)
    ? candidateIdParam[0]
    : candidateIdParam ?? "";

  const { data, fetchLoading } = useUser({ id: candidateId });

  if (!candidateId) {
    return (
      <Card>
        <Empty description="Candidate ID is missing" />
      </Card>
    );
  }

  if (fetchLoading) {
    return (
      <Card>
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <Empty description="Candidate not found" />
      </Card>
    );
  }

  const initials = data.name?.[0]?.toUpperCase() ?? data.email?.[0]?.toUpperCase() ?? "?";
  const formattedDob = data.date_of_birth
    ? dayjs(data.date_of_birth).format("DD MMMM YYYY")
    : "-";
  const formattedCreated = dayjs(data.createdAt).format("DD MMM YYYY • HH:mm");
  const formattedUpdated = dayjs(data.updatedAt).format("DD MMM YYYY • HH:mm");

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        <Space align="start" size={24} style={{ width: "100%" }}>
          <Avatar
            size={96}
            src={data.photo_url}
            icon={!data.photo_url ? <UserOutlined /> : undefined}
          >
            {!data.photo_url ? initials : null}
          </Avatar>
          <Space direction="vertical" size={6} style={{ flex: 1 }}>
            <Space align="center" size={12}>
              <Title level={3} style={{ margin: 0 }}>
                {data.name}
              </Title>
              <Tag color="geekblue">{data.role}</Tag>
            </Space>
            <Text type="secondary">{data.email}</Text>
            <Space size={[8, 8]} wrap>
              {(data.interestTags ?? []).length ? (
                data.interestTags.map((interest) => (
                  <Tag key={`${data.id}-${interest.interest}`} color="blue">
                    {interest.interest}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">No interest tags added yet</Text>
              )}
            </Space>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Personal Information">
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
              <InfoRow
                icon={<IdcardOutlined />}
                label="Identity Number"
                value={data.no_identity ?? "-"}
              />
              <InfoRow
                icon={<CalendarOutlined />}
                label="Date of Birth"
                value={formattedDob}
              />
              <InfoRow
                icon={<TagOutlined />}
                label="Unique Code"
                value={data.no_unique ?? "-"}
              />
              <InfoRow
                icon={<CalendarOutlined />}
                label="Gender"
                value={data.gender ?? "-"}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Contact & Location">
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
              <InfoRow
                icon={<MailOutlined />}
                label="Email"
                value={data.email}
              />
              <InfoRow
                icon={<PhoneOutlined />}
                label="Phone"
                value={data.phone ?? "-"}
              />
              <InfoRow
                icon={<EnvironmentOutlined />}
                label="Address"
                value={data.address ?? "-"}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Documents & Portfolio">
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <DocumentLink label="Curriculum Vitae" url={data.curiculum_vitae_url} />
              <DocumentLink label="Portfolio" url={data.portfolio_url} />
              <DocumentLink label="Identity Document" url={data.no_identity_url} />
              <DocumentLink label="Member Card" url={data.member_card_url} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recruitment Details">
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
              <InfoRow
                icon={<ProfileOutlined />}
                label="Linked Job"
                value={data.job_id ? `Job ID: ${data.job_id}` : "Not linked to a job yet"}
              />
              <InfoRow
                icon={<CalendarOutlined />}
                label="Created At"
                value={formattedCreated}
              />
              <InfoRow
                icon={<CalendarOutlined />}
                label="Last Updated"
                value={formattedUpdated}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <Space align="start" size={12} style={{ width: "100%" }}>
      <span style={{ color: "#1677ff" }}>{icon}</span>
      <Space direction="vertical" size={2} style={{ flex: 1 }}>
        <Text type="secondary">{label}</Text>
        {typeof value === "string" || typeof value === "number" ? (
          <Text strong>{value}</Text>
        ) : (
          value
        )}
      </Space>
    </Space>
  );
}

type DocumentLinkProps = {
  label: string;
  url?: string | null;
};

function DocumentLink({ label, url }: DocumentLinkProps) {
  return (
    <Space direction="vertical" size={2}>
      <Text type="secondary">{label}</Text>
      {url ? (
        <Typography.Link href={url} target="_blank" rel="noopener noreferrer">
          View document
        </Typography.Link>
      ) : (
        <Text type="secondary">No document uploaded</Text>
      )}
    </Space>
  );
}
