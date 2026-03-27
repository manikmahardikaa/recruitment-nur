/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import {
  Card,
  List,
  Typography,
  Tag,
  Empty,
  Skeleton,
  Alert,
  Space,
  Tabs,
} from "antd";
import dayjs from "dayjs";
import { useAnswerQuestionScreeningByApplicantId } from "@/app/hooks/answer-question-screening";

const { Text, Paragraph } = Typography;

/** ==== Types (disesuaikan JSON yang kamu kirim) ==== */
type SelectedOptionRef = {
  answerId?: string;
  optionId?: string;
};

type OptionInQuestion = {
  id: string;
  questionId?: string;
  label?: string | null;
  value?: string | null;
  order?: number | null;
  active?: boolean | null;
  // ada selectedBy di JSON, tapi tidak kita pakai untuk render
};

type BaseInfo = {
  id: string;
  name: string;
  desc?: string | null;
  version?: number | null;
  allowMultipleSubmissions?: boolean;
};

type Question = {
  id: string;
  baseId?: string | null;
  text: string;
  inputType: string; // "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | ...
  required?: boolean;
  order?: number | null;
  helpText?: string | null;
  placeholder?: string | null;
  options?: OptionInQuestion[];
  base?: BaseInfo | null;
};

type AnswerRow = {
  id: string;
  questionId: string;
  applicantId: string;
  answerText?: string | null;
  selectedOptions?: SelectedOptionRef[];
  createdAt?: string;
  question: Question;
};

/** ==== Helpers ==== */

// Ambil label pilihan dari selectedOptions (berbasis optionId) dan cocokan ke question.options
function extractSelectedLabels(row: AnswerRow): string[] {
  const refs = row?.selectedOptions ?? [];
  const qOpts = row?.question?.options ?? [];
  if (!refs.length || !qOpts.length) return [];

  const byId = new Map(qOpts.map((o) => [o.id, o]));
  const labels: string[] = [];

  for (const r of refs) {
    const oid = r?.optionId;
    if (!oid) continue;
    const opt = byId.get(oid);
    if (!opt) continue;
    const label = (opt.label ?? opt.value ?? "").toString().trim();
    if (label) labels.push(label);
  }

  // Unik
  return Array.from(new Set(labels));
}

const humanizeType = (type: string) => {
  switch (type) {
    case "SINGLE_CHOICE":
      return "Single Choice";
    case "MULTIPLE_CHOICE":
      return "Multiple Choice";
    case "TEXT":
      return "Text";
    default:
      return type;
  }
};

function renderAnswerContent(row: AnswerRow) {
  const type = (row?.question?.inputType || "").toUpperCase();
  const isChoice =
    type === "SINGLE_CHOICE" ||
    type === "MULTIPLE_CHOICE" ||
    type === "SELECT" ||
    type.includes("CHOICE");

  if (isChoice) {
    const labels = extractSelectedLabels(row);
    if (labels.length) {
      return (
        <Space size={[6, 6]} wrap>
          {labels.map((label, i) => (
            <Tag key={`${row.id}-opt-${i}`} color="blue">
              {label}
            </Tag>
          ))}
        </Space>
      );
    }
    // Jika tidak ada yang terpilih, tampilkan placeholder / info
    return (
      <Text type="secondary">
        {row?.question?.placeholder
          ? `No option selected (placeholder: ${row.question.placeholder})`
          : "No option selected"}
      </Text>
    );
  }

  // Default TEXT/NUMBER/dll → pakai answerText
  const text = (row?.answerText ?? "").trim();
  if (text) {
    return (
      <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
        {text}
      </Paragraph>
    );
  }

  // Tidak ada jawaban: tampilkan placeholder bila ada
  if (row?.question?.placeholder) {
    return (
      <Text type="secondary">
        {`No answer (placeholder: ${row.question.placeholder})`}
      </Text>
    );
  }

  return <Text type="secondary">No answer</Text>;
}

/** ==== Komponen utama ==== */
export default function AnswerScreening({
  applicantId,
}: {
  applicantId: string;
}) {
  const { data, fetchLoading} = useAnswerQuestionScreeningByApplicantId({
    applicantId,
  });

  // Normalisasi: hook bisa mengembalikan array atau { result: [...] }
  const rows: AnswerRow[] = useMemo(() => {
    const normalize = (source: unknown): AnswerRow[] => {
      if (!Array.isArray(source)) return [];
      return source.map((row) => ({
        ...(row as AnswerRow),
        createdAt: row?.createdAt
          ? dayjs(row.createdAt).toISOString()
          : undefined,
      }));
    };

    if (Array.isArray(data)) return normalize(data);
    if (data && Array.isArray((data as any).result)) {
      return normalize((data as any).result);
    }
    return [];
  }, [data]);

  // Group by base (pakai base.id; fallback "__no_base__")
  const groups = useMemo(() => {
    const map = new Map<
      string,
      {
        baseId: string;
        baseName: string;
        baseDesc?: string | null;
        items: AnswerRow[];
      }
    >();

    for (const row of rows) {
      const baseId =
        row.question?.base?.id || row.question?.baseId || "__no_base__";
      const baseName = row.question?.base?.name || "Uncategorized";
      const baseDesc = row.question?.base?.desc ?? null;

      if (!map.has(baseId)) {
        map.set(baseId, { baseId, baseName, baseDesc, items: [] });
      }
      map.get(baseId)!.items.push(row);
    }

    // sort items per base (by question.order asc, then createdAt asc)
    for (const g of map.values()) {
      g.items.sort((a, b) => {
        const ao = a?.question?.order ?? Number.POSITIVE_INFINITY;
        const bo = b?.question?.order ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        const ad = a?.createdAt ? +new Date(a.createdAt) : 0;
        const bd = b?.createdAt ? +new Date(b.createdAt) : 0;
        return ad - bd;
      });
    }

    // urutkan tab berdasarkan nama base
    return Array.from(map.values()).sort((a, b) =>
      a.baseName.localeCompare(b.baseName)
    );
  }, [rows]);

  // Siapkan items untuk <Tabs>
  const tabItems = useMemo(() => {
    return groups.map((g) => ({
      key: g.baseId,
      label: (
        <Space size={6}>
          <Text strong>{g.baseName}</Text>
          <Tag color="default">{g.items.length}</Tag>
        </Space>
      ),
      children: (
        <List
          dataSource={g.items}
          renderItem={(row, idx) => {
            const q = row.question;
            const num =
              (q?.order ?? null) !== null && (q?.order ?? null) !== undefined
                ? q.order
                : idx + 1;

            return (
              <List.Item
                key={row.id}
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <List.Item.Meta
                  title={
                    <Space size={8} wrap align="center">
                      <Text strong>
                        {typeof num === "number" ? `${num}. ` : ""}
                        {q?.text || "Untitled question"}
                      </Text>
                      {q?.required ? <Tag color="red">Required</Tag> : null}
                      {q?.inputType ? (
                        <Tag>{(humanizeType(q.inputType) || "").toUpperCase()}</Tag>
                      ) : null}
                    </Space>
                  }
                  description={
                    <Space
                      direction="vertical"
                      size={6}
                      style={{ width: "100%" }}
                    >
                      {q?.helpText ? (
                        <Text type="secondary">{q.helpText}</Text>
                      ) : null}

                      {/* Jawaban */}
                      {renderAnswerContent(row)}

                      {/* Meta waktu */}
                      {row?.createdAt ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Submitted:{" "}
                          {dayjs(row.createdAt).format("DD MMM YYYY, HH:mm:ss")}
                        </Text>
                      ) : null}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      ),
    }));
  }, [groups]);

  return (
    <Card
      title="Screening Responses"
      headStyle={{ borderBottom: "none" }}
      style={{ borderRadius: 14 }}
    >
      {!data ? (
        <Alert
          type="error"
          message="Failed to Load Answer"
          description="An error occurred while taking the screening data."
          showIcon
        />
      ) : fetchLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : rows.length === 0 ? (
        <Empty description="No responses found" />
      ) : (
        <Tabs
          items={tabItems}
          destroyInactiveTabPane
          tabBarGutter={8}
          animated
        />
      )}
    </Card>
  );
}
