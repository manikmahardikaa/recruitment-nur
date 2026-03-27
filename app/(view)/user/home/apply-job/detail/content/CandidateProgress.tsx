"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Card,
  Col,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
  Button,
  Divider,
  Modal,
  Progress,
  Badge,
  Input,
  Alert,
  Image,
  message,
  Empty,
} from "antd";
import {
  CheckCircleTwoTone,
  SearchOutlined,
  MessageOutlined,
  LaptopOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ApplicantDataModel } from "@/app/models/applicant";
import { useUser } from "@/app/hooks/user";
import { useOfferingContractByApplicantId } from "@/app/hooks/offering-contract";
import Link from "next/link";
import { useLocations } from "@/app/hooks/location";
import { humanizeType } from "@/app/utils/humanize";
import {
  PROGRESS_STAGE_ORDER,
  getStageLabel,
  coerceStage,
  toProgressStage,
} from "@/app/utils/recruitment-stage";
import SignaturePadUploader from "./SignatureUploader";
import { useScheduleHiredsByApplicantId } from "@/app/hooks/schedule-hired";
import { formatDateTime } from "@/app/utils/date-helper";
import LoadingSplash from "@/app/components/common/custom-loading";
import UploadIdentityComponentManual from "./UploadIdentityComponentManual";

const { Title, Text } = Typography;
const { TextArea } = Input;

type Props = {
  applicant: ApplicantDataModel;
  meta?: {
    screeningStartedOn?: string;
    screeningDeadline?: string;
    assignedTo?: string;
    interviewDate?: string;
    offerUrl?: string;
    rejectedReason?: string;
  };
};

const stageOrder = PROGRESS_STAGE_ORDER;

type CandidateDecisionState = "PENDING" | "ACCEPTED" | "DECLINED";

const DECISION_STATUS_META: Record<
  CandidateDecisionState,
  { label: string; color: string; helper: string }
> = {
  PENDING: {
    label: "Pending",
    color: "gold",
    helper: "Please review the offer to provide your decision.",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "green",
    helper:
      "You have accepted the offer. HR will contact you for the next steps.",
  },
  DECLINED: {
    label: "Declined",
    color: "red",
    helper:
      "You have declined the offer. You can contact HR if you change your mind.",
  },
};

// ---------------- Stage Config ----------------
type ActionItem = {
  key: string;
  label: string;
  button?: {
    text: string;
    disabled?: boolean;
    tooltip?: string;
    onClick?: () => void;
  };
};

type StageInfoItem = {
  label: string;
  value: React.ReactNode;
};

type SummaryMetric = {
  key: string;
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
};

// ---------------- Component ----------------
export default function CandidateProgress({ applicant, meta }: Props) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionMode, setDecisionMode] = useState<"ACCEPT" | "DECLINE" | null>(
    null,
  );
  const [isContractPreviewOpen, setIsContractPreviewOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const sigBoxDecisionRef = useRef<HTMLDivElement | null>(null);
  const sigBoxPreviewRef = useRef<HTMLDivElement | null>(null);
  const [activeSigBox, setActiveSigBox] = useState<
    "decision" | "preview" | null
  >(null);
  const [sigPos, setSigPos] = useState({ x: 20, y: 20 });
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const router = useRouter();
  const { data: scheduleHired } = useScheduleHiredsByApplicantId({
    applicantId: applicant.id || "",
  });
  const currentStage = toProgressStage(applicant.stage);
  const nowStageIndex = stageOrder.findIndex((s) => s === currentStage);
  const normalizedStageIndex = nowStageIndex === -1 ? 0 : nowStageIndex;
  const { data: locations } = useLocations({});

  const {
    data: contractByApplicant,
    onSubmitDecision,
    onSubmitDecisionLoading,
  } = useOfferingContractByApplicantId({
    applicant_id: applicant.id || "",
  });

  const { onPatchDocument } = useUser({ id: applicant.user_id });

  const decisionStatus = useMemo<CandidateDecisionState>(() => {
    const raw = (contractByApplicant?.candidateDecision ||
      "PENDING") as CandidateDecisionState;
    return DECISION_STATUS_META[raw] ? raw : "PENDING";
  }, [contractByApplicant?.candidateDecision]);

  const decisionMeta = DECISION_STATUS_META[decisionStatus];
  const decisionAtDate = contractByApplicant?.candidateDecisionAt
    ? dayjs(contractByApplicant.candidateDecisionAt)
    : null;
  const decisionAtDisplay = decisionAtDate
    ? decisionAtDate.format("MMMM D, YYYY HH:mm")
    : null;
  const isDecisionLocked = decisionStatus !== "PENDING";
  const signatureUrlFromServer =
    contractByApplicant?.candidateSignatureUrl || null;
  const signaturePathFromServer =
    contractByApplicant?.candidateSignaturePath || null;
  const contractUrl = contractByApplicant?.filePath || null;
  const isContractPdf = useMemo(() => {
    if (!contractUrl) return false;
    const lower = contractUrl.toLowerCase();
    return lower.includes(".pdf");
  }, [contractUrl]);
  const directorSignedPdfUrl =
    contractByApplicant?.directorSignedPdfUrl || null;
  const candidateSignedPdfUrl =
    contractByApplicant?.candidateSignedPdfUrl || null;
  const finalDocumentUrl = useMemo(
    () => directorSignedPdfUrl || candidateSignedPdfUrl || null,
    [candidateSignedPdfUrl, directorSignedPdfUrl],
  );
  const firstPartyName =
    process.env.NEXT_PUBLIC_CONTRACT_FIRST_PARTY_NAME ||
    "CV OSS Bali Internasional";
  const firstPartyRepresentative =
    process.env.NEXT_PUBLIC_CONTRACT_FIRST_PARTY_REPRESENTATIVE ||
    "Putu Astina Putra";
  const firstPartyRole =
    process.env.NEXT_PUBLIC_CONTRACT_FIRST_PARTY_ROLE || "Direktur";

  const hasDirectorSignedDocument = Boolean(directorSignedPdfUrl);

  const handlePatchDocument = useCallback(
    async (nik: string, imageUrl: string) => {
      if (!applicant.user_id) return;
      await onPatchDocument({
        id: applicant.user_id,
        payload: {
          no_identity: nik,
          no_identity_url: imageUrl,
        },
      });
    },
    [applicant.user_id, onPatchDocument],
  );

  const handleOpenModal = useCallback(() => {
    setIsOpenModal(true);
  }, []);

  const handleCancelModal = useCallback(() => {
    setIsOpenModal(false);
  }, []);

  const handleOpenDecisionModal = useCallback(() => {
    setDecisionMode(
      decisionStatus === "ACCEPTED"
        ? "ACCEPT"
        : decisionStatus === "DECLINED"
          ? "DECLINE"
          : null,
    );
    setSignatureUrl(signatureUrlFromServer);
    setSignaturePath(signaturePathFromServer);
    setRejectionReason(contractByApplicant?.candidateRejectionReason || "");
    setSigPos({ x: 20, y: 20 });
    setActiveSigBox("decision");
    setIsDecisionModalOpen(true);
  }, [
    contractByApplicant?.candidateRejectionReason,
    decisionStatus,
    signaturePathFromServer,
    signatureUrlFromServer,
  ]);

  const handleCloseDecisionModal = useCallback(() => {
    setIsDecisionModalOpen(false);
    setDecisionMode(null);
    setRejectionReason("");
    setSignatureUrl(null);
    setSignaturePath(null);
    setActiveSigBox(null);
    setIsContractPreviewOpen(false);
  }, []);

  const handleSelectDecision = useCallback(
    (mode: "ACCEPT" | "DECLINE") => {
      if (isDecisionLocked) return;
      setDecisionMode(mode);
      if (mode === "ACCEPT" && contractUrl) {
        setIsContractPreviewOpen(true);
      }
      if (mode === "DECLINE") {
        setIsContractPreviewOpen(false);
      }
    },
    [contractUrl, isDecisionLocked],
  );

  const handleSubmitAcceptance = useCallback(async () => {
    if (!applicant?.id) return;
    if (!signatureUrl) {
      message.warning("Please upload your signature before submitting.");
      return;
    }

    try {
      const payload: {
        decision: CandidateDecisionState;
        signatureUrl: string;
        signaturePath?: string | null;
        signaturePosition?: { x: number; y: number };
      } = {
        decision: "ACCEPTED",
        signatureUrl,
      };
      if (signaturePath) {
        payload.signaturePath = signaturePath;
      }
      payload.signaturePosition = sigPos;

      await onSubmitDecision(payload);
      message.success("Thank you! Your acceptance has been submitted.");
      handleCloseDecisionModal();
    } catch (error) {
      message.error(
        `Failed to submit your decision. Please try again ${error}`,
      );
    }
  }, [
    applicant?.id,
    handleCloseDecisionModal,
    onSubmitDecision,
    signaturePath,
    signatureUrl,
    sigPos,
  ]);

  const handleSubmitDecline = useCallback(async () => {
    if (!applicant?.id) return;
    try {
      const payload: {
        decision: CandidateDecisionState;
        rejectionReason?: string;
      } = {
        decision: "DECLINED",
      };

      if (rejectionReason.trim()) {
        payload.rejectionReason = rejectionReason.trim();
      }

      await onSubmitDecision(payload);
      message.success("Thank you for letting us know.");
      handleCloseDecisionModal();
    } catch (error) {
      message.error(
        `Failed to submit your decision. Please try again. ${error}`,
      );
    }
  }, [
    applicant?.id,
    handleCloseDecisionModal,
    onSubmitDecision,
    rejectionReason,
  ]);

  // drag handler untuk signature placement
  useEffect(() => {
    const getActiveBox = () => {
      if (activeSigBox === "decision") return sigBoxDecisionRef.current;
      if (activeSigBox === "preview") return sigBoxPreviewRef.current;
      return null;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSig) return;
      const box = getActiveBox();
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const imgWidth = 180;
      const imgHeight = 90;
      const nextX = e.clientX - rect.left - dragOffset.current.x;
      const nextY = e.clientY - rect.top - dragOffset.current.y;
      setSigPos({
        x: Math.min(Math.max(0, nextX), rect.width - imgWidth),
        y: Math.min(Math.max(0, nextY), rect.height - imgHeight),
      });
    };
    const handleMouseUp = () => setIsDraggingSig(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeSigBox, isDraggingSig]);

  const headOffice = useMemo(() => {
    if (!Array.isArray(locations)) return null;
    const ho = locations.find((item) => item.type === "HEAD_OFFICE");
    if (!ho) return null;
    return {
      name: ho.name,
      type: ho.type,
      mapsUrl: ho.maps_url,
    };
  }, [locations]);

  function getStageConfig(
    stage: string,
    applicant: ApplicantDataModel,
    router: ReturnType<typeof useRouter>,
    meta?: Props["meta"],
  ) {
    const m = meta || {};

    switch (stage) {
      case "APPLICATION":
        return {
          title: "Application Details",
          info: [
            {
              label: "Submitted On",
              value: dayjs(applicant.createdAt).format("MMMM D, YYYY"),
            },
            { label: "Position", value: applicant.job?.job_title ?? "-" },
          ],
          actions: [
            {
              key: "cv-review",
              label: "Recruiter will review your CV",
              button: {
                text: "View CV",
                onClick: () =>
                  window.open(
                    applicant.user?.curiculum_vitae_url || "#",
                    "_blank",
                  ),
                disabled: !applicant.user?.curiculum_vitae_url,
                tooltip: !applicant.user?.curiculum_vitae_url
                  ? "No CV found"
                  : "Open CV",
              },
            },
          ] as ActionItem[],
        };

      case "SCREENING":
        return {
          title: "Screening Stage Details",
          info: [{ label: "STATUS", value: "In Progress" }],
          actions: [] as ActionItem[],
        };

      case "INTERVIEW": {
        const interviews = [...(applicant.scheduleInterview ?? [])]
          .filter((it) => dayjs(it.start_time ?? it.date).isValid())
          .sort((a, b) => {
            const aTime = dayjs(a.start_time ?? a.date).valueOf();
            const bTime = dayjs(b.start_time ?? b.date).valueOf();
            return aTime - bTime;
          });

        const now = Date.now();
        const upcomingInterview =
          interviews.find(
            (item) => dayjs(item.start_time ?? item.date).valueOf() >= now,
          ) ?? null;
        const latestInterview =
          interviews.length > 0 ? interviews[interviews.length - 1] : null;

        const selectedInterview = upcomingInterview ?? latestInterview ?? null;

        const rawInterviewDate =
          m.interviewDate ??
          selectedInterview?.start_time ??
          selectedInterview?.date ??
          null;

        const hasInterviewDate = Boolean(rawInterviewDate);
        const hasSelectedInterview =
          Boolean(selectedInterview) && hasInterviewDate;

        const interviewStatus = hasInterviewDate
          ? dayjs(rawInterviewDate).valueOf() < now
            ? "Completed"
            : "Scheduled"
          : "Awaiting schedule";

        const interviewDateDisplay = hasInterviewDate
          ? dayjs(rawInterviewDate).format("HH:mm, MMMM D, YYYY")
          : "-";

        const scheduleLabel = hasInterviewDate
          ? "Review or reschedule your interview"
          : "Schedule interview with recruiter";

        // —— HANYA HITUNG METHOD JIKA SUDAH ADA JADWAL ——
        let methodValue: React.ReactNode = "-";
        if (hasSelectedInterview) {
          const isOnline = selectedInterview!.is_online === true;
          if (isOnline) {
            const link = selectedInterview!.meeting_link;
            methodValue = link ? (
              <Link href={link} target="_blank" rel="noreferrer">
                Online Meeting (open link)
              </Link>
            ) : (
              "Online (link pending)"
            );
          } else {
            // offline — boleh fallback ke Head Office *hanya setelah ada jadwal*
            const hq = headOffice;
            methodValue = hq ? (
              <Space direction="vertical" size={2}>
                <Text strong>{hq.name} (Offline)</Text>
                {hq.type && <Tag color="blue">{humanizeType(hq.type)}</Tag>}
                {hq.mapsUrl && (
                  <Link href={hq.mapsUrl} target="_blank" rel="noreferrer">
                    View on Maps
                  </Link>
                )}
              </Space>
            ) : (
              "Offline (location pending)"
            );
          }
        }

        return {
          title: "Interview Stage Details",
          info: [
            { label: "Status", value: interviewStatus },
            { label: "Interview Date", value: interviewDateDisplay },
            { label: "Method", value: methodValue }, // <- saat belum ada jadwal, pasti "-"
          ],
          actions: [
            {
              key: "schedule",
              label: scheduleLabel,
              button: {
                text: hasInterviewDate ? "Reschedule" : "Schedule",
                tooltip: hasInterviewDate
                  ? "Update interview time"
                  : "Pick interview time",
                onClick: () =>
                  window.open(
                    `/evaluator/schedule?applicant_id=${applicant.id}`,
                    "_blank",
                    "noopener,noreferrer",
                  ),
              },
            },
            {
              key: "prep",
              label: "Read interview preparation guideline",
              button: {
                text: "Open Guide",
                onClick: () => window.open("/guide/interview", "_blank"),
              },
            },
            {
              key: "doc",
              label: "Upload Documents",
              button: {
                text: "Upload Documents",
                // onClick: handleOpenModal,
              },
            },
          ] as ActionItem[],
        };
      }

      case "OFFERING": {
        const hasOfferDocument = Boolean(contractByApplicant?.filePath);
        const isDecisionPending = decisionStatus === "PENDING";

        // Toleransi salah eja "REFERRAL" vs "REFFERAL"
        const isReferralJob = ["REFERRAL", "REFFERAL"].includes(
          (applicant.job?.type_job ?? "").toUpperCase(),
        );

        const actions: ActionItem[] = [
          {
            key: "upload-identity",
            label: "Upload identity document",
            button: {
              text: applicant.user?.no_identity_url
                ? "Document Uploaded"
                : "Upload Document",
              onClick: handleOpenModal,
              disabled: !!applicant.user?.no_identity_url,
            },
          },
          {
            key: "offer",
            label: "Review the offer letter",
            button: {
              text: hasOfferDocument ? "View Offer" : "Offer Pending",
              onClick: () =>
                hasOfferDocument &&
                window.open(contractByApplicant!.filePath!, "_blank"),
              disabled: !hasOfferDocument,
              tooltip: hasOfferDocument ? "Open Offer" : "No offer link",
            },
          },
          {
            key: "decision",
            label: `Offer decision — ${decisionMeta.label}`,
            button: {
              text: isDecisionPending ? "Review Decision" : "View Decision",
              onClick: handleOpenDecisionModal,
              tooltip: decisionMeta.helper,
              // tombol hanya dikunci bila belum ada offer dan status masih pending
              disabled: !hasOfferDocument && isDecisionPending,
            },
          },
        ];

        if (finalDocumentUrl) {
          actions.push({
            key: "final-documents",
            label: hasDirectorSignedDocument
              ? "Download director signed contract"
              : "Download signed contract",
            button: {
              text: "Download Final PDF",
              onClick: () =>
                window.open(finalDocumentUrl, "_blank", "noopener,noreferrer"),
            },
          });
        } else {
          actions.push({
            key: "final-documents",
            label: "Final contract pending",
            button: {
              text: "Awaiting Upload",
              disabled: true,
              tooltip:
                "The final signed contract will appear here once available.",
            },
          });
        }

        const memberCardItem: StageInfoItem | undefined = isReferralJob
          ? {
              label: "MEMBER CARD",
              value:
                applicant.user.member_card_url != null ? (
                  <Link
                    href={applicant.user.member_card_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </Link>
                ) : (
                  <Text type="secondary">Not Uploaded</Text>
                ),
            }
          : undefined;

        const infoItems: StageInfoItem[] = [
          { label: "STATUS", value: "Offer Sent" },
          { label: "POSITION", value: applicant.job?.job_title ?? "-" },
          {
            label: "DECISION",
            value: (
              <Space size={6}>
                <Tag color={decisionMeta.color}>{decisionMeta.label}</Tag>
                {!isDecisionPending && decisionAtDisplay && (
                  <Text type="secondary">{decisionAtDisplay}</Text>
                )}
              </Space>
            ),
          },
          ...(memberCardItem ? [memberCardItem] : []),
        ];

        if (decisionStatus === "ACCEPTED" && signatureUrlFromServer) {
          infoItems.push({
            label: "SIGNED OFFER",
            value: (
              <Link
                href={signatureUrlFromServer}
                target="_blank"
                rel="noreferrer"
              >
                View Signature
              </Link>
            ),
          });
        }

        if (finalDocumentUrl) {
          infoItems.push({
            label: hasDirectorSignedDocument
              ? "DIRECTOR SIGNED CONTRACT"
              : "FINAL SIGNED CONTRACT",
            value: (
              <Link href={finalDocumentUrl} target="_blank" rel="noreferrer">
                View final PDF
              </Link>
            ),
          });
        }

        return {
          title: "Offer Stage",
          info: infoItems,
          actions,
        };
      }
      case "HIRING": {
        // HIRED is the hiring/onboarding stage

        const actions: ActionItem[] = [
          {
            key: "upload-identity",
            label: "Upload identity document",
            button: {
              text: applicant.user?.no_identity_url
                ? "Document Uploaded"
                : "Upload Document",
              onClick: handleOpenModal,
              disabled: !!applicant.user?.no_identity_url,
            },
          },
          {
            key: "employyee-setup",
            label: "Complete employee setup procedure documents",
            button: {
              text: "Employee Setup Documents",
              onClick: () =>
                window.open(
                  `/user/home/apply-job/detail/employee-setup?applicant_id=${applicant.id}`,
                  "_blank",
                ),
            },
          },
        ];

        const infoItems: StageInfoItem[] = [
          {
            label: "STATUS",
            value: "Hiring",
          },
          { label: "POSITION", value: applicant.job?.job_title ?? "-" },
          {
            label: "SCHEDULE ONBOARDING",
            value: scheduleHired ? (
              <Space>
                <Tag color="green">
                  {formatDateTime(scheduleHired.start_time)}
                </Tag>
              </Space>
            ) : (
              <Space>
                <Tag color="red">Not Scheduled</Tag>
              </Space>
            ),
          },
        ];

        return {
          title: "Hiring & Onboarding",
          info: infoItems,
          actions,
        };
      }

      case "REJECTED":
        return {
          title: "Application Result",
          info: [
            { label: "STATUS", value: "Rejected" },
            { label: "REASON", value: m.rejectedReason || "—" },
          ],
          actions: [
            {
              key: "feedback",
              label: "Read feedback & resources to improve",
              button: {
                text: "View Resources",
                onClick: () => window.open("/resources/improve", "_blank"),
              },
            },
          ] as ActionItem[],
        };

      default:
        return {
          title: "Information",
          info: [],
          actions: [] as ActionItem[],
        };
    }
  }

  const initials =
    (applicant.user?.name || "Candidate")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";

  const stageConfig = getStageConfig(currentStage, applicant, router, meta);

  const progressTotal =
    currentStage === "REJECTED"
      ? stageOrder.length
      : Math.max(stageOrder.length - 1, 1);
  const progressPosition = Math.min(normalizedStageIndex + 1, progressTotal);
  const stageProgressPercent = Math.round(
    (progressPosition / progressTotal) * 100,
  );
  const nextStageKey =
    normalizedStageIndex < stageOrder.length - 1
      ? stageOrder[normalizedStageIndex + 1]
      : null;
  const nextStageLabel =
    nextStageKey != null
      ? getStageLabel(nextStageKey)
      : currentStage === "REJECTED"
        ? "Process Closed"
        : "Journey Complete";
  const statusInfo = stageConfig.info.find(
    (item) => item.label?.toUpperCase?.() === "STATUS",
  );
  const statusValue =
    typeof statusInfo?.value === "string"
      ? statusInfo.value
      : getStageLabel(currentStage);
  const primaryAction = stageConfig.actions[0];
  const summaryMetrics = useMemo<SummaryMetric[]>(
    () => [
      {
        key: "submitted",
        label: "Submitted",
        value: dayjs(applicant.createdAt).format("MMM D, YYYY"),
        caption: "Application received",
      },
      {
        key: "status",
        label: "Status",
        value: statusValue,
        caption: `Current stage • ${getStageLabel(currentStage)}`,
      },
      {
        key: "next",
        label: nextStageKey ? "Next Milestone" : "Pipeline Status",
        value: nextStageLabel,
        caption: primaryAction?.label || "No outstanding actions",
      },
    ],
    [
      applicant.createdAt,
      currentStage,
      nextStageKey,
      nextStageLabel,
      primaryAction?.label,
      statusValue,
    ],
  );

  const stepsItems = useMemo(
    () =>
      stageOrder.map((stageKey, index) => {
        const isCompleted = normalizedStageIndex > index;
        const isCurrent = normalizedStageIndex === index;
        const status: "finish" | "process" | "wait" = isCompleted
          ? "finish"
          : isCurrent
            ? "process"
            : "wait";
        let descriptor: string;
        if (isCompleted) {
          descriptor = "Completed";
        } else if (isCurrent) {
          descriptor = stageKey === "REJECTED" ? "Closed" : "In progress";
        } else {
          descriptor = stageKey === "REJECTED" ? "N/A" : "Pending";
        }

        return {
          title: getStageLabel(stageKey),
          description: descriptor,
          icon:
            stageKey === "APPLICATION" ? (
              <FileTextOutlined />
            ) : stageKey === "SCREENING" ? (
              <SearchOutlined />
            ) : stageKey === "INTERVIEW" ? (
              <MessageOutlined />
            ) : stageKey === "OFFERING" ? (
              <FileDoneOutlined />
            ) : stageKey === "HIRING" ? (
              <LaptopOutlined />
            ) : (
              <CloseCircleOutlined />
            ),
          status,
        };
      }),
    [normalizedStageIndex],
  );

  return (
    <div
      style={{
        padding: "48px clamp(16px, 5vw, 72px)",
      }}
    >
      <div
        style={{
          margin: "0 auto",
        }}
      >
        <Space direction="vertical" size={24} style={{ display: "flex" }}>
          <Card
            bordered={false}
            style={{
              borderRadius: 24,
              background:
                "linear-gradient(130deg, rgba(44,62,180,1) 0%, rgba(100,71,229,1) 55%, rgba(137,107,255,1) 100%)",
              color: "#fff",
              boxShadow: "0 24px 60px rgba(60,51,153,0.35)",
            }}
            bodyStyle={{ padding: 32 }}
          >
            <Row gutter={[24, 24]} align="middle" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={18}>
                  <Badge
                    status="processing"
                    text={
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>
                        Apply Job Progress Tracking
                      </span>
                    }
                  />
                  <Space align="center" size={20}>
                    <Avatar
                      size={72}
                      src={applicant.user?.photo_url || undefined}
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        color: "#fff",
                        fontSize: 28,
                        fontWeight: 600,
                        border: "2px solid rgba(255,255,255,0.35)",
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Space direction="vertical" size={4}>
                      <Title level={3} style={{ margin: 0, color: "#fff" }}>
                        {applicant.merchant?.name ||
                          applicant.job?.merchant?.name ||
                          "Candidate"}{" "}
                        ·{" "}
                        {applicant.job?.job_title || "—"}
                      </Title>
                      <Text style={{ color: "rgba(255,255,255,0.75)" }}>
                        Application ID: #
                        {applicant.id.toUpperCase().slice(0, 8)}
                      </Text>
                      <Tag
                        color="success"
                        style={{
                          borderRadius: 999,
                          padding: "2px 12px",
                          width: "fit-content",
                        }}
                      >
                        Current Stage — {getStageLabel(currentStage)}
                      </Tag>
                    </Space>
                  </Space>
                </Space>
              </Col>
              <Col>
                <Space direction="vertical" align="center">
                  <Progress
                    type="circle"
                    percent={stageProgressPercent}
                    size={120}
                    strokeColor="#ffce73"
                    trailColor="rgba(255,255,255,0.25)"
                    format={(percent) => (
                      <span style={{ color: "#fff", fontWeight: 600 }}>
                        {percent}%
                      </span>
                    )}
                  />
                  <Button
                    size="large"
                    style={{
                      background: "#ffce73",
                      borderColor: "#ffce73",
                      color: "#1e2b5c",
                      fontWeight: 600,
                      boxShadow: "0 12px 24px rgba(255,206,115,0.35)",
                    }}
                    onClick={() =>
                      window.open("https://wa.me/6281338948759", "_blank")
                    }
                    icon={<MessageOutlined />}
                  >
                    Contact Recruiter
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[20, 20]}>
            {summaryMetrics.map((metric) => (
              <Col xs={24} md={8} key={metric.key}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 18,
                    background: "#ffffff",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
                    height: "100%",
                  }}
                  bodyStyle={{ padding: 20, height: "100%" }}
                >
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ display: "flex" }}
                  >
                    <Text
                      type="secondary"
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                        fontSize: 12,
                      }}
                    >
                      {metric.label}
                    </Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {metric.value}
                    </Title>
                    <Text type="secondary">{metric.caption}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              background: "#ffffff",
              boxShadow: "0 20px 56px rgba(15,23,42,0.12)",
            }}
            title={
              <Space align="center">
                <CheckCircleTwoTone twoToneColor="#52c41a" />
                <span>Pipeline Timeline</span>
              </Space>
            }
            bodyStyle={{ paddingTop: 12 }}
          >
            <Steps
              current={normalizedStageIndex}
              responsive
              items={stepsItems}
            />
          </Card>

          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              background: "#ffffff",
              boxShadow: "0 20px 56px rgba(15,23,42,0.1)",
            }}
            title={
              <Space align="center">
                <FileTextOutlined />
                <span>{stageConfig.title}</span>
              </Space>
            }
            bodyStyle={{ paddingTop: 16 }}
          >
            {stageConfig.info.length > 0 && (
              <>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {stageConfig.info.map((info) => (
                    <div
                      key={info.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        padding: "12px 16px",
                        background: "#f5f7ff",
                        borderRadius: 14,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, textTransform: "uppercase" }}
                      >
                        {info.label}
                      </Text>
                      <div style={{ textAlign: "right" }}>
                        {typeof info.value === "string" ? (
                          <Text strong>{info.value}</Text>
                        ) : (
                          info.value
                        )}
                      </div>
                    </div>
                  ))}
                </Space>
                <Divider />
              </>
            )}

          </Card>


          <Modal
            open={isDecisionModalOpen}
            onCancel={handleCloseDecisionModal}
            title="Offer Decision"
            width={900}
            footer={null}
            bodyStyle={{ padding: 20, paddingTop: 16, background: "#f6f8fb" }}
            style={{ top: 24 }}
          >
            <Space
              direction="vertical"
              size={16}
              style={{ display: "block", width: "100%" }}
            >
              <Card
                bordered
                style={{ borderRadius: 16, marginBottom: 16 }}
                bodyStyle={{ padding: 16 }}
              >
                <Space align="center" size={12} style={{ marginBottom: 8 }}>
                  <Tag
                    color={decisionMeta.color}
                    style={{
                      margin: 0,
                      fontSize: 14,
                      borderRadius: 999,
                      padding: "2px 10px",
                    }}
                  >
                    {decisionMeta.label}
                  </Tag>
                  {decisionStatus !== "PENDING" && decisionAtDisplay && (
                    <Text type="secondary">Submitted {decisionAtDisplay}</Text>
                  )}
                </Space>
                <Text type="secondary">{decisionMeta.helper}</Text>
              </Card>

              {isDecisionLocked && (
                <Alert
                  style={{ marginBottom: 16 }}
                  type="success"
                  showIcon
                  message={
                    decisionStatus === "ACCEPTED"
                      ? "You have already accepted this offer."
                      : "You have already declined this offer."
                  }
                  description="If you need to make changes, please contact the recruitment team."
                />
              )}

              <Card
                bordered
                style={{ borderRadius: 16, marginBottom: 16 }}
                bodyStyle={{ padding: 16 }}
              >
                <Space
                  direction="vertical"
                  size={10}
                  style={{ display: "block" }}
                >
                  <Text strong>Choose your decision</Text>
                  <Text type="secondary">
                    Please review the offer before confirming your choice.
                  </Text>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                      <Button
                        block
                        type={decisionMode === "ACCEPT" ? "primary" : "default"}
                        onClick={() => handleSelectDecision("ACCEPT")}
                        disabled={isDecisionLocked}
                      >
                        Accept Offer
                      </Button>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Button
                        block
                        type={
                          decisionMode === "DECLINE" ? "primary" : "default"
                        }
                        danger
                        onClick={() => handleSelectDecision("DECLINE")}
                        disabled={isDecisionLocked}
                      >
                        Decline Offer
                      </Button>
                    </Col>
                  </Row>
                </Space>
              </Card>

              {decisionMode === "ACCEPT" && (
                <Card
                  bordered
                  style={{ borderRadius: 16 }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ display: "block" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <Space align="center" size={12}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#eef2ff",
                            color: "#4f46e5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FileTextOutlined />
                        </div>
                        <div>
                          <Text strong>Review the contract</Text>
                          <Text type="secondary" style={{ display: "block" }}>
                            Read the contract before signing. Open the preview
                            or download the file.
                          </Text>
                        </div>
                      </Space>
                      {contractUrl ? (
                        <Tag color={isContractPdf ? "blue" : "purple"}>
                          {isContractPdf ? "PDF Contract" : "DOCX Contract"}
                        </Tag>
                      ) : (
                        <Tag>Pending</Tag>
                      )}
                    </div>
                    <Space wrap>
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={() => {
                          setActiveSigBox("preview");
                          setIsContractPreviewOpen(true);
                        }}
                        disabled={!contractUrl}
                      >
                        View Contract
                      </Button>
                      {contractUrl ? (
                        <Button
                          icon={<DownloadOutlined />}
                          href={contractUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </Button>
                      ) : (
                        <Tag>Contract not available yet</Tag>
                      )}
                    </Space>
                  </Space>

                  <Divider style={{ margin: "12px 0" }} />

                  <Space align="center" size={12} style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: "#f0f7ff",
                        color: "#1677ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileDoneOutlined />
                    </div>
                    <div>
                      <Text strong>Signature placement</Text>
                      <Text type="secondary" style={{ display: "block" }}>
                        Drag your signature into the correct field. PNG/JPG up
                        to 5MB.
                      </Text>
                    </div>
                  </Space>

                  <Row gutter={[16, 16]}>
                    {applicant.job.type_job?.toString().toUpperCase() ===
                      "REFERRAL" && (
                      <Col xs={24} md={10}>
                        <div
                          style={{
                            background: "#f9fafc",
                            borderRadius: 14,
                            padding: 16,
                            height: "100%",
                          }}
                        >
                          <Text strong>First Party</Text>
                          <div style={{ marginTop: 12 }}>
                            <Text>{firstPartyRepresentative}</Text>
                          </div>
                          <Text type="secondary">{firstPartyRole}</Text>
                          <Text type="secondary">{firstPartyName}</Text>
                          <Text
                            type="secondary"
                            style={{ display: "block", marginTop: 16 }}
                          >
                            The first-party signature will be applied after
                            internal verification.
                          </Text>
                        </div>
                      </Col>
                    )}
                    <Col xs={24} md={14}>
                      <Space
                        direction="vertical"
                        size={12}
                        style={{ width: "100%" }}
                      >
                        {applicant.job.type_job?.toString().toUpperCase() ===
                          "REFERRAL" && (
                          <Text strong>
                            Second Party — {applicant.user?.name || "Candidate"}
                          </Text>
                        )}
                        <Space
                          direction="vertical"
                          size={8}
                          style={{ width: "100%" }}
                        >
                          <Text type="secondary">Contract preview</Text>
                          <div
                            ref={sigBoxDecisionRef}
                            style={{
                              position: "relative",
                              width: "100%",
                              minHeight: 320,
                              border: "1px solid #e6e9f2",
                              borderRadius: 14,
                              background: "#fff",
                              overflow: "hidden",
                              boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                            }}
                          >
                            {contractUrl ? (
                              isContractPdf ? (
                                <iframe
                                  src={`${contractUrl}#toolbar=0`}
                                  title="Contract preview"
                                  style={{
                                    width: "100%",
                                    height: 320,
                                    border: "none",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    height: 320,
                                    display: "grid",
                                    placeItems: "center",
                                    padding: 24,
                                  }}
                                >
                                  <Text type="secondary">
                                    This contract is not a PDF. Download it to
                                    view the full content.
                                  </Text>
                                </div>
                              )
                            ) : (
                              <div
                                style={{
                                  height: 320,
                                  display: "grid",
                                  placeItems: "center",
                                  padding: 24,
                                }}
                              >
                                <Text type="secondary">
                                  Contract is not available yet.
                                </Text>
                              </div>
                            )}

                            {signatureUrl ? (
                              <div
                                onMouseDown={(e) => {
                                  const box = sigBoxDecisionRef.current;
                                  if (!box) return;
                                  e.preventDefault();
                                  setIsDraggingSig(true);
                                  setActiveSigBox("decision");
                                  const rect = box.getBoundingClientRect();
                                  dragOffset.current = {
                                    x: e.clientX - rect.left - sigPos.x,
                                    y: e.clientY - rect.top - sigPos.y,
                                  };
                                }}
                                style={{
                                  position: "absolute",
                                  left: sigPos.x,
                                  top: sigPos.y,
                                  cursor: "grab",
                                  width: 180,
                                  zIndex: 5,
                                  pointerEvents: "auto",
                                  userSelect: "none",
                                  borderRadius: 0,
                                  border: "1px solid rgba(0,0,0,0.05)",
                                  background: "transparent",
                                }}
                              >
                                <Image
                                  src={signatureUrl}
                                  alt="Candidate signature"
                                  preview={false}
                                  style={{
                                    width: "100%",
                                    display: "block",
                                    borderRadius: 0,
                                    background: "transparent",
                                  }}
                                />
                              </div>
                            ) : null}
                          </div>
                        </Space>
                        <SignaturePadUploader
                          bucket="web-oss-recruitment"
                          folder={`candidate-signatures/${applicant.id}`}
                          value={signatureUrl ?? undefined}
                          onUpload={(path, url) => {
                            setSignatureUrl(url);
                            setSignaturePath(path);
                          }}
                          onSaved={(path, url) => {
                            setSignatureUrl(url);
                            setSignaturePath(path);
                            setSigPos({ x: 20, y: 20 });
                            setDecisionMode("ACCEPT");
                            setActiveSigBox("preview");
                            setIsContractPreviewOpen(true);
                          }}
                          onDelete={() => {
                            setSignatureUrl(null);
                            setSignaturePath(null);
                            setSigPos({ x: 20, y: 20 });
                          }}
                          maxSizeMB={5}
                          width={360}
                          height={180}
                        />
                        {signatureUrl ? (
                          <div
                            style={{
                              border: "1px solid #f0f0f0",
                              borderRadius: 12,
                              padding: 12,
                              background: "#ffffff",
                            }}
                          >
                            <Text
                              type="secondary"
                              style={{ display: "block", marginBottom: 8 }}
                            >
                              Signature preview
                            </Text>
                            <Image
                              src={signatureUrl}
                              alt="Candidate signature preview"
                              style={{ maxWidth: "100%" }}
                              preview={false}
                            />
                          </div>
                        ) : null}
                      </Space>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "12px 0" }} />

                  <Space
                    style={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      type="primary"
                      icon={<FileDoneOutlined />}
                      onClick={handleSubmitAcceptance}
                      loading={onSubmitDecisionLoading}
                      disabled={!signatureUrl || isDecisionLocked}
                    >
                      Submit Acceptance
                    </Button>
                  </Space>
                </Card>
              )}

              {decisionMode === "DECLINE" && (
                <Card
                  bordered
                  style={{ borderRadius: 16 }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ display: "block" }}
                  >
                    <Text strong>Optional note</Text>
                    <Text type="secondary">
                      Let us know why you are declining. This helps us improve
                      the process.
                    </Text>
                    <TextArea
                      placeholder="Share your reason (optional)"
                      rows={4}
                      value={rejectionReason}
                      disabled={isDecisionLocked}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                    />
                    <Space
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <Button
                        danger
                        type="primary"
                        onClick={handleSubmitDecline}
                        loading={onSubmitDecisionLoading}
                        disabled={isDecisionLocked}
                      >
                        Submit Decline
                      </Button>
                    </Space>
                  </Space>
                </Card>
              )}

              {!decisionMode && (
                <Alert
                  type="info"
                  showIcon
                  message="Select accept or decline to continue."
                />
              )}

              {decisionStatus === "ACCEPTED" && signatureUrlFromServer && (
                <Alert
                  style={{ marginTop: 16 }}
                  type="info"
                  showIcon
                  message="Signature on file"
                  description={
                    <Link
                      href={signatureUrlFromServer}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View uploaded signature
                    </Link>
                  }
                />
              )}
            </Space>
          </Modal>

          <Modal
            open={isOpenModal}
            onCancel={handleCancelModal}
            onOk={handleCancelModal}
            title="Upload Identity Document"
            width={1000}
            footer={null}
          >
            {/* <KTPWizard onPatchDocument={handlePatchDocument} /> */}
            <UploadIdentityComponentManual
              onSubmit={handlePatchDocument}
              onClose={handleCancelModal}
            />
          </Modal>

          <Modal
            open={isContractPreviewOpen}
            onCancel={() => {
              setIsContractPreviewOpen(false);
              setActiveSigBox(null);
            }}
            footer={null}
            title="Contract Preview"
            width={960}
            bodyStyle={{ padding: 0, height: "70vh" }}
            destroyOnClose
          >
            <div
              ref={sigBoxPreviewRef}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "70vh",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              {contractUrl ? (
                isContractPdf ? (
                  <iframe
                    src={`${contractUrl}#toolbar=0`}
                    title="Contract document preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 32,
                    }}
                  >
                    <Space direction="vertical" size={16} align="center">
                      <Text type="secondary">
                        Contract preview is available in DOCX format. Download
                        the document to review the content.
                      </Text>
                      <Button
                        icon={<DownloadOutlined />}
                        href={contractUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download Contract
                      </Button>
                    </Space>
                  </div>
                )
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    padding: 24,
                  }}
                >
                  <Empty description="Contract not available yet" />
                </div>
              )}

              {signatureUrl ? (
                <div
                  onMouseDown={(e) => {
                    const box = sigBoxPreviewRef.current;
                    if (!box) return;
                    e.preventDefault();
                    setIsDraggingSig(true);
                    setActiveSigBox("preview");
                    const rect = box.getBoundingClientRect();
                    dragOffset.current = {
                      x: e.clientX - rect.left - sigPos.x,
                      y: e.clientY - rect.top - sigPos.y,
                    };
                  }}
                  style={{
                    position: "absolute",
                    left: sigPos.x,
                    top: sigPos.y,
                    cursor: "grab",
                    width: 180,
                    zIndex: 5,
                    pointerEvents: "auto",
                    userSelect: "none",
                    borderRadius: 0,
                    border: "1px solid rgba(0,0,0,0.05)",
                    background: "transparent",
                  }}
                >
                  <Image
                    src={signatureUrl}
                    alt="Candidate signature"
                    preview={false}
                    style={{
                      width: "100%",
                      display: "block",
                      borderRadius: 0,
                      background: "transparent",
                    }}
                  />
                </div>
              ) : null}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                padding: "10px 16px",
                borderTop: "1px solid #f0f0f0",
                background: "#fafafa",
              }}
            >
              <Button onClick={() => setIsContractPreviewOpen(false)}>
                Close
              </Button>
              <Button
                type="primary"
                icon={<FileDoneOutlined />}
                onClick={handleSubmitAcceptance}
                loading={onSubmitDecisionLoading}
                disabled={!signatureUrl || isDecisionLocked}
              >
                Submit Application
              </Button>
            </div>
          </Modal>
        </Space>
      </div>
    </div>
  );
}
