"use client";

import React from "react";
import { Card, Space, Typography, Button, Tag, Empty } from "antd";
import Link from "next/link";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { MbtiTestDataModel } from "@/app/models/mbti-test";

const { Text } = Typography;

type Props = {
  stage?: string | null;
  mbtiTest?: MbtiTestDataModel | null;
  onCreateMbtiTest: () => void;
  isCreating?: boolean;
};

export default function MBTITestComponent({
  stage,
  mbtiTest,
  onCreateMbtiTest,
  isCreating = false,
}: Props) {
  const isScreening = (stage ?? "").toUpperCase() === "SCREENING";
  const hasTest = Boolean(mbtiTest);

  return (
    <Card
      title="MBTI Test"
      headStyle={{ borderBottom: "none" }}
      style={{ borderRadius: 14 }}
    >
      {hasTest ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Tag
            icon={
              mbtiTest?.is_complete ? (
                <CheckCircleOutlined />
              ) : (
                <ClockCircleOutlined />
              )
            }
            color={mbtiTest?.is_complete ? "green" : "blue"}
          >
            {mbtiTest?.is_complete ? "Completed" : "Pending"}
          </Tag>

          {mbtiTest?.link_url ? (
            <Link href={mbtiTest.link_url} target="_blank" rel="noreferrer">
              <Button type="primary" icon={<LinkOutlined />}>
                Open Test Link
              </Button>
            </Link>
          ) : (
            <Text type="secondary">No test link available.</Text>
          )}

          <Space direction="vertical" size={4}>
            {mbtiTest?.createdAt ? (
              <Text type="secondary">
                Created at:{" "}
                {dayjs(mbtiTest.createdAt).format("DD MMM YYYY, HH:mm")}
              </Text>
            ) : null}
            {mbtiTest?.updatedAt ? (
              <Text type="secondary">
                Last update:{" "}
                {dayjs(mbtiTest.updatedAt).format("DD MMM YYYY, HH:mm")}
              </Text>
            ) : null}
          </Space>
        </Space>
      ) : (
        <Space
          direction="vertical"
          size={16}
          style={{
            width: "100%",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isScreening
                ? "No MBTI test has been created for this candidate."
                : "MBTI tests are only available in the screening stage."
            }
          />

          {isScreening ? (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={onCreateMbtiTest}
              loading={isCreating}
            >
              Create MBTI Test
            </Button>
          ) : null}
        </Space>
      )}
    </Card>
  );
}
