"use client";

import { Card, Checkbox, Typography, Tag } from "antd";

const { Text, Paragraph } = Typography;

export default function RequirementCard({
  title,
  descriptions,
}: {
  title: string;
  descriptions: string;
}) {
  return (
    <Card
      bordered
      style={{
        borderRadius: 12,
        borderColor: "#FFE9A3",
        background: "#FFFCF5",
      }}
      bodyStyle={{ padding: 20 }}
    >
      {/* VIP Badge */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
        <Tag
          color="#FFE9A3"
          style={{
            color: "#6D5200",
            fontWeight: 600,
            borderColor: "#FFE9A3",
          }}
        >
          Nur Cahaya Tunggal Recruitment
        </Tag>
      </div>

      {/* Checkbox + Title */}
      <div style={{ display: "flex", gap: 12 }}>
        <Checkbox />
        <div>
          <Text style={{ fontSize: 16, fontWeight: 600 }}>{title}</Text>

          <Paragraph
            style={{ marginTop: 4, marginBottom: 0, color: "#575757" }}
          >
            {descriptions}. <br />
            <span style={{ fontWeight: 600 }}>
              Cannot be changed once the job is posted.
            </span>
          </Paragraph>

          {/* <Paragraph style={{ marginTop: 12, marginBottom: 0, color: "#666" }}>
            Beli Glints VIP untuk menggunakan fitur ini.{" "}
            <a href="#" style={{ color: "#1677ff" }}>
              Upgrade ke VIP
            </a>
          </Paragraph> */}
        </div>
      </div>
    </Card>
  );
}
