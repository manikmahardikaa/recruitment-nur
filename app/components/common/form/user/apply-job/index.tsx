"use client";

import React from "react";
import {
  Card,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  Button,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import SupaImageUploader from "@/app/utils/image-uploader";
import SupaPdfUploader from "@/app/utils/pdf-uploader";
import { ApplicantPayloadCreateModel } from "@/app/models/applicant";

const { Title, Text, Paragraph } = Typography;

/* ----------------------------- SectionHeader ----------------------------- */
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "#F0F5FF",
          display: "grid",
          placeItems: "center",
          color: "#2F54EB",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {subtitle}
          </Text>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Styles -------------------------------- */

/* -------------------------------- Component ------------------------------- */
type ApplyFormProps = {
  onSubmit?: (values: ApplicantPayloadCreateModel) => void;
  loading?: boolean;
};

export default function ApplyForm({ onSubmit, loading }: ApplyFormProps) {
  return (
    <Card
      style={{ marginTop: 20, borderRadius: 14, borderColor: "#F0F0F0" }}
      bodyStyle={{ padding: 20 }}
    >
      <SectionHeader
        icon={<IdcardOutlined />}
        title="Application Form"
        subtitle="Please fill out all required information to complete your application."
      />

      <Divider style={{ margin: "14px 0 20px" }} />

      <Form
        layout="vertical"
        size="large"
        requiredMark="optional"
        onFinish={onSubmit}
      >
        {/* Personal Information */}
        <Paragraph style={{ margin: "0 0 8px", fontWeight: 600 }}>
          Personal Information
        </Paragraph>

        <Row gutter={[16, 8]}>
          <Col xs={24} md={24}>
            <Form.Item
              label="Full Name"
              name="name"
              rules={[
                { required: true, message: "Please enter your first name" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="First Name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 8]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Email is not valid" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="candidate@example.com"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number" },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter your active phone number"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Date of Birth"
              name="date_of_birth"
              rules={[
                { required: true, message: "Please select your birth date" },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select birth date"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "6px 0 16px" }} />

        {/* Required Documents */}
        <Paragraph style={{ margin: "0 0 8px", fontWeight: 600 }}>
          Required Documents
        </Paragraph>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="CV / Resume"
              name="curiculum_vitae_url"
              valuePropName="fileList"
              rules={[{ required: true, message: "Please upload your CV" }]}
            >
              <SupaPdfUploader bucket="web-oss-recruitment" folder="pdf" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Profile Photo"
              name="photo_url"
              valuePropName="fileList"
              rules={[{ required: true, message: "Please upload your photo" }]}
            >
              <SupaImageUploader
                bucket="web-oss-recruitment"
                folder="profile"
                label="Upload Photo"
                previewStyle={{
                  width: 240,
                  maxHeight: 140,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Upload Portfolio"
              name="portfolio_url"
              valuePropName="fileList"
            >
              <SupaPdfUploader bucket="web-oss-recruitment" folder="pdf" />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "8px 0 16px" }} />

        <Space
          size="middle"
          style={{ width: "100%", justifyContent: "flex-end" }}
        >
          <Button htmlType="reset">Reset</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Application
          </Button>
        </Space>
      </Form>
    </Card>
  );
}
