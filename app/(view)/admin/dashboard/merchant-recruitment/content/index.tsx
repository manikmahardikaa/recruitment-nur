"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import type { TableProps } from "antd";
import { useRouter } from "next/navigation";
import {
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { useMerchant, useMerchants } from "@/app/hooks/merchant";
import { MerchantDataModel } from "@/app/models/merchant";

const { Text } = Typography;

export default function ListMerchantComponent() {
  const router = useRouter();
  const { data: merchants = [], fetchLoading, onCreate, onCreateLoading, onDelete } =
    useMerchants();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [selectedMerchant, setSelectedMerchant] =
    useState<MerchantDataModel | null>(null);
  const [form] = Form.useForm<{ name: string }>();
  const { onUpdate, onUpdateLoading } = useMerchant({
    id: selectedMerchant?.id || "",
  });

  const openCreateModal = () => {
    setModalType("create");
    setSelectedMerchant(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (merchant: MerchantDataModel) => {
    setModalType("update");
    setSelectedMerchant(merchant);
    form.setFieldsValue({ name: merchant.name });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string }) => {
    const payload = { name: values.name.trim() };
    if (!payload.name) {
      message.error("Merchant name is required.");
      return;
    }
    try {
      if (modalType === "create") {
        await onCreate(payload);
        message.success("Merchant created.");
      } else if (selectedMerchant?.id) {
        await onUpdate(payload);
        message.success("Merchant updated.");
      }
      setModalOpen(false);
      form.resetFields();
      setSelectedMerchant(null);
      setModalType("create");
    } catch {
      message.error("Failed to save merchant.");
    }
  };

  const columns = useMemo<TableProps<MerchantDataModel>["columns"]>(
    () => [
      {
        title: "Merchant",
        dataIndex: "name",
        key: "name",
        render: (value: string) => <Text strong>{value || "-"}</Text>,
      },
      {
        title: "Jobs",
        key: "jobs",
        render: (_: unknown, record: MerchantDataModel) => (
          <Tag color="blue">{record._count?.jobs ?? 0}</Tag>
        ),
      },
      {
        title: "Applicants",
        key: "applicants",
        render: (_: unknown, record: MerchantDataModel) => (
          <Tag color="green">{record._count?.applicants ?? 0}</Tag>
        ),
      },
      {
        title: "Action",
        key: "action",
        width: 280,
        render: (_: unknown, record: MerchantDataModel) => (
          <Space size={[8, 8]} wrap>
            <Tooltip title="Detail Applicants">
              <Button
                type="primary"
                icon={<TeamOutlined />}
                onClick={() =>
                  router.push(
                    `/admin/dashboard/merchant-recruitment/applicant-status?merchant_id=${encodeURIComponent(
                      record.id
                    )}`
                  )
                }
              />
            </Tooltip>
            <Tooltip title="Manage Job">
              <Button
                icon={<FileTextOutlined />}
                onClick={() =>
                  router.push(
                    `/admin/dashboard/merchant-recruitment/setting-job?merchant_id=${encodeURIComponent(
                      record.id
                    )}`
                  )
                }
              />
            </Tooltip>
            <Tooltip title="Manage Setting Company">
              <Button
                icon={<SettingOutlined />}
                onClick={() =>
                  router.push(
                    `/admin/dashboard/merchant-recruitment/company-setting/profile?merchant_id=${encodeURIComponent(
                      record.id
                    )}`
                  )
                }
              />
            </Tooltip>
            <Tooltip title="Edit Merchant">
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            </Tooltip>
            <Popconfirm
              title="Delete merchant?"
              description="This action cannot be undone."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record.id)}
            >
              <Tooltip title="Delete Merchant">
                <Button danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [router, onDelete]
  );

  return (
    <Card
      style={{ borderRadius: 16 }}
      bodyStyle={{ padding: 20 }}
      title={
        <div>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            Merchant Recruitment
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage merchants, jobs, and applicants in one place.
          </Typography.Text>
        </div>
      }
      extra={
        <Button type="primary" onClick={openCreateModal}>
          Add Merchant
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={merchants}
        rowKey="id"
        loading={fetchLoading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        size="middle"
      />

      <Modal
        open={modalOpen}
        title={modalType === "create" ? "Add Merchant" : "Edit Merchant"}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={onCreateLoading || onUpdateLoading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Merchant Name"
            name="name"
            rules={[{ required: true, message: "Merchant name is required" }]}
          >
            <Input placeholder="e.g. Merchant Alpha" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
