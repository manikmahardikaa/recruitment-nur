"use client";

import React from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
  message,
} from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { ApplicantDataModel } from "@/app/models/applicant";
import { OfferingContractPayloadCreateModel } from "@/app/models/offering-contract";

const { Text } = Typography;

type ContractFormValues = {
  name: string;
  content: string;
  notifyEmail?: string;
};

type Props = {
  candidate: ApplicantDataModel | null;
  loading?: boolean;
  onSubmit: (values: OfferingContractPayloadCreateModel) => Promise<void>;
};

export default function ContractForm({ candidate, loading, onSubmit }: Props) {
  const [form] = Form.useForm<ContractFormValues>();

  const handleFinish = async (values: ContractFormValues) => {
    if (!candidate) {
      message.error("Please select a candidate first");
      return;
    }

    const payload: OfferingContractPayloadCreateModel = {
      applicant_id: candidate.id,
      name: values.name,
      filePath: values.content,
      notifyEmail: values.notifyEmail,
    };

    try {
      await onSubmit(payload);
      message.success("Contract created successfully");
      form.resetFields();
    } catch (error) {
      message.error(`Failed to create contract ${error}`);
    }
  };

  return (
    <Card
      style={{ borderRadius: 14 }}
      title={
        <Space>
          <FileTextOutlined />
          <span>Create Offering Contract</span>
        </Space>
      }
      headStyle={{ borderBottom: "none" }}
    >
      <Text type="secondary">
        Create an offering contract for the selected candidate.
      </Text>

      <Form<ContractFormValues>
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        size="large"
        onFinish={handleFinish}
      >
        <Form.Item
          label="Contract Name"
          name="name"
          rules={[{ required: true, message: "Please enter contract name" }]}
        >
          <Input placeholder="Enter contract name..." />
        </Form.Item>

        <Form.Item
          label="Contract Content"
          name="content"
          rules={[{ required: true, message: "Please enter contract content" }]}
        >
          <Input.TextArea
            placeholder="Enter contract content..."
            autoSize={{ minRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          label="Candidate Email (for sending signed contract)"
          name="notifyEmail"
          rules={[
            {
              type: "email",
              message: "Please enter a valid email address",
            },
          ]}
        >
          <Input placeholder="candidate@example.com" type="email" />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Contract
          </Button>
        </div>
      </Form>
    </Card>
  );
}
