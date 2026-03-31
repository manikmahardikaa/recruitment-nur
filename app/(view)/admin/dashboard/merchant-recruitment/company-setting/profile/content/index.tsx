"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Typography,
  message,
} from "antd";

import SupaImageUploader from "@/app/utils/image-uploader";
import { useAuth } from "@/app/utils/useAuth";
import {
  useLocation,
  useLocationByMerchantId,
  useLocationByUserId,
  useLocations,
} from "@/app/hooks/location";
import {
  useProfileCompanyByMerchantId,
  useProfileCompanys,
  useProfileCompany,
} from "@/app/hooks/profile-company";
import {
  ProfileCompanyDataModel,
  ProfileCompanyPayloadCreateModel,
} from "@/app/models/profile-company";
import {
  LocationDataModel,
  LocationPayloadCreateModel,
} from "@/app/models/location";
import { LocationType } from "@prisma/client";

type ProfileCompanyFormValues = Pick<
  ProfileCompanyDataModel,
  | "company_name"
  | "description"
  | "total_employee"
  | "industry"
  | "website_url"
  | "instagram_url"
  | "facebook_url"
  | "linkedin_url"
  | "twitter_url"
  | "logo_url"
>;

type LocationFormValues = {
  id?: string;
  name?: string;
  maps_url?: string;
  type?: LocationType;
  address?: string;
  district?: string;
  province?: string;
  country?: string;
};

type CompanySettingFormValues = ProfileCompanyFormValues & {
  location?: LocationFormValues;
};

const mapProfileToFormValues = (
  profile: ProfileCompanyDataModel
): ProfileCompanyFormValues => ({
  company_name: profile.company_name,
  description: profile.description,
  total_employee: profile.total_employee,
  industry: profile.industry,
  website_url: profile.website_url ?? "",
  instagram_url: profile.instagram_url ?? "",
  facebook_url: profile.facebook_url ?? "",
  linkedin_url: profile.linkedin_url ?? "",
  twitter_url: profile.twitter_url ?? "",
  logo_url: profile.logo_url ?? "",
});

const normalizeFormValues = (
  values: ProfileCompanyFormValues
): ProfileCompanyFormValues => ({
  company_name: values.company_name.trim(),
  description: values.description.trim(),
  total_employee: values.total_employee,
  industry: values.industry,
  website_url: values.website_url?.trim() ?? "",
  instagram_url: values.instagram_url?.trim() ?? "",
  facebook_url: values.facebook_url?.trim() ?? "",
  linkedin_url: values.linkedin_url?.trim() ?? "",
  twitter_url: values.twitter_url?.trim() ?? "",
  logo_url: values.logo_url?.trim() ?? "",
});

export default function CompanySettingProfileContent({
  merchantId,
}: {
  merchantId?: string;
}) {
  const { user_id } = useAuth();
  const [form] = Form.useForm<CompanySettingFormValues>();

  const { data: resolvedData, fetchLoading: resolvedLoading } =
    useProfileCompanyByMerchantId({
      id: merchantId,
    });
  const { onCreate, onCreateLoading } = useProfileCompanys();
  const { onUpdate, onUpdateLoading } = useProfileCompany();
  const { data: merchantLocations = [] } = useLocationByMerchantId({
    id: merchantId,
  });
  const { data: userLocations = [] } = useLocationByUserId({
    id: user_id,
  });
  const locationsData = merchantId ? merchantLocations : userLocations;
  const { onCreate: locationCreate, onCreateLoading: locationCreateLoading } =
    useLocations({});
  const [selectedLocation, setSelectedLocation] =
    useState<LocationDataModel | null>(null);
  const { onUpdate: locationUpdate, onUpdateLoading: locationUpdateLoading } =
    useLocation({
      id: selectedLocation?.id || "",
    });

  const defaultLocation = useMemo(() => {
    if (!locationsData.length) return null;
    return (
      locationsData.find((loc) => loc.type === "HEAD_OFFICE") ??
      locationsData[0]
    );
  }, [locationsData]);

  useEffect(() => {
    if (resolvedData) {
      form.setFieldsValue(mapProfileToFormValues(resolvedData));
    }
  }, [resolvedData, form]);

  useEffect(() => {
    if (!defaultLocation) return;
    setSelectedLocation(defaultLocation);
    form.setFieldsValue({
      location: {
        id: defaultLocation.id,
        name: defaultLocation.name,
        maps_url: defaultLocation.maps_url,
        type: defaultLocation.type,
        address: defaultLocation.address,
        district: defaultLocation.district,
        province: defaultLocation.province,
        country: defaultLocation.country,
      },
    });
  }, [defaultLocation, form]);

  const isSubmitting =
    onCreateLoading ||
    onUpdateLoading ||
    locationCreateLoading ||
    locationUpdateLoading;
  const submittingLabel = resolvedData ? "Save" : "Save Profile";

  const handleFinish = async (values: CompanySettingFormValues) => {
    const normalizedValues = normalizeFormValues(values);
    const locationValues = values.location ?? {};

    const payload: ProfileCompanyPayloadCreateModel = {
      company_name: normalizedValues.company_name,
      description: normalizedValues.description,
      total_employee: normalizedValues.total_employee,
      merchant_id: merchantId ?? resolvedData?.merchant_id ?? "",
      industry: normalizedValues.industry,
      website_url: normalizedValues.website_url || null,
      instagram_url: normalizedValues.instagram_url || null,
      facebook_url: normalizedValues.facebook_url || null,
      linkedin_url: normalizedValues.linkedin_url || null,
      twitter_url: normalizedValues.twitter_url || null,
      logo_url: normalizedValues.logo_url || null,
    };

    try {
      if (resolvedData?.id) {
        await onUpdate({ id: resolvedData.id, payload });
      } else {
        await onCreate(payload);
      }

      const hasLocationInput = [
        locationValues.name,
        locationValues.maps_url,
        locationValues.address,
        locationValues.district,
        locationValues.province,
        locationValues.country,
      ].some((val) => typeof val === "string" && val.trim().length > 0);

      if (hasLocationInput && user_id) {
        const locationPayload: LocationPayloadCreateModel = {
          name: locationValues.name?.trim() || "Head Office",
          maps_url: locationValues.maps_url?.trim() || "",
          type: locationValues.type ?? "HEAD_OFFICE",
          address: locationValues.address?.trim() || "",
          district: locationValues.district?.trim() || "",
          province: locationValues.province?.trim() || "",
          country: locationValues.country?.trim() || "",
          user_id,
          merchant_id: merchantId ?? undefined,
        };

        if (locationValues.id) {
          await locationUpdate({
            id: locationValues.id,
            payload: locationPayload,
          });
        } else {
          const result = await locationCreate(locationPayload);
          const created = result?.data?.result as LocationDataModel | undefined;
          if (created?.id) {
            form.setFieldsValue({
              location: { ...locationValues, id: created.id },
            });
            setSelectedLocation(created);
          }
        }
      }

      form.setFieldsValue(normalizedValues);
    } catch (error) {
      const errMessage =
        error instanceof Error
          ? error.message
          : "Error submitting company profile data.";
      message.error(errMessage);
    }
  };

  const renderForm = () => (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleFinish}
      requiredMark={false}
      style={{ marginTop: 16 }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Form.Item
            label={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Typography.Text strong>Company Logo</Typography.Text>
                <Typography.Text style={{ color: "#d4380d" }}>
                  *
                </Typography.Text>
              </div>
            }
            name="logo_url"
            rules={[{ required: true, message: "Company logo is required" }]}
          >
            <SupaImageUploader
              bucket="web-oss-recruitment"
              folder="company-profile"
              accept="image/png,image/jpeg"
            />
          </Form.Item>
          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary">
              Accepted formats: .jpg, .jpeg, .png
            </Typography.Text>
            <Typography.Text type="secondary">
              Recommended size: 120px x 120px
            </Typography.Text>
          </Space>
        </Col>
        <Col xs={24} md={14}>
          <Typography.Text strong style={{ color: "#d4380d" }}>
            ✱ Required
          </Typography.Text>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            Make sure your logo is square so it appears consistent across all
            your career pages.
          </Typography.Paragraph>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 12]}>
        <Col span={24}>
          <Form.Item
            label="Company Name"
            name="company_name"
            rules={[{ required: true, message: "Company name is required" }]}
          >
            <Input placeholder="Company Name" size="large" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Company description is required" },
            ]}
          >
            <Input.TextArea
              placeholder="What are your company's vision and mission?"
              autoSize={{ minRows: 4 }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[24, 12]}>
        <Col span={24}>
          <Form.Item
            label="Company Website"
            name="website_url"
            rules={[
              {
                type: "url",
                message: "Please enter a valid website URL",
              },
            ]}
          >
            <Input
              placeholder="https://onestepsolutionbali.com/"
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Typography.Title level={5} style={{ marginBottom: 8 }}>
        Social Media
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Add official social media links so candidates can learn more about your
        company culture.
      </Typography.Paragraph>

      <Row gutter={[24, 12]}>
        <Col xs={24} md={12}>
          <Form.Item label="Instagram" name="instagram_url">
            <Input
              placeholder="https://instagram.com/yourcompany"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Facebook" name="facebook_url">
            <Input
              placeholder="https://facebook.com/yourcompany"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="LinkedIn" name="linkedin_url">
            <Input
              placeholder="https://linkedin.com/company/yourcompany"
              size="large"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Twitter" name="twitter_url">
            <Input placeholder="https://twitter.com/yourcompany" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Typography.Title level={5} style={{ marginBottom: 8 }}>
        Company Location
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Add your primary office location for candidates.
      </Typography.Paragraph>

      <Row gutter={[24, 12]}>
        <Col xs={24} md={12}>
          <Form.Item label="Location Name" name={["location", "name"]}>
            <Input placeholder="Head Office" size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Location Type" name={["location", "type"]}>
            <Select
              placeholder="Select type"
              size="large"
              options={[
                { label: "Head Office", value: "HEAD_OFFICE" },
                { label: "Branch Office", value: "BRANCH_OFFICE" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label="Maps URL" name={["location", "maps_url"]}>
            <Input placeholder="https://maps.google.com/..." size="large" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label="Address" name={["location", "address"]}>
            <Input placeholder="Street, Building, etc." size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="District" name={["location", "district"]}>
            <Input placeholder="District" size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Province" name={["location", "province"]}>
            <Input placeholder="Province" size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Country" name={["location", "country"]}>
            <Input placeholder="Country" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button onClick={() => form.resetFields()}>Reset</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          style={{ minWidth: 180, background: "#0052cc" }}
        >
          {submittingLabel}
        </Button>
      </div>
    </Form>
  );

  let content: ReactNode;
  if (resolvedLoading && !resolvedData) {
    content = <Skeleton active paragraph={{ rows: 8 }} />;
  } else if (!merchantId) {
    content = (
      <Typography.Text type="secondary">
        Merchant tidak ditemukan. Silakan pilih merchant terlebih dahulu.
      </Typography.Text>
    );
  } else {
    content = renderForm();
  }

  return (
    <Card>
      <Typography.Title level={4} style={{ marginBottom: 0 }}>
        Company Profile
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Complete your company details so candidates can understand the culture
        and scale of your organization.
      </Typography.Paragraph>

      {content}
    </Card>
  );
}
