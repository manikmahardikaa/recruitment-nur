"use client";

import React from "react";
import dayjs from "dayjs";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  List,
  Popconfirm,
  Progress,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined, SendOutlined } from "@ant-design/icons";
import { OfferChecklistItem, OfferChecklistKey } from "./offer-checklist-types";

const { Text } = Typography;

type Props = {
  items: OfferChecklistItem[];
  checklist: Record<OfferChecklistKey, boolean>;
  onUpdate: (key: OfferChecklistKey, value: boolean) => void;
  percent: number;
  isOfferReady: boolean;
  hasExistingContract: boolean;
  offerTriggeredAt: string | null;
  sendingOffer: boolean;
  onTriggerOfferReady: () => void;
  onResetChecklist: () => void;
};

export default function OfferChecklistCard({
  items,
  checklist,
  onUpdate,
  percent,
  isOfferReady,
  hasExistingContract,
  offerTriggeredAt,
  sendingOffer,
  onTriggerOfferReady,
  onResetChecklist,
}: Props) {
  const statusTag = offerTriggeredAt ? (
    <Tag color="purple">
      Sent {dayjs(offerTriggeredAt).format("MMM D, YYYY HH:mm")}
    </Tag>
  ) : isOfferReady ? (
    <Tag color="blue">Ready to Send</Tag>
  ) : (
    <Tag>Checklist Pending</Tag>
  );

  return (
    <Card
      style={{ borderRadius: 14, marginTop: 12 }}
      title={
        <Space>
          <SendOutlined />
          <span>Trigger Offer Ready</span>
        </Space>
      }
      extra={statusTag}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Alert
          type={
            isOfferReady ? "success" : hasExistingContract ? "info" : "warning"
          }
          showIcon
          message={
            isOfferReady
              ? "All checks are complete. You can now notify the candidate."
              : hasExistingContract
              ? "Verify each item before sending the offer."
              : "Generate and review the contract to unlock the notification."
          }
        />

        <Progress
          percent={percent}
          size="small"
          status={isOfferReady ? "active" : "normal"}
          showInfo
        />

        <List
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(item) => {
            const checked = checklist[item.key];
            const disabled =
              item.disabled ||
              (!hasExistingContract && item.key !== "contractFinalized");

            return (
              <List.Item
                style={{ alignItems: "flex-start" }}
                actions={[
                  <Switch
                    key={`${item.key}-switch`}
                    checked={checked}
                    onChange={(value) => onUpdate(item.key, value)}
                    disabled={disabled}
                    checkedChildren="Done"
                    unCheckedChildren="Todo"
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={renderChecklistIcon(item.icon, checked)}
                  title={
                    <Text strong style={{ fontSize: 14 }}>
                      {item.title}
                    </Text>
                  }
                  description={
                    <Text type="secondary">
                      {item.description}
                      {item.fileUrl ? (
                        <>
                          {" "}
                          <Link
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View file
                          </Link>
                        </>
                      ) : null}
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />

        <Space align="center" wrap>
          <Popconfirm
            title="Send offer to candidate?"
            description="This will notify the candidate that the offer is ready for review and signature."
            okText="Send now"
            cancelText="Not yet"
            onConfirm={onTriggerOfferReady}
            disabled={!isOfferReady || sendingOffer}
          >
            <Button
              type="primary"
              disabled={!isOfferReady}
              loading={sendingOffer}
            >
              Trigger Offer Ready
            </Button>
          </Popconfirm>
          <Button
            icon={<ReloadOutlined />}
            onClick={onResetChecklist}
            disabled={sendingOffer}
          >
            Reset Checklist
          </Button>
          {offerTriggeredAt ? (
            <Text type="secondary">
              Candidate notified on{" "}
              {dayjs(offerTriggeredAt).format("MMM D, YYYY HH:mm")}
            </Text>
          ) : null}
        </Space>
      </Space>
    </Card>
  );
}

const renderChecklistIcon = (icon: React.ReactNode, active: boolean) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: active ? "rgba(82,196,26,0.12)" : "rgba(0,0,0,0.04)",
      color: active ? "#52c41a" : "#8c8c8c",
      fontSize: 18,
    }}
  >
    {icon}
  </span>
);
