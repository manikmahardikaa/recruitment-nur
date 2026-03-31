"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Input,
  Button,
  Table,
  Modal,
  Tag,
  Space,
} from "antd";
import {
  SearchOutlined,
  CloseOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useCandidates } from "@/app/hooks/applicant";
import { useMerchants } from "@/app/hooks/merchant";
import { useHistoryCandidates } from "@/app/hooks/history-candidate";
import { ApplicantDataModel } from "@/app/models/applicant";
import { HistoryCandidateDataModel } from "@/app/models/history-candidate";

import ListMerchantComponent from "../../content";
import Columns from "./columns";
import { getStageLabel, stageMatches } from "@/app/utils/recruitment-stage";
import { useSearchParams } from "next/navigation";
import { useRecruitment } from "../../context";

const { Text } = Typography;

/** Small helper */
function formatDateTime(v?: string | Date | null) {
  if (!v) return "-";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const normalize = (s: string) => s.toLowerCase().trim();

function ApplicantList({ merchantId }: { merchantId: string }) {
  const { data: merchants = [] } = useMerchants();
  const activeMerchant = useMemo(
    () => merchants.find((m) => m.id === merchantId),
    [merchants, merchantId]
  );

  const { data: candidatesData = [] } = useCandidates({
    queryString: merchantId
      ? `merchant_id=${encodeURIComponent(merchantId)}`
      : undefined,
  });
  const { data: historyCandidates = [] } = useHistoryCandidates({});
  const { setSummary, setSectionTitle, setSectionSubtitle } = useRecruitment();

  // filters
  const [status, setStatus] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  // history modal state
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyForCandidateId, setHistoryForCandidateId] = useState<
    string | null
  >(null);

  // page header
  useEffect(() => {
    const title = activeMerchant?.name
      ? `Applicants - ${activeMerchant.name}`
      : "Total Applicants";
    const subtitle = activeMerchant?.name
      ? "Monitor the status and progress of applicants for this merchant."
      : "Monitor the status and progress of all job applicants.";
    setSectionTitle(title);
    setSectionSubtitle(subtitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMerchant?.id]);

  const statusOptions = useMemo(() => {
    const stages = Array.from(
      new Set(
        (candidatesData as ApplicantDataModel[])
          .map((c) => c.stage?.toString().trim())
          .filter(Boolean) as string[]
      )
    ).map((stage) => {
      const normalized = normalize(stage);
      return normalized === "HIRED" ? "HIRING" : normalized;
    });

    const fallback = [
      "NEW_APPLICANT",
      "SCREENING",
      "INTERVIEW",
      "OFFERING",
      "HIRING",
      "REJECTED",
    ];

    const values = stages.length ? stages : fallback;
    const uniqueValues = Array.from(new Set(values));

    return uniqueValues.map((value) => ({
      value,
      label: getStageLabel(value),
    }));
  }, [candidatesData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (candidatesData as ApplicantDataModel[]).filter((c) => {
      const m1 =
        !status ||
        status === "ALL" ||
        stageMatches(c.stage, status);
      const m3 =
        !q ||
        c.user.name?.toLowerCase().includes(q) ||
        c.user.email?.toLowerCase().includes(q) ||
        c.user.phone?.toLowerCase().includes(q);
      return m1 && m3;
    });
  }, [candidatesData, status, search]);

  // summary
  const counts = useMemo(() => {
    const total = candidatesData.length;
    const by = (...stages: string[]) =>
      candidatesData.filter((c) => stageMatches(c.stage, ...stages)).length;
    return {
      all: total,
      screening: by("SCREENING"),
      interview: by("INTERVIEW"),
      offering: by("OFFERING"),
      hired: by("HIRING"),
      rejected: by("REJECTED"),
    };
  }, [candidatesData]);

  const lastCountsRef = useRef<string>("");
  useEffect(() => {
    const sig = JSON.stringify(counts);
    if (sig === lastCountsRef.current) return;
    lastCountsRef.current = sig;
    setSummary([
      { key: "all", label: "Total Applicants", count: counts.all },
      { key: "screening", label: "Screening", count: counts.screening },
      { key: "interview", label: "Interview", count: counts.interview },
      { key: "offering", label: "Offering", count: counts.offering },
      { key: "hired", label: "Hiring", count: counts.hired },
      { key: "rejected", label: "Rejected", count: counts.rejected },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts]);

  // columns: pass an onHistory that opens modal
  const columns = Columns({
    onDetail: (_id: string) => {},
    onHistory: (candidateId: string) => {
      setHistoryForCandidateId(candidateId);
      setHistoryVisible(true);
    },
  });

  // derive selected candidate & history items for modal
  const selectedCandidate: ApplicantDataModel | undefined = useMemo(
    () => candidatesData.find((c) => c.id === historyForCandidateId),
    [candidatesData, historyForCandidateId]
  );

  const candidateHistory: HistoryCandidateDataModel[] = useMemo(() => {
    if (!historyForCandidateId) return [];
    return [...historyCandidates]
      .filter((h) => h.applicant_id === historyForCandidateId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [historyCandidates, historyForCandidateId]);

  const page = 1;
  const totalPages = 1;

  return (
    <>
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
        {/* Filters */}
        <Row gutter={10} style={{ margin: "12px 0 16px" }}>
          <Col xs={24} md={6}>
            <Select
              allowClear
              placeholder="Filter by Status"
              style={{ width: "100%" }}
              value={status}
              onChange={setStatus}
              options={[
                { value: "ALL", label: "All" },
                ...statusOptions,
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <Input
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={12} md={2}>
            <Button type="primary" icon={<SearchOutlined />} block>
              Search
            </Button>
          </Col>
          <Col xs={12} md={2}>
            <Button
              danger
              icon={<CloseOutlined />}
              block
              onClick={() => {
                setStatus(undefined);
                setSearch("");
              }}
            >
              Clear
            </Button>
          </Col>
        </Row>

        {/* Table */}
        <div
          style={{
            border: "1px solid #f0f0f0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <Table<ApplicantDataModel>
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={false}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
              padding: "10px 16px",
              borderTop: "1px solid #f0f0f0",
              background: "#fff",
            }}
          >
            <Button disabled>Previous</Button>
            <Text>
              Page {page} of {totalPages}
            </Text>
            <Button disabled>Next</Button>
          </div>
        </div>
      </Card>

      {/* History Modal */}
      <Modal
        open={historyVisible}
        onCancel={() => {
          setHistoryVisible(false);
          setHistoryForCandidateId(null);
        }}
        footer={null}
        title={
          <Space>
            <HistoryOutlined />
            <span>
              Stage History —{" "}
              {selectedCandidate?.user.name ?? "(Unknown Candidate)"}
            </span>
          </Space>
        }
      >
        {candidateHistory.length === 0 ? (
          <Text type="secondary">No history yet.</Text>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {candidateHistory.map((h) => (
              <div
                key={h.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #f0f0f0",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <Tag color="blue" style={{ marginRight: 12 }}>
                  {h.stage}
                </Tag>
                <Text type="secondary">{formatDateTime(h.createdAt)}</Text>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Content() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get("merchant_id") || "";

  if (!merchantId) {
    return <ListMerchantComponent />;
  }

  return <ApplicantList merchantId={merchantId} />;
}
