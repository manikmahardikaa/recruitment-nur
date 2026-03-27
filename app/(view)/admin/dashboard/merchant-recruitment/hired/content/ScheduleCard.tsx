"use client";

import React from "react";
import { Card, Space, Typography, Timeline, theme } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  PushpinFilled,
  BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import isYesterday from "dayjs/plugin/isYesterday";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);
dayjs.extend(relativeTime);

const { Text } = Typography;

/** ====== Skala compact: ubah angka di sini jika ingin lebih kecil/besar ====== */
const S = {
  cardRadius: 14,
  cardPad: 14,
  headPad: "12px 12px 0",
  panelBg: "#F7F9FC",
  panelRadius: 16,
  panelPad: 12,
  panelBorder: "#EEF2F8",
  tileSize: 40,
  tileRadius: 12,
  iconSize: 18,
  labelSize: 11,
  labelTracking: 1,
  titleSize: 18,
  gap: 10,
  pillPadV: 4,
  pillPadH: 10,
  pillFont: 12,
  pillGap: 6,
  dotSize: 12,
  dotBorder: 3,
  dotRing: 2,
};

type DateValue = string | number | Date | dayjs.Dayjs | null | undefined;

type LocationDetail = {
  name?: string | null;
  headline?: string | null;
  description?: string | null;
};

type SchedulePrettyProps = {
  date: DateValue;
  time: DateValue;
  relativeLabel?: string | null;
  location: LocationDetail;
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: S.pillGap,
        padding: `${S.pillPadV}px ${S.pillPadH}px`,
        borderRadius: 999,
        background:
          "linear-gradient(180deg, rgba(127,146,255,0.22), rgba(106,122,252,0.22))",
        color: "#3b49df",
        boxShadow: "0 4px 10px rgba(106,122,252,0.16)",
        fontWeight: 600,
        fontSize: S.pillFont,
        lineHeight: 1,
      }}
    >
      <ClockCircleOutlined style={{ fontSize: S.iconSize - 2 }} />
      {children}
    </span>
  );
}

function IconTile({
  children,
  gradient,
}: {
  children: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      style={{
        width: S.tileSize,
        height: S.tileSize,
        borderRadius: S.tileRadius,
        display: "grid",
        placeItems: "center",
        background: gradient,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        flex: "0 0 auto",
      }}
    >
      <span style={{ fontSize: S.iconSize, color: "#fff" }}>{children}</span>
    </div>
  );
}

function Panel({
  label,
  icon,
  title,
  extra,
}: {
  label: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: S.panelBg,
        borderRadius: S.panelRadius,
        padding: S.panelPad,
        border: `1px solid ${S.panelBorder}`,
      }}
    >
      <Space align="start" size={S.gap}>
        {icon}
        <div>
          <div
            style={{
              color: "#9AA4B2",
              fontWeight: 800,
              letterSpacing: S.labelTracking,
              marginBottom: 2,
              fontSize: S.labelSize,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: S.titleSize,
              fontWeight: 800,
              color: "#1F2937",
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          {extra ? <div style={{ marginTop: 8 }}>{extra}</div> : null}
        </div>
      </Space>
    </div>
  );
}

function VioletDot() {
  return (
    <span
      style={{
        width: S.dotSize,
        height: S.dotSize,
        display: "inline-block",
        borderRadius: "50%",
        background: "#fff",
        border: `${S.dotBorder}px solid #6B6AFB`,
        boxShadow: `0 0 0 ${S.dotRing}px #E6E6FF`,
      }}
    />
  );
}

export default function SchedulePretty({
  date,
  time,
  relativeLabel,
  location,
}: SchedulePrettyProps) {
  const { token } = theme.useToken();

  const d = dayjs(date);
  const t =
    typeof time === "string" && /^\d{1,2}:\d{2}$/.test(time)
      ? time
      : dayjs(time).isValid()
      ? dayjs(time).format("HH:mm")
      : String(time ?? "");

  const dayBadge = d.isYesterday() ? (
    <Pill>Yesterday</Pill>
  ) : d.isToday() ? (
    <Pill>Today</Pill>
  ) : d.isTomorrow() ? (
    <Pill>Tomorrow</Pill>
  ) : null;

  const rel =
    relativeLabel ??
    (dayjs(time).isValid() ? dayjs(time).fromNow() : undefined);

  return (
    <Card
      style={{
        borderRadius: S.cardRadius,
        borderColor: token.colorBorderSecondary,
      }}
      bodyStyle={{ padding: S.cardPad }}
      title={
        <Space size={8}>
          <ClockCircleOutlined />
          <span>Schedule Hired</span>
        </Space>
      }
      headStyle={{ borderBottom: "none", padding: S.headPad }}
    >
      <Timeline
        style={{ marginLeft: 4 }}
        items={[
          {
            dot: <VioletDot />,
            children: (
              <Panel
                label="Date"
                icon={
                  <IconTile gradient="linear-gradient(135deg,#FFB56B,#E36414)">
                    <CalendarOutlined />
                  </IconTile>
                }
                title={d.isValid() ? d.format("DD MMMM YYYY") : "-"}
                extra={dayBadge}
              />
            ),
          },
          {
            dot: <VioletDot />,
            children: (
              <Panel
                label="Time"
                icon={
                  <IconTile gradient="linear-gradient(135deg,#6BBBAF,#2F7F73)">
                    <ClockCircleOutlined />
                  </IconTile>
                }
                title={t || "-"}
                extra={rel ? <Pill>{rel}</Pill> : null}
              />
            ),
          },
          {
            dot: <VioletDot />,
            children: (
              <Panel
                label="Location"
                icon={
                  <IconTile gradient="linear-gradient(135deg,#F6A93B,#C23D00)">
                    <PushpinFilled />
                  </IconTile>
                }
                title={location?.name ? location.name : "-"}
                extra={
                  location?.headline || location?.description ? (
                    <div
                      style={{
                        background: "linear-gradient(180deg,#FFF9DF,#FFF3C4)",
                        border: "1.5px dashed #F0C96B",
                        borderRadius: 12,
                        padding: 10,
                      }}
                    >
                      <Space direction="vertical" size={2}>
                        {location?.headline ? (
                          <Text strong style={{ fontSize: 13 }}>
                            <BankOutlined style={{ marginRight: 6 }} />
                            {location.headline}
                          </Text>
                        ) : null}
                        {location?.description ? (
                          <Text
                            type="secondary"
                            style={{ display: "block", fontSize: 12 }}
                          >
                            {location.description}
                          </Text>
                        ) : null}
                      </Space>
                    </div>
                  ) : null
                }
              />
            ),
          },
        ]}
      />
    </Card>
  );
}

