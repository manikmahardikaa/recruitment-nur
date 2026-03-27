/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApplicantDataModel } from "@/app/models/applicant";
import { formatDate } from "@/app/utils/date-helper";
import { getStageLabel } from "@/app/utils/recruitment-stage";
import { HistoryOutlined, UserOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type { RecruitmentStage } from "@prisma/client";

export default function Columns({
  onDetail,
  onHistory,
}: {
  onDetail: (id: string) => void;
  onHistory: (id: string) => void;
}) {
  const columnDefinitions = [
    {
      title: "No",
      width: 60,
      align: "center" as const,
      render: (_: unknown, __: ApplicantDataModel, idx: number) => idx + 1,
    },
    {
      title: "Candidate Name",
      render: (_: unknown, record: ApplicantDataModel) => {
        return <span>{record.user?.name ?? "-"}</span>;
      },
    },
    {
      title: "Email",
      render: (_: unknown, record: ApplicantDataModel) => {
        return <span>{record.user?.email ?? "-"}</span>;
      },
    },
    {
      title: "Phone Number",
      render: (_: unknown, record: ApplicantDataModel) => {
        return <span>{record.user?.phone ?? "-"}</span>;
      },
    },
    {
      title: "Status",
      render: (_: unknown, record: ApplicantDataModel) => {
        return <StatusTag stage={record.stage} />;
      },
    },
    {
      title: "Apply For",
      render: (_: unknown, record: ApplicantDataModel) => (
        <span>{record.job?.job_title ?? "-"}</span>
      ),
    },
    {
      title: "Last Updated At",
      dataIndex: "updatedAt",
      render: (value: string) => (value ? formatDate(value) : "-"),
    },
    {
      title: "Action",
      width: 120,
      render: (_: unknown, record: ApplicantDataModel) => (
        <ActionButtons
          id={record.id}
          openDetail={onDetail}
          onHistory={onHistory}
        />
      ),
    },
  ];

  return columnDefinitions;
}

const StatusTag = ({
  stage,
}: {
  stage?: RecruitmentStage | null;
}) => {
  const text = getStageLabel(stage);
  return (
    <span
      style={{
        backgroundColor: "#1E1E1E",
        color: "#fff",
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        display: "inline-block",
        fontWeight: 500,
      }}
    >
      {text}
    </span>
  );
};

const ActionButtons = ({
  id,
  openDetail,
  onHistory,
}: {
  id: string;
  openDetail: (id: string) => void;
  onHistory: (id: string) => void;
}) => (
  <div style={{ display: "flex", gap: 8 }}>
    <Button
      type="primary"
      shape="circle"
      icon={<UserOutlined />}
      onClick={() => openDetail(id)}
    />
    <Button
      type="default"
      shape="circle"
      icon={<HistoryOutlined />}
      onClick={() => onHistory(id)}
    />
  </div>
);
