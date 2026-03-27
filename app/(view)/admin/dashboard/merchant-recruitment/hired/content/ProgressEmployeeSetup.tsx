import { Alert, Empty, Progress, Space, Tag, Typography } from "antd";
import type { ApplicantEmployeeSetupDataModel } from "@/app/models/applicant-employee-setup";

const { Text } = Typography;

type Props = {
  data?: ApplicantEmployeeSetupDataModel[];
  loading?: boolean;
  emptyDescription?: string;
  loadingMessage?: string;
};

const getQuestionStatus = (
  question: ApplicantEmployeeSetupDataModel["employeeSetup"]["employeeSetupQuestion"][number]
) => {
  const answer = question.employeeSetupAnswers?.[0];
  return Boolean(answer?.is_done);
};

export default function ProgressEmplyeeSetupContent({
  data = [],
  loading = false,
  emptyDescription = "This candidate does not have any employee setup assigned.",
  loadingMessage = "Loading employee setup progress…",
}: Props) {
  if (loading) {
    return <Alert type="info" message={loadingMessage} showIcon />;
  }

  if (!data.length) {
    return (
      <Empty
        description={emptyDescription}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {data.map((assignment) => {
        const questions = assignment.employeeSetup?.employeeSetupQuestion ?? [];
        const completed = questions.filter(getQuestionStatus).length;
        const percent = questions.length
          ? Math.round((completed / questions.length) * 100)
          : 0;

        return (
          <div
            key={assignment.id}
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div>
                <Text strong>{assignment.employeeSetup?.name}</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue">{questions.length} Activities</Tag>
                </div>
              </div>
              <div style={{ minWidth: 200 }}>
                <Text type="secondary" style={{ display: "block" }}>
                  Progress
                </Text>
                <Progress
                  percent={percent}
                  size="small"
                  status={percent === 100 ? "success" : "active"}
                />
                <Text type="secondary">
                  {completed}/{questions.length} completed
                </Text>
              </div>
            </div>
          </div>
        );
      })}
    </Space>
  );
}
