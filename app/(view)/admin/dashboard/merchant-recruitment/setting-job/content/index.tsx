"use client";

import { useState, useMemo } from "react";
import { Flex, Form, Input, Tabs, Typography, Empty, message } from "antd";
import Title from "antd/es/typography/Title";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

import { useJob, useJobs } from "@/app/hooks/job";
import { JobDataModel, JobPayloadUpdateModel } from "@/app/models/job";

import CustomButton from "@/app/components/common/custom-buttom";
import JobModal from "@/app/components/common/modal/admin/job";
import JobCard from "./JobCards";
import { useRouter, useSearchParams } from "next/navigation";
import { buildJobPayload } from "@/app/(view)/admin/dashboard/merchant-recruitment/setting-job/utils";

const { Text } = Typography;

export default function SettingJobContent() {
  const [form] = Form.useForm<JobDataModel>();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [selectedJob, setSelectedJob] = useState<JobDataModel | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "inactive" | "draft">(
    "all"
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const merchantId = searchParams.get("merchant_id");

  const queryString = merchantId
    ? `merchant_id=${encodeURIComponent(merchantId)}`
    : undefined;
  const {
    data: jobsData = [],
    onCreate: jobCreate,
    onCreateLoading: jobLoadingCreate,
    onDelete: onDeleteJob,
  } = useJobs({ queryString });

  const { onUpdate: jobUpdate, onUpdateLoading: jobLoadingUpdate } = useJob({
    id: selectedJob?.id || "",
  });

  const filtered = useMemo(() => {
    const bySearch = (j: JobDataModel) =>
      j.job_title.toLowerCase().includes(search.toLowerCase());

    const byTab = (j: JobDataModel) => {
      if (tab === "active") return j.is_published === true;
      if (tab === "inactive") return j.is_published === false;
      if (tab === "draft") return j.is_published === false;
      return true;
    };

    return jobsData.filter((j) => bySearch(j) && byTab(j));
  }, [jobsData, search, tab]);

  const handleEdit = (id: string) => {
    router.push(
      `/admin/dashboard/merchant-recruitment/setting-job/create?jobId=${encodeURIComponent(
        id
      )}${merchantId ? `&merchant_id=${encodeURIComponent(merchantId)}` : ""}`
    );
  };

  const handleFinish = async (values: JobDataModel) => {
    try {
      const payload = buildJobPayload(values);
      if (merchantId) {
        (payload as JobPayloadUpdateModel).merchant_id = merchantId;
      }

      if (modalType === "create") {
        await jobCreate(payload);
      } else if (selectedJob?.id) {
        await jobUpdate({ id: selectedJob.id, payload });
      }

      form.resetFields();
      setSelectedJob(null);
      setModalOpen(false);
      setModalType("create");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to save job. Please try again."
      );
    }
  };

  const handleTogglePublish = async (id: string, next: boolean) => {
    const current = jobsData.find((j) => j.id === id);
    if (!current) return;
    try {
      const payload: JobPayloadUpdateModel = {
        is_published: next,
      };
      await jobUpdate({ id, payload });
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to update job status."
      );
    }
  };

  return (
    <div>
      <Title level={4}>Job Management</Title>

      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={12}
        style={{ marginBottom: 16 }}
      >
        <Input
          style={{ maxWidth: 360 }}
          prefix={<SearchOutlined />}
          placeholder="Search job title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <CustomButton
          title="Add Job"
          onClick={() => {
            router.push(
              `/admin/dashboard/merchant-recruitment/setting-job/create${
                merchantId
                  ? `?merchant_id=${encodeURIComponent(merchantId)}`
                  : ""
              }`
            );
          }}
          icon={<PlusOutlined />}
        />
      </Flex>

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as typeof tab)}
        items={[
          {
            key: "all",
            label: (
              <>
                All <TagCount count={jobsData.length} />
              </>
            ),
          },
          {
            key: "active",
            label: (
              <>
                Active{" "}
                <TagCount
                  count={jobsData.filter((j) => j.is_published).length}
                />
              </>
            ),
          },
          {
            key: "inactive",
            label: (
              <>
                Inactive{" "}
                <TagCount
                  count={jobsData.filter((j) => !j.is_published).length}
                />
              </>
            ),
          },
          {
            key: "draft",
            label: (
              <>
                Drafts{" "}
                <TagCount
                  count={jobsData.filter((j) => !j.is_published).length}
                />
              </>
            ),
          },
        ]}
      />

      <InfoTip />

      {filtered.length === 0 ? (
        <Empty description="No jobs found" style={{ marginTop: 24 }} />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={handleEdit}
              onDelete={onDeleteJob}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      )}

      <JobModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          form.resetFields();
          setSelectedJob(null);
          setModalType("create");
        }}
        form={form}
        type={modalType}
        initialValues={
          modalType === "update" ? selectedJob ?? undefined : undefined
        }
        handleFinish={handleFinish}
        loadingCreate={jobLoadingCreate}
        loadingUpdate={jobLoadingUpdate}
      />

    </div>
  );
}

function TagCount({ count }: { count: number }) {
  return (
    <span
      style={{
        background: "#f0f2f5",
        borderRadius: 12,
        padding: "0 8px",
        marginLeft: 6,
        fontSize: 12,
      }}
    >
      {count}
    </span>
  );
}

function InfoTip() {
  return (
    <div
      style={{
        border: "1px solid #e6f4ff",
        background: "#e6f4ff88",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <Text>
        Tips: Process applicants regularly to keep your job visible and attract
        more candidates.
      </Text>
    </div>
  );
}
