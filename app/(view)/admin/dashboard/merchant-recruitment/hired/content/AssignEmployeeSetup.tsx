"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Select, Skeleton, Space, Typography } from "antd";

import { useEmployeeSetups } from "@/app/hooks/employee-setup";
import type {
  ApplicantEmployeeSetupDataModel,
  AssignEmployeeSetupPayload,
} from "@/app/models/applicant-employee-setup";

const { Text } = Typography;

type Props = {
  applicantId?: string;
  assignments?: ApplicantEmployeeSetupDataModel[];
  onAssign: (payload: AssignEmployeeSetupPayload) => Promise<unknown>;
  assignLoading?: boolean;
  loading?: boolean;
};

const isSameSelection = (next: string[], current: string[]) => {
  if (next.length !== current.length) return false;
  const currentSet = new Set(current);
  return next.every((id) => currentSet.has(id));
};

export default function AssignEmployeeSetup({
  applicantId,
  assignments = [],
  onAssign,
  assignLoading = false,
  loading = false,
}: Props) {
  const { data: employeeSetups = [], fetchLoading: employeeSetupLoading } =
    useEmployeeSetups({});

  const assignedIds = useMemo(() => {
    if (!assignments.length) return [];
    return Array.from(
      new Set(assignments.map((item) => item.employeeSetupId).filter(Boolean))
    );
  }, [assignments]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasTouched, setHasTouched] = useState(false);

  useEffect(() => {
    if (!hasTouched) {
      setSelectedIds(assignedIds);
    }
  }, [assignedIds, hasTouched]);

  const options = useMemo(
    () =>
      employeeSetups.map((setup) => ({
        label: setup.name,
        value: setup.id,
      })),
    [employeeSetups]
  );

  const isDirty = useMemo(
    () => !isSameSelection(selectedIds, assignedIds),
    [assignedIds, selectedIds]
  );

  const handleAssign = async () => {
    if (!applicantId) return;
    await onAssign({
      applicantId,
      employeeSetupIds: selectedIds,
    });
    setHasTouched(false);
  };

  const isDisabled = !applicantId || assignLoading || loading;

  return (
    <Card style={{ borderRadius: 14 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div>
          <Text strong>Assign Employee Setup</Text>
          <Text
            type="secondary"
            style={{ display: "block", marginTop: 4 }}
          >
            Choose one or more templates to assign to this candidate.
          </Text>
        </div>

        {employeeSetupLoading || loading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : employeeSetups.length === 0 ? (
          <Empty
            description="No employee setup templates found."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Select employee setup templates"
              options={options}
              value={selectedIds}
              onChange={(value) => {
                setSelectedIds(value);
                setHasTouched(true);
              }}
              optionFilterProp="label"
              maxTagCount="responsive"
              disabled={!applicantId}
              style={{ width: "100%" }}
            />

            {!applicantId ? (
              <Alert
                type="info"
                showIcon
                message="Select a candidate to assign employee setup templates."
              />
            ) : null}

            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                type="primary"
                onClick={handleAssign}
                loading={assignLoading}
                disabled={isDisabled || !isDirty}
              >
                Save Assignment
              </Button>
            </Space>
          </>
        )}
      </Space>
    </Card>
  );
}
