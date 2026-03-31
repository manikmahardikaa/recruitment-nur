"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  Timeline,
  Typography,
  Space,
  Button,
  Form,
  Popconfirm,
  Modal,
  Divider,
  Empty,
  Tag,
  Tooltip,
} from "antd";
import {
  VideoCameraOutlined,
  BankOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { formatDate, formatTime } from "@/app/utils/date-helper";
import NoteInterviewModal from "@/app/components/common/modal/admin/note-interview";
import { NoteInterviewDataModel } from "@/app/models/note-interview";
import {
  useNoteInterview,
  useNoteInterviews,
} from "@/app/hooks/note-interview";

import Link from "next/link";

const { Title, Text } = Typography;

/* ============================ Helpers ============================ */
const SNIPPET_WORDS = 15;
const truncateWords = (t = "", max = 40) =>
  (t || "").trim().split(/\s+/).length <= max
    ? t
    : t.trim().split(/\s+/).slice(0, max).join(" ") + "…";

type Schedule = {
  id: string;
  date: string | Date;
  start_time: string | Date;
  meeting_link?: string | null;
};

export default function ScheduleTimeline({
  schedules,
  applicant_id,
}: {
  schedules: Schedule[];
  applicant_id: string;
}) {
  const accent = "#5b5ce2";

  /* ===================== Notes ===================== */
  const {
    data: noteListRaw,
    onCreate: onCreateNote,
    onDelete: onDeleteNote,
    onCreateLoading: loadingCreateNote,
    fetchLoading: loadingNotes,
  } = useNoteInterviews({ queryString: `applicant_id=${applicant_id}` });

  const notes: NoteInterviewDataModel[] = useMemo(() => {
    if (Array.isArray(noteListRaw)) return noteListRaw;
    if (noteListRaw && typeof noteListRaw === "object") return [noteListRaw];
    return [];
  }, [noteListRaw]);

  const notesSorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notes]
  );

  const latestNote = notesSorted[0] || null;

  const [formNote] = Form.useForm<NoteInterviewDataModel>();
  const [isOpenModalNote, setIsOpenModalNote] = useState(false);
  const [noteModalType, setNoteModalType] = useState<"create" | "update">(
    "create"
  );
  const [selectedNote, setSelectedNote] =
    useState<NoteInterviewDataModel | null>(null);
  const { onUpdate: onUpdateNote, onUpdateLoading: loadingUpdateNote } =
    useNoteInterview({ id: selectedNote?.id || "" });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailNote, setDetailNote] = useState<NoteInterviewDataModel | null>(
    null
  );
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const openCreateNote = () => {
    setSelectedNote(null);
    setNoteModalType("create");
    formNote.resetFields();
    setIsOpenModalNote(true);
  };
  const openEditNote = (note: NoteInterviewDataModel) => {
    setSelectedNote(note);
    setNoteModalType("update");
    formNote.setFieldsValue({ note: note.note });
    setIsOpenModalNote(true);
  };
  const openDetailNote = (note: NoteInterviewDataModel) => {
    setDetailNote(note);
    setDetailOpen(true);
  };
  const closeNoteModal = () => setIsOpenModalNote(false);
  const closeDetailModal = () => setDetailOpen(false);

  const handleFinishNote = async (values: NoteInterviewDataModel) => {
    const payload: NoteInterviewDataModel = { ...values, applicant_id };
    if (noteModalType === "create") await onCreateNote(payload);
    else if (selectedNote?.id)
      await onUpdateNote({ id: selectedNote.id, payload });
    formNote.resetFields();
    setSelectedNote(null);
    setIsOpenModalNote(false);
    setNoteModalType("create");
  };

  const handleDeleteNote = async (id: string) => {
    try {
      setDeletingNoteId(id);
      await onDeleteNote(id);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const renderCreatedAt = (d: string | Date) =>
    `${formatDate(d)} • ${formatTime(d)}`;

  /* ============================ UI ============================ */
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
      <Timeline
        style={{ marginLeft: 8 }}
        items={schedules.flatMap((item) => {
          const isOnline = !!item.meeting_link;

          const interviewCard = {
            dot: (
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `3px solid ${accent}`,
                  background: "#fff",
                  boxShadow: "0 0 0 4px #f0f2ff",
                }}
              />
            ),
            color: accent,
            children: (
              <Card
                bodyStyle={{ padding: 24 }}
                style={{
                  borderRadius: 16,
                  boxShadow:
                    "0 8px 30px rgba(17, 38, 146, 0.06), 0 2px 8px rgba(17, 38, 146, 0.04)",
                  border: "none",
                }}
              >
                <Text type="secondary" style={{ display: "block" }}>
                  {formatDate(item.date)}
                </Text>
                <Space size={10} align="center" style={{ marginTop: 6 }}>
                  {isOnline ? (
                    <VideoCameraOutlined
                      style={{ fontSize: 20, color: accent }}
                    />
                  ) : (
                    <BankOutlined style={{ fontSize: 20, color: accent }} />
                  )}
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: "#2a3342",
                      letterSpacing: 0.2,
                      fontWeight: 800,
                    }}
                  >
                    {isOnline ? "Online Interview" : "On-site Interview"}
                  </Title>
                </Space>
                <Text
                  style={{ display: "block", marginTop: 8, color: "#556070" }}
                >
                  {isOnline ? (
                    <span>
                      Online interview{" "}
                      <Link
                        href={item.meeting_link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.meeting_link}.
                      </Link>
                    </span>
                  ) : (
                    <span>Face-to-face interview at the company location</span>
                  )}
                </Text>
                <Space size={10} style={{ marginTop: 14 }}>
                  <Text strong style={{ fontSize: 18, color: accent }}>
                    Time {formatTime(item.start_time)}
                  </Text>
                </Space>
              </Card>
            ),
          };

          const actionCard = {
            dot: (
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `3px solid ${accent}`,
                  background: "#fff",
                  boxShadow: "0 0 0 4px #f0f2ff",
                }}
              />
            ),
            color: accent,
            children: (
              <Card
                bodyStyle={{ padding: 24 }}
                style={{
                  marginTop: 10,
                  borderRadius: 16,
                  boxShadow:
                    "0 8px 30px rgba(17, 38, 146, 0.06), 0 2px 8px rgba(17, 38, 146, 0.04)",
                  border: "none",
                }}
              >
                <Text strong style={{ display: "block", color: "#2a3342" }}>
                  Action
                </Text>

                {/* ===== Notes ===== */}
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 12, marginBottom: 6 }}
                >
                  Notes ({notesSorted.length})
                </Text>
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {notesSorted.length > 0 ? (
                    notesSorted.map((n) => (
                      <Card
                        key={n.id}
                        size="small"
                        style={{
                          borderRadius: 12,
                          background: "#fafbff",
                          border: "1px solid #eef0fc",
                        }}
                        bodyStyle={{ padding: 12 }}
                      >
                        <Space
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{ cursor: "pointer", width: "100%" }}
                            onClick={() => openDetailNote(n)}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {renderCreatedAt(n.createdAt)}
                            </Text>
                            <Text
                              style={{
                                display: "block",
                                marginTop: 6,
                                textAlign: "justify",
                                lineHeight: "1.6",
                              }}
                            >
                              {truncateWords(n.note, SNIPPET_WORDS)}
                            </Text>
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                marginTop: 6,
                                display: "inline-block",
                                color: accent,
                              }}
                            >
                              <Space size={6}>
                                <EyeOutlined />
                                View detail
                              </Space>
                            </Text>
                          </div>
                          <Space>
                            <Tooltip title="Edit note">
                              <Button
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditNote(n);
                                }}
                                size="small"
                              />
                            </Tooltip>
                            <Popconfirm
                              title="Delete note?"
                              description="This action cannot be undone."
                              okText="Delete"
                              okButtonProps={{
                                danger: true,
                                loading: deletingNoteId === n.id,
                              }}
                              cancelText="Cancel"
                              onConfirm={(e) => {
                                e?.stopPropagation?.();
                                handleDeleteNote(n.id);
                              }}
                              onCancel={(e) => e?.stopPropagation?.()}
                            >
                              <Tooltip title="Delete note">
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  loading={deletingNoteId === n.id}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        </Space>
                      </Card>
                    ))
                  ) : (
                    <Empty
                      description="No notes found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </Space>

                <Space size={12} wrap style={{ marginTop: 18 }}>
                  <Button
                    icon={<CalendarOutlined />}
                    onClick={openCreateNote}
                    loading={loadingNotes}
                  >
                    {latestNote ? "Add Another Note" : "Note"}
                  </Button>
                </Space>

              </Card>
            ),
          };

          return [interviewCard, actionCard];
        })}
      />

      {/* Modal Create / Edit Note */}
      <NoteInterviewModal
        open={isOpenModalNote}
        onClose={closeNoteModal}
        handleFinish={handleFinishNote}
        loadingCreate={loadingCreateNote}
        loadingUpdate={loadingUpdateNote}
        form={formNote}
        type={noteModalType}
      />

      {/* Modal Detail Note */}
      <Modal
        open={detailOpen}
        onCancel={closeDetailModal}
        footer={[
          <Button key="close" onClick={closeDetailModal}>
            Close
          </Button>,
          detailNote && (
            <Button
              key="edit"
              type="primary"
              onClick={() => {
                closeDetailModal();
                if (detailNote) openEditNote(detailNote);
              }}
            >
              Edit
            </Button>
          ),
        ]}
        title={
          detailNote ? (
            <Space direction="vertical" size={0}>
              <Text strong>Note Detail</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {renderCreatedAt(detailNote.createdAt)}
              </Text>
            </Space>
          ) : (
            "Note Detail"
          )
        }
        width={720}
      >
        {detailNote && (
          <Text
            style={{
              display: "block",
              textAlign: "justify",
              lineHeight: "1.8",
              whiteSpace: "pre-wrap",
            }}
          >
            {detailNote.note}
          </Text>
        )}
      </Modal>

    </div>
  );
}
