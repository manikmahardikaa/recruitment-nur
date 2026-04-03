import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Select,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { UserPayloadUpdateModel } from "@/app/models/user";
import { useUser } from "@/app/hooks/user";
import { useAuth } from "@/app/utils/useAuth";
import { useEffect, useMemo } from "react";

const { Title, Text } = Typography;

type SubmitProps = {
  loading?: boolean;
};

function toFileList(url?: string) {
  if (!url) return [];
  const name = decodeURIComponent(url.split("/").pop() || "file");
  return [{ uid: url, name, url }];
}

export default function PersonalInformationDocuments({ loading }: SubmitProps) {
  const [form] = Form.useForm<UserPayloadUpdateModel>();
  const { user_id } = useAuth();

  const { data: detailUserData, onUpdate: onUpdateUser } = useUser({
    id: user_id!,
  });

  const updateUser = async (values: UserPayloadUpdateModel) => {
    const payload: UserPayloadUpdateModel = {
      ...values,
    };

    const dobValue = values.date_of_birth;
    if (!dobValue) {
      payload.date_of_birth = null;
    } else if (dayjs.isDayjs(dobValue)) {
      payload.date_of_birth = dobValue.toISOString();
    } else if (dobValue instanceof Date) {
      payload.date_of_birth = dayjs(dobValue).toISOString();
    } else if (typeof dobValue === "string") {
      payload.date_of_birth = dobValue;
    } else if (
      typeof dobValue === "object" &&
      "set" in dobValue &&
      (dobValue as { set?: Date | string | null }).set
    ) {
      const setValue = (dobValue as { set?: Date | string | null }).set;
      payload.date_of_birth = setValue ? dayjs(setValue).toISOString() : null;
    } else {
      payload.date_of_birth = null;
    }

    await onUpdateUser({ id: user_id!, payload });
  };

  const initialValues = useMemo(() => {
    if (!detailUserData) return undefined;
    return {
      name: detailUserData.name ?? "",
      email: detailUserData.email ?? "",
      phone: detailUserData.phone ?? "",
      date_of_birth: detailUserData.date_of_birth
        ? dayjs(detailUserData.date_of_birth)
        : undefined,
      curiculum_vitae_url: toFileList(
        detailUserData.curiculum_vitae_url ?? undefined
      ),
      photo_url: toFileList(detailUserData.photo_url ?? undefined),
      portfolio_url: toFileList(detailUserData.portfolio_url ?? undefined),
      address: detailUserData.address ?? undefined,
      no_identity: detailUserData.no_identity ?? undefined,
      gender: detailUserData.gender ?? undefined,
    } as unknown as UserPayloadUpdateModel;
  }, [detailUserData]);

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else form.resetFields();
  }, [initialValues, form]);

  // ===== Preview ringkas jika data sudah ada =====

  return (
    <div>
      <Space direction="vertical" size={4} style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>
          Personal Information
        </Title>
        <Text type="secondary">
          Keep your details accurate so our recruiters can reach out swiftly.
        </Text>
      </Space>

      <Form
        form={form}
        layout="vertical"
        size="large"
        requiredMark="optional"
        onFinish={updateUser}
        initialValues={initialValues}
      >
        <Row gutter={[16, 8]}>
          <Col xs={24}>
            <Form.Item
              label="Full Name"
              name="name"
              rules={[
                { required: true, message: "Please enter your full name" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Full Name" />
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
        <Row gutter={[16, 8]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Phone Number "
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
          <Col xs={24} md={16}>
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

        <Row gutter={[16, 8]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Gender"
              name="gender"
              rules={[{ required: true, message: "Please select your gender" }]}
            >
              <Select
                placeholder="Select gender"
                options={[
                  { label: "Male", value: "MALE" },
                  { label: "Female", value: "FEMALE" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item
              label="Address"
              name="address"
              rules={[{ required: true, message: "Please enter your address" }]}
            >
              <Input placeholder="Enter your current address" />
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
            Save
          </Button>
        </Space>
      </Form>
    </div>
  );
}
