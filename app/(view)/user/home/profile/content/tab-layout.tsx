"use client";

import {
  Tabs,
  TabsProps,
  Card,
  Typography,
  Space,
  Avatar,
  Grid,
} from "antd";
import {
  CheckCircleFilled,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useMemo } from "react";

import PersonalInformationDocuments from "./PersonalInformationComponent";
import DocumentsComponent from "./DocumentComponent";
import PreviewComponent from "./PreviewComponent";
import SecurityComponent from "./SecurityComponent";
import { useAuth } from "@/app/utils/useAuth";
import { useUser } from "@/app/hooks/user";
import { UserDataModel } from "@/app/models/user";
import getInitials from "@/app/utils/initials-username";
import Image from "next/image";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;


export default function TabLayout() {
  const { user_id } = useAuth();
  const { data: detailUserData } = useUser({ id: user_id! });
  const screens = useBreakpoint();

  const completionFields = useMemo(
    () => [
      detailUserData?.name,
      detailUserData?.email,
      detailUserData?.phone,
      detailUserData?.date_of_birth,
      detailUserData?.address,
      detailUserData?.curiculum_vitae_url,
      detailUserData?.photo_url,
      detailUserData?.portfolio_url,
      detailUserData?.gender,
    ],
    [
      detailUserData?.address,
      detailUserData?.curiculum_vitae_url,
      detailUserData?.date_of_birth,
      detailUserData?.email,
      detailUserData?.name,
      detailUserData?.phone,
      detailUserData?.photo_url,
      detailUserData?.portfolio_url,
      detailUserData?.gender,
    ]
  );

  const completionScore = useMemo(() => {
    const filled = completionFields.filter((value) => Boolean(value)).length;
    return Math.round((filled / completionFields.length) * 100) || 0;
  }, [completionFields]);

  const documentsUploaded = useMemo(() => {
    if (!detailUserData) return 0;
    const keys: Array<keyof UserDataModel> = [
      "curiculum_vitae_url",
      "photo_url",
      "portfolio_url",
    ];
    return keys.reduce((acc, key) => (detailUserData[key] ? acc + 1 : acc), 0);
  }, [detailUserData]);

  const lastUpdated = detailUserData?.updatedAt
    ? dayjs(detailUserData.updatedAt).format("DD MMM YYYY")
    : "Not updated yet";

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Preview",
      children: <PreviewComponent />,
    },
    {
      key: "2",
      label: "Personal Information",
      children: <PersonalInformationDocuments />,
    },
    {
      key: "3",
      label: "Documents",
      children: <DocumentsComponent />,
    },
    {
      key: "4",
      label: "Security",
      children: <SecurityComponent />,
    },
  ];

  const heroStats = [
    {
      label: "Profile completion",
      value: `${completionScore}%`,
      icon: <CheckCircleFilled style={{ color: "#10b981" }} />,
    },
    {
      label: "Documents uploaded",
      value: `${documentsUploaded}/3`,
      icon: <FileTextOutlined style={{ color: "#6366f1" }} />,
    },
    {
      label: "Last updated",
      value: lastUpdated,
      icon: <UserOutlined style={{ color: "#f59e0b" }} />,
    },
  ];

  return (
    <section
      style={{
        // background: gradientBackground,
        padding: screens.md ? "32px 0 48px" : "24px 0 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          padding: screens.md ? "0 32px" : "0 16px",
        }}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            marginBottom: 24,
            background: "linear-gradient(120deg,#ffffff,#eef2ff)",
            boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
          }}
          bodyStyle={{ padding: screens.md ? "32px 40px" : "24px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: screens.md ? "row" : "column",
              gap: 24,
              alignItems: screens.md ? "center" : "flex-start",
            }}
          >
            <Avatar
              size={64}
              style={{
                background: "#2467e7",
                fontWeight: 600,
                fontSize: 22,
              }}
            >
              {detailUserData?.photo_url ? (
                <Image
                  src={detailUserData.photo_url}
                  alt="Profile"
                  width={100}
                  height={100}
                  style={{ objectFit: "cover", borderRadius: "50%" }}
                  priority
                  unoptimized
                />
              ) : (
                getInitials(detailUserData?.name || "?")
              )}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Title level={3} style={{ marginBottom: 4 }}>
                {detailUserData?.name ?? "Candidate Profile"}
              </Title>
              <Text type="secondary">
                {detailUserData?.address ||
                  "Keep your professional profile updated to stand out to recruiters."}
              </Text>
            </div>
          </div>
          <Space
            size={screens.md ? 48 : 24}
            style={{
              marginTop: 24,
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  minWidth: screens.md ? 180 : "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ letterSpacing: 0.3 }}>
                    {stat.label}
                  </Text>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </Space>
        </Card>

        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            boxShadow: "0 18px 45px rgba(15,23,42,0.07)",
            background: "#fff",
          }}
          bodyStyle={{ padding: screens.md ? 32 : 20 }}
        >
          <Tabs
            defaultActiveKey="1"
            items={tabItems}
            tabBarStyle={{
              fontWeight: 600,
              fontSize: 16,
            }}
            destroyInactiveTabPane={false}
          />
        </Card>
      </div>
    </section>
  );
}
