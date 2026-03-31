"use client";

import { debounce } from "lodash";
import {
  normalizedWorkType,
  normalizedEmploymentType,
} from "@/app/utils/normalized";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { EmploymentType, WorkType } from "@prisma/client";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Steps,
  Col,
  Row,
  InputNumber,
  Radio,
  Checkbox,
  Space,
  Divider,
  Flex,
  message,
} from "antd";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/app/utils/useAuth";
import RequirementCard from "./RequirmentComponent";
import type { JobSkillSuggestion } from "@/app/vendor/recommeded-skill";
import { useJob, useJobs } from "@/app/hooks/job";
import type {
  JobDataModel,
  JobPayloadCreateModel,
  JobPayloadUpdateModel,
} from "@/app/models/job";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  formatCurrencyIDR,
  parseCurrencyToNumber,
} from "@/app/utils/currency";

dayjs.extend(relativeTime);

const splitTextArea = (value?: string | string[]) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : undefined;
    return responseMessage || error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const { Title, Paragraph, Text } = Typography;

const DRAFT_STORAGE_KEY = "oss-job-create-draft-id";

// Step config (untuk Steps + label)
const STEP_ITEMS = [{ title: "Job Info" }, { title: "Job Description" }];

// Nama field yang divalidasi per step
// (nested field pakai array sesuai prop `name` di Form.Item)
const STEP_FIELD_NAMES: (string | (string | number)[])[][] = [
  // STEP 0: Job Info (sampai Additional mandatory requirements)
  [
    "job_title",
    "job_role",
    "commitment",
    "arrangement",
    ["salary", "min"],
    ["salary", "max"],
    ["requirement", "gender"],
    ["requirement", "skills"],
    ["requirement", "education"],
    ["requirement", "experience"],
    ["requirement", "age", "min"],
    ["requirement", "age", "max"],
  ],
  // STEP 1: Job Description
  [
    ["description", "summary"],
    ["description", "responsibilities"],
  ],
  // STEP 2: Screening Questions (kosong = tidak ada field wajib spesifik)
  [],
];

export default function CreateJobUI({
  jobId,
  merchantId,
}: {
  jobId?: string;
  merchantId?: string;
}) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { user_id, loading: authLoading } = useAuth();

  const isEditMode = Boolean(jobId);
  const [currentStep, setCurrentStep] = useState(0);
  const isFinalStep = currentStep === STEP_ITEMS.length - 1;

  const [jobRoleOptions, setJobRoleOptions] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(jobId ?? null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isInitialChange = useRef(true);
  const [recommendedSkills, setRecommendedSkills] = useState<
    JobSkillSuggestion[]
  >([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const {
    data: draftJob,
    fetchLoading: draftLoading,
    onUpdate: updateJob,
    onPublish: publishJob,
    onPublishLoading,
  } = useJob({ id: draftId || "" });
  const { onCreate: createJob } = useJobs({});

  const jobStatusInfo = useMemo(() => {
    if (isEditMode) {
      if (!draftJob) {
        return { label: "Loading…", color: "#6b7280" };
      }
      if (draftJob.is_published) {
        return { label: "Published", color: "#027a48" };
      }
      if (draftJob.is_draft) {
        return { label: "Draft", color: "#c47400" };
      }
      return { label: "Inactive", color: "#1677ff" };
    }
    return { label: "Draft", color: "#c47400" };
  }, [draftJob, isEditMode]);

  const fetchRecommendedSkills = useCallback(
    async (title: string, role: string) => {
      if (!title || !role) {
        setRecommendedSkills([]);
        return;
      }

      try {
        setLoadingSkills(true);
        const { data } = await axios.post(
          "/api/admin/dashboard/recommended-skill",
          { jobTitle: title, jobRole: role }
        );
        setRecommendedSkills(data);
      } catch (error) {
        console.error("Recommended skills error:", error);
      } finally {
        setLoadingSkills(false);
      }
    },
    []
  );

  const selectedSkills = Form.useWatch(["requirement", "skills"], form) || [];
  const allFormValues = Form.useWatch([], form);
  const hasRestoredDraftRef = useRef(false);
  const lastDraftIdRef = useRef<string | null>(null);
  const createDraftRequestRef = useRef<Promise<any> | null>(null);

  const persistDraftId = useCallback(
    (value: string | null) => {
      if (isEditMode) return;
      if (typeof window === "undefined") return;
      if (value) {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    },
    [isEditMode]
  );

  useEffect(() => {
    if (isEditMode) return;
    if (typeof window === "undefined") return;
    if (draftId) return;
    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored) {
      setDraftId(stored);
    }
  }, [draftId, isEditMode]);

  useEffect(() => {
    if (draftId && draftId !== lastDraftIdRef.current) {
      hasRestoredDraftRef.current = false;
      lastDraftIdRef.current = draftId;
    }
  }, [draftId]);

  useEffect(() => {
    if (!isEditMode) return;
    setDraftId(jobId ?? null);
  }, [isEditMode, jobId]);

  const debouncedFetch = useMemo(
    () =>
      debounce(async (keyword: string) => {
        if (!keyword || keyword.length < 3) {
          controllerRef.current?.abort();
          setJobRoleOptions([]);
          return;
        }

        try {
          setLoadingRecommended(true);

          controllerRef.current?.abort();
          controllerRef.current = new AbortController();

          const { data } = await axios.post(
            "/api/admin/dashboard/recommended-job-role",
            { jobTitle: keyword },
            { signal: controllerRef.current.signal }
          );

          setJobRoleOptions(data);
        } catch (err) {
          if (!axios.isCancel(err)) {
            console.error("Job role error:", err);
          }
        } finally {
          setLoadingRecommended(false);
        }
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  useEffect(() => {
    if (!draftId) {
      hasRestoredDraftRef.current = false;
    }
  }, [draftId]);

  const handleJobTitleChange = useCallback(
    (value: string) => {
      debouncedFetch(value);
      const selectedRole = form.getFieldValue("job_role");
      if (selectedRole) {
        fetchRecommendedSkills(value, selectedRole);
      } else {
        setRecommendedSkills([]);
      }
    },
    [debouncedFetch, fetchRecommendedSkills, form]
  );

  const handleJobRoleChange = useCallback(
    (value: string) => {
      const title = form.getFieldValue("job_title");
      fetchRecommendedSkills(title, value);
    },
    [fetchRecommendedSkills, form]
  );

  const handleAddSuggestedSkill = useCallback(
    (skillName: string) => {
      const normalized = skillName.trim();
      if (!normalized || selectedSkills.includes(normalized)) {
        return;
      }

      const next = [...selectedSkills, normalized].slice(0, 20);
      const requirement = form.getFieldValue("requirement") || {};
      form.setFieldsValue({
        requirement: {
          ...requirement,
          skills: next,
        },
      });
    },
    [form, selectedSkills]
  );

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = async () => {
    const isLastStep = currentStep === STEP_ITEMS.length - 1;
    try {
      if (!isLastStep) {
        const fieldsToValidate = STEP_FIELD_NAMES[currentStep];
        if (fieldsToValidate.length > 0) {
          await form.validateFields(fieldsToValidate as any);
        }
        setCurrentStep((prev) => prev + 1);
      } else {
        // Step terakhir: pastikan semua field valid lalu submit
        await form.validateFields();
        form.submit();
      }
    } catch (err) {
      // AntD sudah otomatis nunjukin error, jadi cukup diam di sini
      console.error("Validation error:", err);
    }
  };

  const autoSaveDraft = useCallback(
    async (
      overrideValues?: Record<string, unknown>,
      options?: { requireUser?: boolean }
    ) => {
      if (!user_id && !isEditMode) {
        if (options?.requireUser) {
          throw new Error(
            authLoading
              ? "Sesi login masih dimuat. Tunggu sebentar lalu coba lagi."
              : "Sesi login tidak ditemukan. Silakan login ulang."
          );
        }
        return;
      }
      if (isEditMode && !draftId) return;
      if (isEditMode && !draftJob) return;

      const values = {
        ...form.getFieldsValue(true),
        ...(overrideValues ?? {}),
      };

      const rawJobTitle =
        typeof values.job_title === "string" ? values.job_title.trim() : "";
      const rawJobRole =
        typeof values.job_role === "string" ? values.job_role.trim() : "";

      const salaryMin = Number(values?.salary?.min);
      const salaryMax = Number(values?.salary?.max);
      const normalizedSalaryMin = Number.isFinite(salaryMin) ? salaryMin : 0;
      const normalizedSalaryMax = Number.isFinite(salaryMax)
        ? salaryMax
        : normalizedSalaryMin;

      const rawUntil = values.until_at;
      let until_at: Date;
      if (rawUntil instanceof Date) {
        until_at = rawUntil;
      } else if (typeof rawUntil === "string" || typeof rawUntil === "number") {
        const d = new Date(rawUntil);
        until_at = Number.isNaN(d.getTime())
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : d;
      } else if (rawUntil && typeof rawUntil.toDate === "function") {
        const d = rawUntil.toDate();
        until_at = Number.isNaN(d.getTime())
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : d;
      } else {
        until_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      const desc = values.description ?? {};
      const summary =
        typeof desc.summary === "string" && desc.summary.trim()
          ? desc.summary.trim()
          : rawJobTitle || rawJobRole || "Draft Job";

      const description_sections = {
        summary,
        responsibilities: desc.responsibilities ?? [],
        nice_to_have: desc.nice_to_have ?? [],
      };

      const resolvedUserId =
        isEditMode && draftJob?.user_id ? draftJob.user_id : user_id;
      const resolvedMerchantId =
        merchantId ?? (draftJob as JobDataModel | null)?.merchant_id ?? null;
      const payload: JobPayloadCreateModel = {
        ...values,
        job_title: rawJobTitle,
        job_role: rawJobRole,
        description: summary,
        description_sections,
        requirement:
          values.requirement && typeof values.requirement === "object"
            ? values.requirement
            : undefined,
        until_at,
        salary_min: normalizedSalaryMin,
        salary_max: normalizedSalaryMax,
        type_job: values.type_job ?? "TEAM_MEMBER",
        arrangement: values.arrangement ?? "ONSITE",
        commitment: values.commitment ?? "FULL_TIME",
        show_salary: Boolean(values.show_salary),
        is_have_domicile: Boolean(values.is_have_domicile),
        user_id: resolvedUserId,
        merchant_id: resolvedMerchantId ?? undefined,
        step: currentStep,
      };

      const resolvedIsDraft = isEditMode
        ? Boolean(draftJob?.is_draft)
        : true;
      const resolvedIsPublished = isEditMode
        ? Boolean(draftJob?.is_published)
        : false;

      payload.is_draft = resolvedIsDraft;
      payload.is_published = resolvedIsPublished;

      try {
        setIsAutoSaving(true);

        let res;
        if (draftId) {
          res = await updateJob({
            id: draftId,
            payload,
          });
        } else {
          if (!createDraftRequestRef.current) {
            createDraftRequestRef.current = createJob(payload).finally(() => {
              createDraftRequestRef.current = null;
            });
          }

          res = await createDraftRequestRef.current;
          const createdId = res?.data?.result?.id ?? res?.data?.id;
          if (createdId) {
            persistDraftId(createdId);
            hasRestoredDraftRef.current = false;
            setDraftId(createdId);
          }
        }

        setLastSavedAt(new Date());
        return res;
      } catch (error) {
        console.error("Auto save draft error:", error);
      } finally {
        setIsAutoSaving(false);
      }
    },
    [
      createJob,
      updateJob,
      currentStep,
      draftId,
      user_id,
      authLoading,
      form,
      persistDraftId,
      isEditMode,
      draftJob,
      merchantId,
    ]
  );

  const debouncedAutoSave = useMemo(
    () =>
      debounce((formValues: any) => {
        autoSaveDraft(formValues);
      }, 1200),
    [autoSaveDraft]
  );

  useEffect(() => {
    return () => {
      debouncedAutoSave.cancel();
    };
  }, [debouncedAutoSave]);

  useEffect(() => {
    if (!allFormValues) return;
    if (isInitialChange.current) {
      isInitialChange.current = false;
      return;
    }
    debouncedAutoSave(allFormValues);
  }, [allFormValues, debouncedAutoSave]);

  useEffect(() => {
    if (!draftId) return;
    if (!draftJob) return;
    if (hasRestoredDraftRef.current) return;

    const descriptionSections =
      (draftJob.description_sections as Record<string, unknown>) ?? {};

    form.setFieldsValue({
      job_title: draftJob.job_title ?? "",
      job_role: draftJob.job_role ?? "",
      arrangement: draftJob.arrangement ?? "ONSITE",
      commitment: draftJob.commitment ?? "FULL_TIME",
      salary: {
        min: draftJob.salary_min ?? undefined,
        max: draftJob.salary_max ?? undefined,
      },
      description: {
        summary: draftJob.description ?? "",
        responsibilities:
          (descriptionSections?.responsibilities as string[]) ?? [],
        nice_to_have: (descriptionSections?.nice_to_have as string[]) ?? [],
      },
      requirement:
        (draftJob.requirement as Record<string, unknown>) ?? undefined,
      until_at: draftJob.until_at ? dayjs(draftJob.until_at) : undefined,
      is_have_domicile: draftJob.is_have_domicile,
      show_salary: draftJob.show_salary,
      type_job: draftJob.type_job,
    } as any);

    if (draftJob.updatedAt) {
      setLastSavedAt(new Date(draftJob.updatedAt));
    }

    hasRestoredDraftRef.current = true;
    isInitialChange.current = true;
  }, [draftId, draftJob, form]);

  useEffect(() => {
    if (isEditMode) return;
    if (!draftId) return;
    if (draftLoading) return;
    if (draftJob) return;
    persistDraftId(null);
    setDraftId(null);
  }, [draftId, draftJob, draftLoading, persistDraftId, isEditMode]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [showManualDescription, setShowManualDescription] = useState(false);

  const handleFinish = useCallback(
    async (values: any) => {
      const resolvedMerchantId =
        merchantId ?? (draftJob as JobDataModel | null)?.merchant_id ?? null;
      if (!resolvedMerchantId && !isEditMode) {
        message.error("Merchant tidak ditemukan. Mohon pilih merchant dulu.");
        return;
      }
      try {
        if (!isEditMode && !user_id) {
          message.error(
            authLoading
              ? "Sesi login masih dimuat. Tunggu sebentar lalu submit lagi."
              : "Sesi login tidak ditemukan. Silakan login ulang."
          );
          return;
        }

        setIsSubmitting(true);
        const response = await autoSaveDraft(values, { requireUser: true });
        const jobId =
          draftId ??
          response?.data?.result?.id ??
          response?.data?.id;

        if (!jobId) {
          message.error("Draft job belum tersimpan. Coba lagi.");
          return;
        }

        if (isEditMode) {
          message.success("Job berhasil diperbarui.");
        } else {
          await publishJob(jobId);
          persistDraftId(null);
          hasRestoredDraftRef.current = false;
          setDraftId(null);
          setLastSavedAt(null);
          form.resetFields();
        }
        router.push(
          `/admin/dashboard/merchant-recruitment/setting-job${
            merchantId ? `?merchant_id=${encodeURIComponent(merchantId)}` : ""
          }`
        );
      } catch (error) {
        console.error("Publish job error:", error);
        const defaultMessage = isEditMode
          ? "Gagal memperbarui job."
          : "Gagal mempublikasikan job.";
        message.error(getErrorMessage(error, defaultMessage));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      autoSaveDraft,
      authLoading,
      draftId,
      publishJob,
      router,
      persistDraftId,
      form,
      isEditMode,
      merchantId,
      draftJob,
      user_id,
    ]
  );

  const handleGenerateJobDescription = useCallback(async () => {
    const jobTitle = form.getFieldValue("job_title");
    const jobRole = form.getFieldValue("job_role");
    if (!jobTitle || !jobRole) {
      message.warning(
        "Lengkapi Job Title dan Job Role sebelum generate deskripsi."
      );
      return;
    }

    const responsibilitiesInput = form.getFieldValue([
      "description",
      "responsibilities",
    ]);
    const requirementsInput = form.getFieldValue([
      "description",
      "nice_to_have",
    ]);
    const skillsInput =
      form.getFieldValue(["requirement", "skills"]) ?? selectedSkills;

    setIsGeneratingDescription(true);
    try {
      setAiFailed(false);
      const { data } = await axios.post(
        "/api/admin/dashboard/generate-job-descriptions",
        {
          jobTitle,
          jobRole,
          location_id: null,
          merchant_id: merchantId ?? null,
          responsibilities: splitTextArea(responsibilitiesInput),
          requirements: splitTextArea(requirementsInput),
          skills: Array.isArray(skillsInput) ? skillsInput : [],
        }
      );

      form.setFieldsValue({
        description: {
          ...form.getFieldValue("description"),
          summary: data.result,
        },
      });
      message.success("Berhasil membuat job description.");
    } catch (error) {
      console.error("Error generating job description:", error);
      message.error("Gagal membuat job description.");
      setAiFailed(true);
      setShowManualDescription(true);
    } finally {
      setIsGeneratingDescription(false);
    }
  }, [form, user_id, selectedSkills]);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingBottom: 48,
        paddingTop: 24,
      }}
    >
      {/* Back Button */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ paddingLeft: 0, marginBottom: 16 }}
      >
        Back to Jobs
      </Button>

      {/* Step Bar */}
      <Steps
        current={currentStep}
        style={{ marginBottom: 32, maxWidth: 1200 }}
        items={STEP_ITEMS}
      />

      {draftId && (
        <Alert
          type="info"
          showIcon
          message={
            <span>
              Status:{" "}
              <Text strong style={{ color: jobStatusInfo.color }}>
                {jobStatusInfo.label}
              </Text>
            </span>
          }
          description={
            lastSavedAt
              ? `Autosaved ${dayjs(lastSavedAt).fromNow()}.`
              : "Autosaved progress."
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* FORM START */}
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        {/* ========== STEP 1: JOB INFO (sampai Additional mandatory requirements) ========== */}
        {currentStep === 0 && (
          <>
            {/* Card #1 - Job Info */}
            <Card style={{ padding: 24, marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 4 }}>
                Job Details & Type
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                Fill in the job information below.
              </Paragraph>

              <Divider />

              {/* Job Title */}
              <Form.Item
                label={<Typography.Text strong>Job Title</Typography.Text>}
                name="job_title"
                rules={[{ required: true, message: "Job title is required" }]}
                tooltip="Enter Job Title"
              >
                <Input
                  placeholder="Add Job Title"
                  size="large"
                  onChange={(e) => handleJobTitleChange(e.target.value)}
                />
              </Form.Item>

              {/* Job Role */}
              <Form.Item
                label={<Typography.Text strong>Job Role</Typography.Text>}
                name="job_role"
                rules={[{ required: true, message: "Job role is required" }]}
                tooltip="Select Job Role"
              >
                <Select
                  size="large"
                  optionLabelProp="data-label"
                  placeholder="Search job role..."
                  loading={loadingRecommended}
                  showSearch
                  filterOption={false}
                  onChange={handleJobRoleChange}
                >
                  {jobRoleOptions.map((role: any) => {
                    const optionLabel = (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{role.title}</div>
                          <div style={{ fontSize: 12, color: "#777" }}>
                            {role.category}
                          </div>
                        </div>

                        {role.isRecommended && (
                          <span
                            style={{
                              background: "#F28B39",
                              color: "white",
                              padding: "1px 10px",
                              borderRadius: 12,
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                    );

                    return (
                      <Select.Option
                        key={role.title}
                        value={role.title}
                        data-label={role.title}
                      >
                        {optionLabel}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>

              {/* Commitment Type */}
              <Form.Item
                label={<Typography.Text strong>Commitment</Typography.Text>}
                name="commitment"
              >
                <Select size="large">
                  {Object.values(EmploymentType).map((type) => (
                    <Select.Option key={type} value={type}>
                      {normalizedEmploymentType(type)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            {/* Work Arrangement */}
            <Card style={{ padding: 24, marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 4 }}>
                Work Arrangement
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                Choose the working arrangement for this role.
              </Paragraph>

              <Divider />

              <Form.Item
                label={
                  <Typography.Text strong>Work Arrangement</Typography.Text>
                }
                name="arrangement"
              >
                <Select size="large">
                  {Object.values(WorkType).map((type) => (
                    <Select.Option key={type} value={type}>
                      {normalizedWorkType(type)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="is_have_domicile"
                valuePropName="checked"
                noStyle
              >
                <RequirementCard
                  title="Require candidate location or wilingness to relocate"
                  descriptions="Candidate will be required to provide their current location or willingness to relocate when applying for this job"
                />
              </Form.Item>
            </Card>

            {/* Card #3 - Salary */}
            <Card style={{ padding: 24, marginBottom: 24 }}>
              <div
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  paddingBottom: 12,
                }}
              >
                <Title level={4} style={{ marginBottom: 4 }}>
                  Salary<span style={{ color: "#ef4444" }}> *</span>
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  We collect candidate expected salary during application, and
                  jobs aligned with it get more applications.
                </Paragraph>
              </div>

              <Row gutter={16} style={{ marginTop: 24 }}>
                <Col span={24} md={12}>
                  <Form.Item
                    label={
                      <Typography.Text strong>Minimum Amount</Typography.Text>
                    }
                    name={["salary", "min"]}
                    rules={[
                      {
                        required: true,
                        message: "Minimum salary is required",
                      },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      min={0 as number}
                      formatter={(value) => formatCurrencyIDR(value)}
                      parser={(value) => parseCurrencyToNumber(value) ?? 0}
                      placeholder="2.000.000"
                    />
                  </Form.Item>
                </Col>
                <Col span={24} md={12}>
                  <Form.Item
                    label={
                      <Typography.Text strong>Maximum Amount</Typography.Text>
                    }
                    name={["salary", "max"]}
                    rules={[
                      {
                        required: true,
                        message: "Maximum salary is required",
                      },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      min={0 as number}
                      formatter={(value) => formatCurrencyIDR(value)}
                      parser={(value) => parseCurrencyToNumber(value) ?? 0}
                      placeholder="5.000.000"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="show_salary" valuePropName="checked" noStyle>
                <div style={{ marginTop: 20 }}>
                  <RequirementCard
                    title="Show salary range to candidates"
                    descriptions="The salary range will be visible to candidates on the job posting."
                  />
                </div>
              </Form.Item>
            </Card>

            {/* Card #4 - Requirements */}
            <Card style={{ padding: 24 }}>
              <div
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  paddingBottom: 12,
                }}
              >
                <Title level={4} style={{ marginBottom: 4 }}>
                  Job Requirements<span style={{ color: "#ef4444" }}> *</span>
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Configure gender, age, skills, education and experience
                  preferences for this job.
                </Paragraph>
              </div>

              <Form.Item
                label="Gender Preference"
                name={["requirement", "gender"]}
              >
                <Radio.Group defaultValue="none">
                  <Radio value="male">Male</Radio>
                  <Radio value="female">Female</Radio>
                  <Radio value="none">No Preference</Radio>
                </Radio.Group>
              </Form.Item>

              <div style={{ marginTop: 12 }}>
                <Typography.Text strong>Age</Typography.Text>
                <Row gutter={12} style={{ marginTop: 8 }}>
                  <Col xs={24} md={10}>
                    <Form.Item name={["requirement", "age", "min"]} noStyle>
                      <InputNumber
                        size="large"
                        style={{ width: "100%" }}
                        placeholder="Min"
                        disabled={form.getFieldValue([
                          "requirement",
                          "age",
                          "noLimit",
                        ])}
                        min={15}
                        max={100}
                      />
                    </Form.Item>
                  </Col>
                  <Col
                    xs={24}
                    md={4}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                    }}
                  >
                    to
                  </Col>
                  <Col xs={24} md={10}>
                    <Form.Item name={["requirement", "age", "max"]} noStyle>
                      <InputNumber
                        size="large"
                        style={{ width: "100%" }}
                        placeholder="Max"
                        disabled={form.getFieldValue([
                          "requirement",
                          "age",
                          "noLimit",
                        ])}
                        min={15}
                        max={100}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name={["requirement", "age", "noLimit"]}
                  valuePropName="checked"
                  style={{ marginTop: 8 }}
                >
                  <Checkbox>No age limit</Checkbox>
                </Form.Item>
              </div>

              <Form.Item
                label={
                  <Typography.Text strong>Skills Required</Typography.Text>
                }
                name={["requirement", "skills"]}
                rules={[
                  {
                    required: true,
                    type: "array",
                    min: 3,
                    message: "Please enter the skills required (min. 3)",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  size="large"
                  tokenSeparators={[","]}
                  placeholder="Search skills"
                  maxCount={20}
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>

              {(loadingSkills || recommendedSkills.length > 0) && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 16,
                    border: "1px dashed #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography.Text strong>Suggested Skills</Typography.Text>
                    {loadingSkills && (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        Updating...
                      </Typography.Text>
                    )}
                  </div>
                  <Space wrap style={{ marginTop: 12, gap: 8 }}>
                    {recommendedSkills.map((skill) => (
                      <Button
                        key={skill.name}
                        icon={<PlusOutlined />}
                        type="default"
                        size="small"
                        onClick={() => handleAddSuggestedSkill(skill.name)}
                        style={{
                          borderRadius: 999,
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                        }}
                      >
                        {skill.name}
                      </Button>
                    ))}
                  </Space>
                </div>
              )}

              <Row gutter={16} style={{ marginTop: 20 }}>
                <Col span={24} md={24}>
                  <Form.Item
                    label={
                      <Typography.Text strong>
                        Minimum Education Level Required
                      </Typography.Text>
                    }
                    name={["requirement", "education"]}
                  >
                    <Select
                      size="large"
                      placeholder="None selected"
                      style={{ maxWidth: 340 }}
                    >
                      <Select.Option value="none">None selected</Select.Option>
                      <Select.Option value="high_school">
                        High School
                      </Select.Option>
                      <Select.Option value="diploma">Diploma</Select.Option>
                      <Select.Option value="bachelor">
                        Bachelor Degree
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24} md={24}>
                  <div style={{ marginTop: 8 }}>
                    <RequirementCard
                      title="Make education level required"
                      descriptions="Make the education level required for this job."
                    />
                  </div>
                </Col>
                <Col span={24} md={24}>
                  <div style={{ marginTop: 8 }}>
                    <Form.Item
                      label="Work Experience Required"
                      name={["requirement", "experience"]}
                      rules={[
                        {
                          required: true,
                          message: "Please select a work experience level",
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        placeholder="None selected"
                        style={{ maxWidth: 340 }}
                      >
                        <Select.Option value="none">
                          None selected
                        </Select.Option>
                        <Select.Option value="entry">
                          Entry Level (0-2 years)
                        </Select.Option>
                        <Select.Option value="mid">
                          Mid Level (2-5 years)
                        </Select.Option>
                        <Select.Option value="senior">
                          Senior Level (5+ years)
                        </Select.Option>
                      </Select>
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>

          </>
        )}

        {/* ========== STEP 2: JOB DESCRIPTION ========== */}
        {currentStep === 1 && (
          <>
            <Card style={{ padding: 24, marginBottom: 24 }}>
              <Flex justify="space-between">
                <Title level={4} style={{ marginBottom: 4 }}>
                  Job Description
                </Title>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleGenerateJobDescription}
                    loading={isGeneratingDescription}
                  >
                    Generate with AI
                  </Button>
                </Space>
              </Flex>
              <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                Describe key responsibilities, outcomes, and expectations for
                this role.
              </Paragraph>

              <Divider />

              {aiFailed && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="AI generator sedang tidak tersedia."
                  description="Silakan isi deskripsi secara manual di bawah."
                />
              )}

              <Form.Item
                label={<Typography.Text strong>Job Summary</Typography.Text>}
                name={["description", "summary"]}
                rules={[{ required: true, message: "Job summary is required" }]}
              >
                <Input.TextArea
                  rows={7}
                  placeholder="Short overview of the role"
                />
              </Form.Item>

              {showManualDescription && (
                <>
                  <Form.Item
                    label={
                      <Typography.Text strong>Responsibilities</Typography.Text>
                    }
                    name={["description", "responsibilities"]}
                  >
                    <Input.TextArea
                      rows={6}
                      placeholder="List responsibilities (one per line)"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <Typography.Text strong>Nice to Have</Typography.Text>
                    }
                    name={["description", "nice_to_have"]}
                  >
                    <Input.TextArea
                      rows={5}
                      placeholder="Optional skills/requirements (one per line)"
                    />
                  </Form.Item>
                </>
              )}
            </Card>
          </>
        )}

        {/* Buttons */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Button
            size="large"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            loading={isFinalStep && (isSubmitting || onPublishLoading)}
          >
            {isFinalStep ? (isEditMode ? "Update Job" : "Submit") : "Next"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
