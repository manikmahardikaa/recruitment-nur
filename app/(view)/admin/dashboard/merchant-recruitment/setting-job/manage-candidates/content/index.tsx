"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Button,
  Table,
  Tag,
  Typography,
  Tooltip,
  Empty,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useCandidateByJobId } from "@/app/hooks/applicant";
import type { ApplicantDataModel } from "@/app/models/applicant";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import { getStageLabel, stageMatches } from "@/app/utils/recruitment-stage";

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Bandingkan tanggal dalam waktu lokal
const USE_LOCAL_COMPARE = true;

const CHART_STAGE_ORDER = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFERING",
  "HIRING",
  "REJECTED",
] as const;

const STAGE_FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "NEW_APPLICANT", label: getStageLabel("NEW_APPLICANT") },
  { value: "SCREENING", label: getStageLabel("SCREENING") },
  { value: "INTERVIEW", label: getStageLabel("INTERVIEW") },
  { value: "OFFERING", label: getStageLabel("OFFERING") },
  { value: "HIRING", label: getStageLabel("HIRING") },
  { value: "REJECTED", label: getStageLabel("REJECTED") },
];

type LiveValues = {
  search?: string;
  stage?: string;
  range?: [Dayjs, Dayjs];
};

type CandidateRecord = ApplicantDataModel;
type DateValue = string | number | Date | Dayjs | null | undefined;

const INITIAL_TABLE_FILTERS: LiveValues = { stage: "ALL" };

export default function Content() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  const jobId = searchParams?.get("job_id") ?? "";

  const { data, fetchLoading, error } = useCandidateByJobId({ id: jobId });

  // Data kandidat sudah dalam bentuk array sesuai JSON yang kamu kirim
  const list = useMemo<CandidateRecord[]>(() => data ?? [], [data]);

  // Utils
  const normalize = (value: unknown): string => {
    if (value == null) return "";
    if (typeof value === "string") return value.trim().toUpperCase();
    return String(value).trim().toUpperCase();
  };
  const toLocalFromUTC = (value: DateValue): Dayjs | null => {
    if (!value) return null;
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed.local() : null;
  };
  const toUTC = (value: DateValue): Dayjs | null => {
    if (!value) return null;
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed : null;
  };

  // ---------- STATE: FILTER TABLE ----------
  const [form] = Form.useForm<LiveValues>();
  const [tableFilters, setTableFilters] = useState<LiveValues>(
    INITIAL_TABLE_FILTERS
  );

  // Debounce search (tabel)
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  useEffect(() => {
    const s = (tableFilters.search ?? "").toString();
    const t = setTimeout(() => setDebouncedSearch(s.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [tableFilters.search]);

  const onResetTableFilters = () => {
    form.resetFields();
    setTableFilters(INITIAL_TABLE_FILTERS);
  };

  // ---------- STATE: FILTER CHART ATAS ----------
  const [chartRange, setChartRange] = useState<[Dayjs, Dayjs] | null>(null);

  // ---------- STATE: MODAL + ROW UNTUK CHART PER CANDIDATE (tabel) ----------

  // ---------- STATE: MODAL TOP CANDIDATE (chart atas) ----------

  // ---------- FILTERED: UNTUK TABEL ----------
  const tableFiltered = useMemo(() => {
    let out = list.slice();
    if (!out.length) return [];

    const stage = tableFilters.stage;
    const range = tableFilters.range || null;

    // Search
    if (debouncedSearch) {
      out = out.filter((r) => {
        const hay = [
          r?.user?.name,
          r?.user?.email,
          r?.user?.phone,
          r?.job?.job_title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(debouncedSearch);
      });
    }

    // Stage
    if (stage && normalize(stage) !== "ALL") {
      out = out.filter((r) => stageMatches(r?.stage, stage));
    }

    // Date Range (pakai createdAt)
    if (Array.isArray(range) && range[0] && range[1]) {
      if (USE_LOCAL_COMPARE) {
        const start = range[0].startOf("day");
        const end = range[1].endOf("day");

        out = out.filter((r) => {
          const createdLocal = toLocalFromUTC(r?.createdAt);
          if (!createdLocal || !createdLocal.isValid()) return false;
          return (
            createdLocal.isSameOrAfter(start) &&
            createdLocal.isSameOrBefore(end)
          );
        });
      } else {
        const startUtc = range[0].utc().startOf("day");
        const endUtc = range[1].utc().endOf("day");

        out = out.filter((r: ApplicantDataModel) => {
          const createdUtc = toUTC(r?.createdAt);
          if (!createdUtc || !createdUtc.isValid()) return false;
          return (
            createdUtc.isSameOrAfter(startUtc) &&
            createdUtc.isSameOrBefore(endUtc)
          );
        });
      }
    }

    return out;
  }, [list, tableFilters, debouncedSearch]);

  // ---------- FILTERED: UNTUK CHART ATAS (distribusi stage) ----------
  const chartFiltered = useMemo(() => {
    let out = list.slice();
    if (!out.length) return [];

    if (Array.isArray(chartRange) && chartRange[0] && chartRange[1]) {
      if (USE_LOCAL_COMPARE) {
        const start = chartRange[0].startOf("day");
        const end = chartRange[1].endOf("day");
        out = out.filter((r: ApplicantDataModel) => {
          const createdLocal = toLocalFromUTC(r?.createdAt);
          if (!createdLocal || !createdLocal.isValid()) return false;
          return (
            createdLocal.isSameOrAfter(start) &&
            createdLocal.isSameOrBefore(end)
          );
        });
      } else {
        const startUtc = chartRange[0].utc().startOf("day");
        const endUtc = chartRange[1].utc().endOf("day");
        out = out.filter((r: ApplicantDataModel) => {
          const createdUtc = toUTC(r?.createdAt);
          if (!createdUtc || !createdUtc.isValid()) return false;
          return (
            createdUtc.isSameOrAfter(startUtc) &&
            createdUtc.isSameOrBefore(endUtc)
          );
        });
      }
    }

    return out;
  }, [list, chartRange]);

  // ---------- DATA: CHART STAGE DISTRIBUTION (atas) ----------
  const stageChartData = useMemo(() => {
    const counts = new Map<string, number>();
    CHART_STAGE_ORDER.forEach((key) => counts.set(key, 0));
    chartFiltered.forEach((r: ApplicantDataModel) => {
      const normalizedStage = normalize(r?.stage);
      const bucket =
        normalizedStage === "NEW_APPLICANT"
          ? "APPLIED"
          : normalizedStage === "HIRED"
          ? "HIRING"
          : normalizedStage;
      if (counts.has(bucket)) {
        counts.set(bucket, (counts.get(bucket) || 0) + 1);
      }
    });
    return CHART_STAGE_ORDER.map((key) => ({
      stage: key === "APPLIED" ? "Applied" : getStageLabel(key),
      total: counts.get(key) || 0,
    }));
  }, [chartFiltered]);

  // ---------- DATA: TOP CANDIDATE ----------
  // evaluator scores removed, so keep this section empty.

  // ---------- TABEL: KOLUMN ----------
  const columns = [
    {
      title: "Candidate",
      dataIndex: ["user", "name"],
      key: "candidate",
      render: (_: ApplicantDataModel, row: ApplicantDataModel) => (
        <Space direction="vertical" size={2}>
          <Space>
            <UserOutlined />
            <Text strong>{row?.user?.name || "-"}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row?.user?.email}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row?.user?.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "Position",
      dataIndex: ["job", "name"],
      key: "job",
      render: (_: ApplicantDataModel, row: ApplicantDataModel) => (
        <Space direction="vertical" size={2}>
          <Text>{row?.job?.job_title || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            created: {dayjs(row?.createdAt).format("DD MMM YYYY HH:mm")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      render: (stage: string) => {
        const normalized = normalize(stage);
        const color =
          normalized === "INTERVIEW"
            ? "geekblue"
            : normalized === "SCREENING"
            ? "orange"
            : normalized === "OFFERING"
            ? "gold"
            : normalized === "HIRING" || normalized === "HIRED"
            ? "green"
            : normalized === "REJECTED"
            ? "red"
            : "default";
        return <Tag color={color}>{getStageLabel(stage)}</Tag>;
      },
    },
    {
      title: "Documents",
      key: "docs",
      render: (_: ApplicantDataModel, row: ApplicantDataModel) => (
        <Space wrap>
          {row?.user?.curiculum_vitae_url && (
            <Link href={row.user.curiculum_vitae_url} target="_blank">
              <Button size="small" icon={<FileSearchOutlined />}>
                CV
              </Button>
            </Link>
          )}
          {row?.user?.portfolio_url && (
            <Link href={row.user.portfolio_url} target="_blank">
              <Button size="small" icon={<FileSearchOutlined />}>
                Portfolio
              </Button>
            </Link>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "action",
      fixed: "right" as const,
      render: (_: ApplicantDataModel, row: ApplicantDataModel) => {
        return (
          <Space>
            <Link href={`/recruitment/applicant/${row?.id}`}>
              <Tooltip title="View candidate details">
                <Button type="default" icon={<EyeOutlined />} />
              </Tooltip>
            </Link>
          </Space>
        );
      },
    },
  ];


  return (
    <>
      <Title level={3}>Manage Candidates</Title>
      <Row gutter={[16, 16]} style={{ padding: 16 }}>
        {/* 1) CHART ATAS: DISTRIBUSI STAGE (TIDAK DIUBAH) + BUTTON TOP CANDIDATE */}
        <Col span={24}>
          <Card
            title={
              <Space align="baseline" wrap>
                <span>Stage Distribution</span>
              </Space>
            }
            extra={
              <Space wrap>
                <Text type="secondary">Date Range (Chart)</Text>
                <RangePicker
                  style={{ width: 260 }}
                  format="DD MMM YYYY"
                  value={chartRange}
                  onChange={(v) => setChartRange((v as [Dayjs, Dayjs]) || null)}
                  allowClear
                />
              </Space>
            }
          >
            {stageChartData.every((d) => d.total === 0) ? (
              <Empty description="No data for current chart range" />
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={stageChartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis allowDecimals={false} />
                    <RTooltip />
                    <Bar dataKey="total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* 2) FILTER (SEARCH + STAGE + DATE RANGE) UNTUK TABEL */}
        <Col span={24}>
          <Card title="Table Filters">
            <Form
              form={form}
              layout="vertical"
              initialValues={INITIAL_TABLE_FILTERS}
              onValuesChange={(_, all) => setTableFilters(all)}
            >
              <Row gutter={[16, 8]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="search"
                    label="Search (name / email / phone / position)"
                  >
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="Type keywords..."
                    />
                  </Form.Item>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Item name="stage" label="Stage">
                    <Select
                      options={STAGE_FILTER_OPTIONS}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="range" label="Date Range (Table)">
                    <RangePicker
                      style={{ width: "100%" }}
                      format="DD MMM YYYY"
                      allowClear
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Space>
                    <Button
                      onClick={onResetTableFilters}
                      icon={<ReloadOutlined />}
                    >
                      Reset
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* 3) TABEL */}
        <Col span={24}>
          <Card>
            <Table
              rowKey={(r) => r.id}
              loading={fetchLoading}
              dataSource={tableFiltered}
              columns={columns}
              locale={{
                emptyText: error ? (
                  <Empty
                    description={error?.message || "Something went wrong"}
                  />
                ) : (
                  <Empty description="No data" />
                ),
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </Col>

      </Row>
    </>
  );
}
