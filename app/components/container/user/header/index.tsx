"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Typography,
  Grid,
  Button,
  Avatar,
  Dropdown,
  Space,
} from "antd";
import {
  LoginOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { signOut } from "next-auth/react";
import { useAuth } from "@/app/utils/useAuth";
import getInitials from "@/app/utils/initials-username";

const { Header } = Layout;
const { useBreakpoint } = Grid;


export default function MainHeader({
  backLabel = "Back to Jobs",
  backHref,
}: {
  user?: { name: string } | null;
  backLabel?: string;
  backHref?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const screens = useBreakpoint();
  const [scrolled, setScrolled] = useState(false);

  // ---- Auth state dari hook kamu ----
  const { isAuthenticated, user_name, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerStyle: React.CSSProperties = {
    background: "#fff",
    padding: screens.md ? "0 32px" : "0 16px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    minHeight: scrolled ? 62 : 70,
    boxShadow: scrolled
      ? "0 6px 14px rgba(0,0,0,0.06)"
      : "0 2px 8px rgba(0,0,0,0.04)",
    transition: "all .2s ease",
  };

  const getBackLink = () => {
    if (backHref) return backHref;
    if (pathname.startsWith("/job-seeker")) return "/job-seeker";
    if (pathname.startsWith("/jobs")) return "/jobs";
    return "/user";
  };
  const hideBackLink =
    pathname === "/user" ||
    pathname.startsWith("/user/job");

  const isUserRoot = pathname === "/user";

  // ------ Right area: Login button atau Avatar dropdown ------
  const RightAuthArea = () => {
    if (loading) {
      // skeleton sederhana saat loading session
      return (
        <div
          style={{
            width: 96,
            height: 32,
            borderRadius: 6,
            background: "#f0f2f5",
          }}
        />
      );
    }

    if (!isAuthenticated) {
      return (
        <Link href="/login">
          <Button icon={<LoginOutlined />} type="primary">
            Login
          </Button>
        </Link>
      );
    }

    const menuItems = [
      {
        key: "dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => router.push("/user/home/apply-job"), // ganti ke admin dashboard jika kamu cek role di sini
      },
      {
        type: "divider" as const,
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        danger: true,
        label: "Logout",
        onClick: () => signOut({ callbackUrl: "/login" }),
      },
    ];

    return (
      <Space size={12} align="center">
        <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
          <Space style={{ cursor: "pointer" }}>
            <Avatar style={{ backgroundColor: "#2467e7" }}>
              {getInitials(user_name || "?") || <UserOutlined />}
            </Avatar>
            <span style={{ fontWeight: 500, color: "#222" }}>
              {user_name ?? "User"}
            </span>
          </Space>
        </Dropdown>
      </Space>
    );
  };

  // --- NAV normal di halaman "/" ---
  const nav = (
    <>
      {/* {screens.md && (
        <Menu
          mode="horizontal"
          selectable={false}
          style={{
            flex: 2,
            justifyContent: "center",
            borderBottom: "none",
            fontWeight: 500,
            fontSize: 16,
            background: "none",
            boxShadow: "none",
          }}
          items={BASE_NAV.map((item) => ({
            key: item.key,
            label: (
              <Link href={item.href} style={{ color: "#222" }}>
                {item.label}
              </Link>
            ),
          }))}
        />
      )} */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 12,
        }}
      >
        <RightAuthArea />
      </div>
    </>
  );

  // --- BACK LINK untuk halaman selain "/" ---
  const back = (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: hideBackLink ? "flex-end" : "space-between",
      }}
    >
      {!hideBackLink && (
        <Link
          href={getBackLink()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#445066",
            fontSize: 16,
            textDecoration: "none",
            padding: "6px 8px",
            borderRadius: 8,
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
          <span>{backLabel}</span>
        </Link>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <RightAuthArea />
      </div>
    </div>
  );

  return (
    <Header style={headerStyle}>
      {isUserRoot ? (
        <>
          {/* LOGO + NAV */}
          <div style={{ flex: 1 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Typography.Title
                level={4}
                style={{ color: "#2467e7", margin: 0, fontWeight: 700 }}
              >
                One Step Solution Bali
              </Typography.Title>
            </Link>
          </div>
          {nav}
        </>
      ) : (
        back
      )}
    </Header>
  );
}
