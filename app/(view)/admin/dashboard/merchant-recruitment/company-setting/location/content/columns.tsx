import ActionTable from "@/app/components/common/action-table";
import "dayjs/locale/id";

import { TableProps } from "antd";
import { LocationDataModel } from "@/app/models/location";
import { makeActionsByType } from "@/app/utils/presets";
import { humanizeType } from "@/app/utils/humanize";

export const LocationColumns = ({
  onDelete,
  onEdit,
}: {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}): TableProps<LocationDataModel>["columns"] => {
  return [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 70,
      render: (_: string, __: LocationDataModel, index: number) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      width: 280,
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: 160,
    },
    {
      title: "Province",
      dataIndex: "province",
      key: "province",
      width: 160,
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      width: 160,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (type: string) => humanizeType(type),
    },
    {
      title: "Maps",
      dataIndex: "maps_url",
      key: "maps_url",
      ellipsis: true,
      render: (value?: string) =>
        value ? (
          <a href={value} target="_blank" rel="noopener noreferrer">
            View Maps
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 120,
      render: (record: LocationDataModel) => (
        <ActionTable
          id={record.id}
          title="Location"
          description={record.name ?? ""}
          items={makeActionsByType({
            type: "default",
            confirmDelete: {
              title: "Delete Contract Template",
              description: `Record "${
                record.name ?? "-"
              }" will be permanently deleted. Continue?`,
              okText: "Delete",
            },
            onEdit: (id: string) => onEdit(id),
            onDelete: (id: string) => onDelete(id),
          })}
        />
      ),
    },
  ];
};
