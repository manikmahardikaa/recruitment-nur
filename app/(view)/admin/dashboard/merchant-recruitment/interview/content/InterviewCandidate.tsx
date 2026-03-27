"use client";

import React, { useMemo } from "react";
import { Card, Col, Row, Empty, Skeleton } from "antd";

import {
  ScheduleInterviewDataModel,
} from "@/app/models/interview";
import ScheduleTimeline from "./InterviewTimeline";
import CandidateInfoPanel from "@/app/components/common/information-panel";
import { ApplicantDataModel } from "@/app/models/applicant";

/* ---------- helpers ---------- */

/* ================== Page ================== */
export default function InterviewSchedulePage({
  listData = [],
  listLoading = false,
  candidate,
  // submitting = false,
  // onCreateSchedule
}: {
  selectedScheduleId?: string | null;
  candidate: ApplicantDataModel | null;
  interviewers?: { value: string; label: string }[];
  listData?: ScheduleInterviewDataModel[];
  listLoading?: boolean;
  title?: string;
}) {
  // const [rescheduleOpen, setRescheduleOpen] = useState(false);
  // const [editing, setEditing] = useState<ScheduleInterviewDataModel | null>(
  //   null
  // );

  const schedules = useMemo(
    () => listData.filter((s) => s.applicant_id === candidate?.id),
    [listData, candidate?.id]
  );

  // const openReschedule = (item: ScheduleInterviewDataModel) => {
  //   setEditing(item);
  //   setRescheduleOpen(true);
  // };
  // const closeReschedule = () => {
  //   setRescheduleOpen(false);
  //   setEditing(null);
  // };

  // const initialValues = editing && {
  //   candidateId: editing.candidateId,
  //   locationId: editing.locationId ?? editing.location?.id,
  //   online: !!editing.meeting_link,
  //   meeting_link: editing.meeting_link ?? "",
  //   date: dayjs(editing.date),
  //   start_time: dayjs(editing.start_time),
  // };

  // const handleRescheduleSubmit = async (
  //   values: ScheduleInterviewPayloadCreateModel
  // ) => {
  //   if (!editing || !onReschedule) return;
  //   await onReschedule({ id: editing.id, payload: values });
  //   closeReschedule();
  // };

  if (!candidate) {
    return (
      <div
        style={{
          height: 560,
          display: "grid",
          placeItems: "center",
          color: "#bfbfbf",
        }}
      >
        <Empty description="No Candidate Selected" />
      </div>
    );
  }

  const hasSchedules = schedules.length > 0;

  return (
    <Row gutter={[16, 16]}>
      {/* LEFT PANEL (Profile) */}
      <Col xs={24} md={8}>
        <CandidateInfoPanel
          email={candidate.user.email}
          phone={candidate.user.phone}
          dateOfBirth={candidate.user.date_of_birth}
          jobName={candidate.job?.job_title}
          appliedAt={candidate.createdAt}
          updatedAt={candidate.updatedAt}
          cvUrl={candidate.user.curiculum_vitae_url}
          portfolioUrl={candidate.user.portfolio_url}
          stage={candidate.stage}
        />
      </Col>

      {/* RIGHT PANEL (Schedule / Form) */}
      <Col xs={24} md={16}>
        {listLoading ? (
          <Card style={{ borderRadius: 14 }}>
            <Skeleton active />
          </Card>
        ) : hasSchedules ? (
          <ScheduleTimeline
            schedules={schedules}
            // onReschedule={openReschedule}
            applicant_id={candidate.id!}
          />
        ) : (
          // <Card style={{ borderRadius: 14 }}>
          //   <ScheduleInterviewForm
          //     candidateId={candidate.id!}
          //     loading={submitting}
          //     onSubmit={onCreateSchedule}
          //   />
          // </Card>
          <Empty description="No Schedule Found" />
        )}
      </Col>

      {/* <Modal
        title="Reschedule Interview"
        open={rescheduleOpen}
        onCancel={closeReschedule}
        footer={null}
        destroyOnClose
      >
        {editing && (
          <ScheduleInterviewForm
            candidateId={candidate.id!}
            loading={false}
            onSubmit={handleRescheduleSubmit}
            initialValues={initialValues}
            submitText="Update Schedule"
            mode="update"
          />
        )}
      </Modal> */}
    </Row>
  );
}
