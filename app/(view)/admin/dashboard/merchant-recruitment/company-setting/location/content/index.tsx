import { Card, Flex, Form, Table, Typography, Input, Tag } from "antd";
import { useMemo, useState } from "react";
import CustomButton from "@/app/components/common/custom-buttom";
import {
  PlusOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { useLocation, useLocations } from "@/app/hooks/location";
import { LocationDataModel } from "@/app/models/location";
import { LocationColumns } from "./columns";
import LocationModal from "@/app/components/common/modal/admin/location";
import { useAuth } from "@/app/utils/useAuth";

export default function LocationManagementContent() {
  const [form] = Form.useForm<LocationDataModel>();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationDataModel | null>(null);
  const [query, setQuery] = useState("");
  const user_id = useAuth().user_id;

  const {
    data: locationsData = [],
    onCreate: locationCreate,
    onCreateLoading: locationLoadingCreate,
    onDelete: onDeleteLocation,
  } = useLocations({});

  const { onUpdate: locationUpdate, onUpdateLoading: locationLoadingUpdate } =
    useLocation({
      id: selectedLocation?.id || "",
    });

  const handleEdit = (id: string) => {
    const location = locationsData.find((item) => item.id === id);
    if (!location) return;
    setSelectedLocation(location);
    setModalType("update");
    setModalOpen(true);
  };

  const filteredData = useMemo(() => {
    if (!query.trim()) return locationsData;
    const keyword = query.toLowerCase();
    return locationsData.filter((location) => {
      const values = [
        location.name,
        location.address,
        location.province,
        location.country,
        location.district,
      ]
        .filter(Boolean)
        .map((val) => val!.toLowerCase());

      return values.some((val) => val.includes(keyword));
    });
  }, [locationsData, query]);

  const stats = useMemo(() => {
    const total = locationsData.length;
    const headOffice =
      locationsData.filter((item) => item.type === "HEAD_OFFICE").length || 0;
    const branches = total - headOffice;

    const countries = new Set(
      locationsData.map((item) => item.country).filter(Boolean)
    ).size;

    return [
      {
        title: "Total Locations",
        value: total,
        icon: <EnvironmentOutlined />,
      },
      {
        title: "Head Office",
        value: headOffice,
        icon: <ApartmentOutlined />,
      },
      {
        title: "Branch Offices",
        value: branches,
        icon: <ApartmentOutlined />,
      },
      {
        title: "Countries",
        value: countries,
        icon: <FlagOutlined />,
      },
    ];
  }, [locationsData]);

  const columns = LocationColumns({
    onDelete: (id) => onDeleteLocation(id),
    onEdit: (id) => handleEdit(id),
  });

  const handleFinish = async (values: LocationDataModel) => {
    const payload: LocationDataModel = { ...values, user_id: user_id || "" };
    if (modalType === "create") {
      await locationCreate(payload);
    } else if (selectedLocation?.id) {
      await locationUpdate({ id: selectedLocation.id, payload: payload });
    }
    form.resetFields();
    setSelectedLocation(null);
    setModalOpen(false);
    setModalType("create");
  };

  return (
    <div
      style={{
        background:
          "radial-gradient(circle at top left, #fef7f1 0%, #f5f6ff 50%, #ffffff 100%)",
        borderRadius: 24,
        padding: 32,
      }}
    >
      <Card
        bodyStyle={{ padding: 32 }}
        style={{
          borderRadius: 20,
          boxShadow:
            "0 20px 45px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.06)",
          border: "1px solid #f1f5f9",
        }}
      >
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={16}
          style={{ marginBottom: 24 }}
        >
          <div>
            <Typography.Title
              level={3}
              style={{ marginBottom: 0, color: "#1f2937" }}
            >
              Location Management
            </Typography.Title>
            <Typography.Text style={{ color: "#6b7280" }}>
              Manage all your office locations and track their visibility across
              the platform.
            </Typography.Text>
          </div>
          <CustomButton
            title="Add Location"
            onClick={() => {
              form.resetFields();
              setSelectedLocation(null);
              setModalType("create");
              setModalOpen(true);
            }}
            icon={<PlusOutlined />}
          />
        </Flex>

        <Flex gap={16} wrap="wrap" style={{ marginBottom: 24 }}>
          {stats.map((stat) => (
            <Card
              key={stat.title}
              style={{
                flex: "1 1 180px",
                borderRadius: 16,
                border: "1px solid #eef0fb",
                background: "#fdfbff",
              }}
              bodyStyle={{ padding: 16 }}
            >
              <Flex align="center" gap={12}>
                <Tag
                  color="processing"
                  style={{
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    paddingInline: 10,
                    margin: 0,
                  }}
                >
                  {stat.icon}
                </Tag>
                <div>
                  <Typography.Text type="secondary">
                    {stat.title}
                  </Typography.Text>
                  <Typography.Title
                    level={4}
                    style={{ marginBottom: 0, color: "#111827" }}
                  >
                    {stat.value}
                  </Typography.Title>
                </div>
              </Flex>
            </Card>
          ))}
        </Flex>

        <Card
          bodyStyle={{ padding: 18 }}
          style={{
            borderRadius: 16,
            border: "1px solid #eef2ff",
            background: "#f8f7ff",
            marginBottom: 18,
          }}
        >
          <Flex
            gap={16}
            wrap="wrap"
            justify="space-between"
            align="center"
          >
            <Input
              placeholder="Search by name, address, province..."
              prefix={<SearchOutlined style={{ color: "#a7aec1" }} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              allowClear
              size="large"
              style={{
                maxWidth: 420,
                borderRadius: 30,
                background: "#fff",
                border: "1px solid #e5e7eb",
              }}
            />

            <Typography.Text style={{ color: "#6b7280" }}>
              {filteredData.length} location
              {filteredData.length !== 1 ? "s" : ""}
            </Typography.Text>
          </Flex>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            position: ["bottomRight"],
          }}
          scroll={{ x: 960 }}
          bordered={false}
          rowClassName={() => "location-row"}
          style={{
            borderRadius: 16,
            overflow: "hidden",
          }}
        />

        <LocationModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            form.resetFields();
            setSelectedLocation(null);
            setModalType("create");
          }}
          form={form}
          type={modalType}
          initialValues={
            modalType === "update" ? selectedLocation ?? undefined : undefined
          }
          handleFinish={handleFinish}
          loadingCreate={locationLoadingCreate}
          loadingUpdate={locationLoadingUpdate}
        />
      </Card>
    </div>
  );
}
