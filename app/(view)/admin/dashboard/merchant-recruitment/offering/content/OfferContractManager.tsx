"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  FormInstance,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,

  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FileSearchOutlined,
  FileWordOutlined,
  IdcardOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { createClient } from "@supabase/supabase-js";

import { formatDate } from "@/app/utils/date-helper";
import type { ApplicantDataModel } from "@/app/models/applicant";
import type { ContractTemplateDataModel } from "@/app/models/contract-template";
import {
  useContractTemplate,
  useContractTemplates,
} from "@/app/hooks/contract-template";
import {
  useOfferingContractByApplicantId,
  useOfferingContracts,
} from "@/app/hooks/offering-contract";
import { useAnswerQuestionScreeningByApplicantId } from "@/app/hooks/answer-question-screening";
import type { AnswerQuestionScreeningDataModel } from "@/app/models/answer-question-screening";
import generateCodeUnique from "@/app/utils/generate_code_unique";
import { useUser } from "@/app/hooks/user";
// import CandidateSignatureCard from "./CandidateSignatureCard";
import DirectorSignatureCard from "./DirectorSignatureCard";
import OfferChecklistCard from "./OfferChecklistCard";
import type {
  OfferChecklistItem,
  OfferChecklistKey,
} from "./offer-checklist-types";
import { ScheduleHiredDataModel } from "@/app/models/schedule-hired";
import GenerateCardReferral from "./GenerateCardReferral";
import GenerateCardTeamMember from "./GenerateCardTeamMember";
import LoadingSplash from "@/app/components/common/custom-loading";
export type {
  OfferChecklistItem,
  OfferChecklistKey,
} from "./offer-checklist-types";

const { Text } = Typography;

type GeneratedDoc = {
  templateUrl: string;
  docBlob: Blob | null;
  docName: string;
  vars: TemplateVariables;
  pdfBlob?: Blob | null;
  pdfName?: string;
  pdfUrl?: string;
};

type ContractFormValues = {
  candidate_full_name?: string;
  no_identity?: string;
  address?: string;
  email?: string;
  no_phone?: string;
  name_consultant?: string;
  code_unique?: string;
  position?: string;
  duties?: string[];
  month?: string;
  start_date?: Dayjs;
  salary?: string;
  bonus?: string[];
};

type TemplateVariables = {
  candidate_full_name: string;
  address: string;
  no_phone: string;
  email: string;
  no_identity: string;
  position: string;
  duties: string[];
  month: string;
  start_date: string;
  end_date: string;
  salary: string;
  sal: string;
  bonus: string[];
  name_consultant: string;
  code_unique: string;
  candidate: ApplicantDataModel | null;
  user: ApplicantDataModel["user"] | null;
  job: ApplicantDataModel["job"] | null;
  schedules: ScheduleHiredDataModel[] | null;
  [key: string]: unknown;
};

const CONSULTANT_KEYWORDS = ["consult", "konsul"];

const isConsultantQuestion = (row?: AnswerQuestionScreeningDataModel) => {
  if (!row?.question) return false;
  const combined = [
    row.question.text,
    row.question.placeholder,
    row.question.helpText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!combined) return false;
  if (CONSULTANT_KEYWORDS.some((keyword) => combined.includes(keyword))) {
    return true;
  }
  return combined.includes("referral") && combined.includes("nama");
};

const extractConsultantName = (
  answers?: AnswerQuestionScreeningDataModel[]
): string => {
  if (!answers?.length) return "";

  for (const row of answers) {
    if (!isConsultantQuestion(row)) continue;

    const textAnswer = row.answerText?.trim();
    if (textAnswer) return textAnswer;

    const labels =
      row.selectedOptions
        ?.map(
          (sel) =>
            row.question?.options?.find((opt) => opt.id === sel.optionId)?.label
        )
        .filter((label): label is string => Boolean(label && label.trim())) ??
      [];

    if (labels.length) return labels[0].trim();
  }

  return "";
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseBucket = "web-oss-recruitment";
const supabase = createClient(supabaseUrl, supabaseKey);

const fetchArrayBuffer = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
  return res.arrayBuffer();
};

const parseMultilineList = (
  vals?: Array<string | null | undefined>
): string[] =>
  (vals ?? [])
    .flatMap((value) =>
      String(value ?? "")
        .split(/\r?\n|;/g)
        .map((s) => s.replace(/^\s*[-–—•]\s*/, ""))
    )
    .map((s) => s.trim())
    .filter(Boolean);

const fillTemplateToDocxBlob = (buf: ArrayBuffer, data: TemplateVariables) => {
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });
  doc.setData(data);
  try {
    doc.render();
  } catch (error) {
    console.error("Docxtemplater render error:", error);
    throw new Error(
      "Failed to fill template. Please check variable placeholders."
    );
  }
  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return out as Blob;
};

const revokeBlobUrl = (url?: string) => {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
};

const buildTemplateVariables = (
  candidate: ApplicantDataModel | null,
  schedules: ScheduleHiredDataModel[]
): TemplateVariables => {
  const candidateName = candidate?.user.name || "";
  const candidateUser = candidate?.user ?? null;
  const candidateJob = candidate?.job ?? null;
  const jobPosition =
    candidateJob?.job_title || candidateJob?.job_role || "";
  const startDefault = candidate?.createdAt
    ? formatDate(candidate.createdAt)
    : "";

  return {
    candidate_full_name: candidateName,
    address: candidateUser?.address || "",
    no_phone: candidateUser?.phone || "",
    email: candidateUser?.email || "",
    no_identity: candidateUser?.no_identity || "",
    position: jobPosition,
    duties: [] as string[],
    month: "",
    start_date: startDefault,
    end_date: "",
    salary: "",
    sal: "",
    bonus: [] as string[],
    name_consultant: "",
    code_unique: "",
    candidate,
    user: candidateUser,
    job: candidateJob,
    schedules: schedules.length ? schedules : null,
  };
};

const mapTemplateVarsToFormValues = (
  vars: TemplateVariables
): ContractFormValues => ({
  candidate_full_name: vars.candidate_full_name,
  address: vars.address,
  no_phone: vars.no_phone,
  email: vars.email,
  no_identity: vars.no_identity,
  name_consultant: vars.name_consultant,
  code_unique: vars.code_unique,
  position: vars.position,
  duties: Array.isArray(vars.duties) && vars.duties.length ? vars.duties : [""],
  month: vars.month,
  start_date: vars.start_date ? dayjs(vars.start_date) : undefined,
  salary: vars.salary,
  bonus: Array.isArray(vars.bonus) && vars.bonus.length ? vars.bonus : [""],
});

const cloneTemplateVariables = (
  vars: TemplateVariables
): TemplateVariables => ({
  ...vars,
  duties: Array.isArray(vars.duties) ? [...vars.duties] : [],
  bonus: Array.isArray(vars.bonus) ? [...vars.bonus] : [],
});

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred.";
};

type OfferContractManagerProps = {
  candidate: ApplicantDataModel | null;
  schedules?: ScheduleHiredDataModel[];
};

export function OfferContractManager({
  candidate,
  schedules = [],
}: OfferContractManagerProps) {
  const queryClient = useQueryClient();
  const templateDefaults = useMemo(
    () => buildTemplateVariables(candidate ?? null, schedules),
    [candidate, schedules]
  );
  const isReferralJob = candidate?.job?.type_job === "REFFERAL";
  const hasMemberCard = useMemo(
    () => Boolean(candidate?.user?.member_card_url),
    [candidate?.user?.member_card_url]
  );
  const hasTeamMemberCard = useMemo(
    () => Boolean(candidate?.user?.team_member_card_url),
    [candidate?.user?.team_member_card_url]
  );

  const { data: screeningAnswers, fetchLoading: screeningAnswersLoading } =
    useAnswerQuestionScreeningByApplicantId({
      applicantId: candidate?.id,
      enabled: Boolean(candidate?.id) && isReferralJob,
    });

  const referralConsultantName = useMemo(
    () => (isReferralJob ? extractConsultantName(screeningAnswers) : ""),
    [isReferralJob, screeningAnswers]
  );

  const referralUniqueCode = useMemo(() => {
    if (!isReferralJob) return "";
    const fullName = candidate?.user?.name?.trim();
    if (!fullName) return "";
    const firstName = fullName.split(/\s+/)[0] || fullName;
    return generateCodeUnique(firstName, 8);
  }, [isReferralJob, candidate?.user?.name]);

  const userId = candidate?.user_id ?? "";
  const { onPatchCodeUnique } = useUser({ id: userId });
  const lastPatchedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReferralJob || !referralUniqueCode || !userId) return;
    if (candidate?.user?.no_unique === referralUniqueCode) {
      lastPatchedCodeRef.current = referralUniqueCode;
      return;
    }
    if (lastPatchedCodeRef.current === referralUniqueCode) return;

    let cancelled = false;
    lastPatchedCodeRef.current = referralUniqueCode;
    onPatchCodeUnique({
      id: userId,
      payload: { no_unique: referralUniqueCode },
    }).catch(() => {
      if (!cancelled && lastPatchedCodeRef.current === referralUniqueCode) {
        lastPatchedCodeRef.current = null;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    isReferralJob,
    referralUniqueCode,
    userId,
    onPatchCodeUnique,
    candidate?.user?.no_unique,
  ]);

  const { onCreate: onCreateContract } = useOfferingContracts({});
  const {
    data: contractByApplicant,
    onRequestDirectorSignature,
    onRequestDirectorSignatureLoading,
    // onApplyCandidateSignature,
    // onApplyCandidateSignatureLoading,
    // onSendFinalEmail,
    // onSendFinalEmailLoading,
  } = useOfferingContractByApplicantId({
    applicant_id: candidate?.id || "",
  });
  const hasExistingContract = Boolean(
    contractByApplicant?.id || contractByApplicant?.filePath
  );

  const hasAccepetedCandidate = Boolean(
    contractByApplicant?.candidateDecision === "ACCEPTED"
  );
  const directorSignatureSignedAt =
    contractByApplicant?.directorSignatureSignedAt || null;
  const directorSignedPdfUrl =
    contractByApplicant?.directorSignedPdfUrl ?? undefined;
  const hasDirectorSigned = Boolean(
    directorSignatureSignedAt || directorSignedPdfUrl
  );
  const directorSignatureRequestedAt =
    contractByApplicant?.directorSignatureRequestedAt || null;
  const directorSignatureUrl =
    contractByApplicant?.directorSignatureUrl ?? undefined;
  // const candidateSignatureUrl =
  //   contractByApplicant?.candidateSignatureUrl ?? undefined;
  const candidateSignedPdfUrl =
    contractByApplicant?.candidateSignedPdfUrl ?? undefined;
  // const candidateSignedPdfAt =
  //   contractByApplicant?.candidateSignedPdfAt || null;
  // const candidateNotifyEmail = contractByApplicant?.notifyEmail || "";

  const defaultDirectorEmail = useMemo(
    () => process.env.NEXT_PUBLIC_DIRECTOR_SIGNATURE_EMAIL || "",
    []
  );
  const [directorEmail, setDirectorEmail] = useState(defaultDirectorEmail);

  useEffect(() => {
    setDirectorEmail(defaultDirectorEmail);
  }, [candidate?.id, defaultDirectorEmail]);

  const isDirectorEmailValid = useMemo(() => {
    if (!directorEmail) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(directorEmail);
  }, [directorEmail]);

  const [offerChecklist, setOfferChecklist] = useState<
    Record<OfferChecklistKey, boolean>
  >({
    contractFinalized: hasExistingContract,
    signatureDirectur: isReferralJob ? true : hasDirectorSigned,
    decisionCandidate: hasAccepetedCandidate,
    generateCardReferral: isReferralJob ? hasMemberCard : true,
    generateCardTeamMember: hasTeamMemberCard
  });
  const [offerTriggeredAt, setOfferTriggeredAt] = useState<string | null>(null);
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    setOfferChecklist((prev) =>
      prev.contractFinalized === hasExistingContract
        ? prev
        : { ...prev, contractFinalized: hasExistingContract }
    );
  }, [hasExistingContract]);

  useEffect(() => {
    setOfferChecklist((prev) =>
      prev.decisionCandidate === hasAccepetedCandidate
        ? prev
        : { ...prev, decisionCandidate: hasAccepetedCandidate }
    );
  }, [hasAccepetedCandidate]);

  useEffect(() => {
    const nextDirectorValue = isReferralJob ? true : hasDirectorSigned;
    setOfferChecklist((prev) =>
      prev.signatureDirectur === nextDirectorValue
        ? prev
        : { ...prev, signatureDirectur: nextDirectorValue }
    );
  }, [hasDirectorSigned, isReferralJob]);

  useEffect(() => {
    const nextCardValue = isReferralJob ? hasMemberCard : true;
    setOfferChecklist((prev) =>
      prev.generateCardReferral === nextCardValue
        ? prev
        : { ...prev, generateCardReferral: nextCardValue }
    );
  }, [isReferralJob, hasMemberCard]);

  const updateChecklist = useCallback(
    (key: OfferChecklistKey, value: boolean) => {
      setOfferChecklist((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleRequestSignature = useCallback(async () => {
    if (!contractByApplicant?.id) {
      message.warning("Generate the contract before requesting signature.");
      return;
    }
    if (!directorEmail) {
      message.warning("Please assign director email first.");
      return;
    }
    if (!isDirectorEmailValid) {
      message.warning("Director email is invalid.");
      return;
    }
    try {
      await onRequestDirectorSignature({
        contractId: contractByApplicant.id,
        email: directorEmail,
      });
    } catch (error) {
      message.error(`Failed to send signature request email ${error}`);
    }
  }, [
    contractByApplicant?.id,
    directorEmail,
    isDirectorEmailValid,
    onRequestDirectorSignature,
  ]);

  // const handleApplyCandidateSignature = useCallback(async () => {
  //   if (!contractByApplicant?.id) return;
  //   if (!candidateSignatureUrl) {
  //     message.warning("Candidate has not uploaded a signature yet.");
  //     return;
  //   }
  //   try {
  //     await onApplyCandidateSignature({ contractId: contractByApplicant.id });
  //     message.success("Candidate signature applied to contract.");
  //   } catch (error) {
  //     message.error("Failed to apply candidate signature.");
  //   }
  // }, [
  //   candidateSignatureUrl,
  //   contractByApplicant?.id,
  //   onApplyCandidateSignature,
  // ]);

  // const handleSendFinalEmail = useCallback(async () => {
  //   if (!contractByApplicant?.id) return;
  //   if (!candidateSignedPdfUrl) {
  //     message.warning("Generate the signed PDF before sending email.");
  //     return;
  //   }
  //   if (!candidateNotifyEmail) {
  //     message.warning("Assign candidate email in the contract form first.");
  //     return;
  //   }
  //   try {
  //     await onSendFinalEmail({ contractId: contractByApplicant.id });
  //     message.success("Signed contract sent to candidate.");
  //   } catch (error) {
  //     message.error("Failed to send signed contract email.");
  //   }
  // }, [
  //   candidateNotifyEmail,
  //   candidateSignedPdfUrl,
  //   contractByApplicant?.id,
  //   onSendFinalEmail,
  // ]);

  const handleResetOfferChecklist = useCallback(() => {
    setOfferTriggeredAt(null);
    setOfferChecklist({
      contractFinalized: hasExistingContract,
      signatureDirectur: isReferralJob ? true : hasDirectorSigned,
      decisionCandidate: hasAccepetedCandidate,
      generateCardReferral: isReferralJob ? hasMemberCard : true,
      generateCardTeamMember: hasTeamMemberCard
    });
  }, [
    hasExistingContract,
    hasAccepetedCandidate,
    hasDirectorSigned,
    isReferralJob,
    hasMemberCard,
    hasTeamMemberCard,
  ]);

  const handleTriggerOfferReady = useCallback(async () => {
    setSendingOffer(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setOfferTriggeredAt(new Date().toISOString());
      message.success(
        "Offer-ready notification has been queued for the candidate."
      );
    } finally {
      setSendingOffer(false);
    }
  }, []);

  const checklistItems = useMemo<OfferChecklistItem[]>(() => {
    const directorDescription = directorSignedPdfUrl
      ? directorSignatureSignedAt
        ? `Director signed PDF uploaded on ${dayjs(
            directorSignatureSignedAt
          ).format("MMM D, YYYY HH:mm")}.`
        : "Director signed PDF uploaded."
      : directorSignatureRequestedAt
      ? `Awaiting director signature • requested ${dayjs(
          directorSignatureRequestedAt
        ).format("MMM D, YYYY HH:mm")}`
      : "Send the contract to directors for signature.";

    const memberCardUrl = candidate?.user?.member_card_url;
    const teamMemberCardUrl = candidate?.user?.team_member_card_url;

    // Item kondisional (referral vs non-referral)
    const signatureItems: OfferChecklistItem[] = isReferralJob
      ? [
          {
            key: "generateCardReferral",
            title: "Generate Card Referral",
            description: memberCardUrl
              ? "Referral member card has been generated and stored as PDF."
              : "Generate Card Referral for Sahabat Referral",
            fileUrl: memberCardUrl || undefined,
            icon: <IdcardOutlined />,
            disabled: true,
          },
        ]
      : [
          {
            key: "signatureDirectur",
            title: "Directors signed",
            description: directorDescription,
            fileUrl: directorSignedPdfUrl || directorSignatureUrl || undefined,
            icon: <UsergroupAddOutlined />,
            disabled: true,
          },
          {
            key: "generateCardTeamMember",
            title: "Generate Card Team Member",
            description: hasMemberCard
              ? "Team member card has been generated and linked below."
              : "Generate the team member card and ensure details are correct.",
            fileUrl: teamMemberCardUrl || undefined,
            icon: <IdcardOutlined />,
            disabled: true,
          },
        ];

    return [
      {
        key: "contractFinalized",
        title: "Contract finalized",
        description: hasExistingContract
          ? "Latest contract version saved and linked below."
          : "Generate the contract and ensure details are correct before sending.",
        icon: <FileDoneOutlined />,
        disabled: true,
      },
      {
        key: "decisionCandidate",
        title: "Candidate accepted",
        description: hasAccepetedCandidate
          ? "Candidate has accepted the offer."
          : "Candidate has not accepted the offer.",
        fileUrl: candidateSignedPdfUrl,
        icon: <CheckOutlined />,
        disabled: true,
      },

      ...signatureItems,
    ];
  }, [
    isReferralJob,
    directorSignatureSignedAt,
    directorSignatureRequestedAt,
    directorSignedPdfUrl,
    directorSignatureUrl,
    hasAccepetedCandidate,
    hasExistingContract,
    candidateSignedPdfUrl,
    hasMemberCard,
    candidate?.user?.member_card_url,
    candidate?.user?.team_member_card_url,
  ]);

  const checklistValues = useMemo(
    () => Object.values(offerChecklist),
    [offerChecklist]
  );
  const checklistPercent = useMemo(
    () =>
      Math.round(
        (checklistValues.filter(Boolean).length / checklistValues.length || 0) *
          100
      ),
    [checklistValues]
  );
  const isOfferReady = useMemo(
    () => checklistValues.every(Boolean),
    [checklistValues]
  );

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const { data: templates } = useContractTemplates({});
  const { data: selectedTemplate } = useContractTemplate({
    id: selectedTemplateId || "",
  });

  const [isResultOpen, setIsResultOpen] = useState(false);
  const [docState, setDocState] = useState<GeneratedDoc | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applyingEdits, setApplyingEdits] = useState(false);
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [showTeamMemberCardGenerator, setShowTeamMemberCardGenerator] =
    useState(false);
  const [showReferralCardGenerator, setShowReferralCardGenerator] =
    useState(false);

  const [form] = Form.useForm<ContractFormValues>();

  useEffect(() => {
    return () => revokeBlobUrl(docState?.pdfUrl);
  }, [docState]);

  useEffect(() => {
    setShowTeamMemberCardGenerator(false);
    setShowReferralCardGenerator(false);
  }, [candidate?.id]);

  const openPicker = () => setIsPickerOpen(true);
  const closePicker = () => {
    if (generating) return;
    setIsPickerOpen(false);
  };

  const closeResult = () => {
    revokeBlobUrl(docState?.pdfUrl);
    setDocState(null);
    setIsResultOpen(false);
  };

  const convertDocxBlobToPdf = useCallback(
    async (docBlob: Blob, docName: string) => {
      setConvertingPdf(true);
      try {
        const fileForServer = new File([docBlob], docName, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const fd = new FormData();
        fd.append("file", fileForServer);

        const res = await fetch("/api/convert/docs-pdf", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Convert error ${res.status}`);
        }
        const pdfBlob = await res.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfName = docName.replace(/\.docx$/i, "") + ".pdf";
        setDocState((prev) => {
          if (!prev) return prev;
          revokeBlobUrl(prev.pdfUrl);
          return { ...prev, pdfBlob, pdfUrl, pdfName };
        });
        message.success("Converted to PDF.");
      } finally {
        setConvertingPdf(false);
      }
    },
    []
  );

  const handleGenerateContract = useCallback(async () => {
    if (!selectedTemplateId) {
      message.warning("Please select a contract template first.");
      return;
    }
    if (!selectedTemplate?.filePath) {
      message.error("Template URL not found.");
      return;
    }

    try {
      setGenerating(true);

      const buf = await fetchArrayBuffer(selectedTemplate.filePath);
      const vars = cloneTemplateVariables(templateDefaults);

      if (isReferralJob) {
        if (referralConsultantName) {
          vars.name_consultant = referralConsultantName;
        }
        if (referralUniqueCode) {
          vars.code_unique = referralUniqueCode;
        }
      }

      const filledBlob = fillTemplateToDocxBlob(buf, vars);

      const cleanedBaseName =
        (selectedTemplate.name || "Contract")
          .replace(/[^\w\- ]+/g, "")
          .trim() || "Contract";
      const suggestedDocName = `${cleanedBaseName} - ${
        vars.candidate_full_name || "Candidate"
      }.docx`;

      setDocState({
        templateUrl: selectedTemplate.filePath,
        docBlob: filledBlob,
        docName: suggestedDocName,
        vars,
      });

      setIsResultOpen(true);
      message.success("Template generated successfully.");
      await convertDocxBlobToPdf(filledBlob, suggestedDocName);
    } catch (error) {
      console.error(error);
      message.error(getErrorMessage(error));
    } finally {
      setGenerating(false);
      closePicker();
    }
  }, [
    selectedTemplateId,
    selectedTemplate?.filePath,
    selectedTemplate?.name,
    templateDefaults,
    isReferralJob,
    referralConsultantName,
    referralUniqueCode,
    convertDocxBlobToPdf,
    closePicker,
  ]);

  const handleApplyEdits = useCallback(async () => {
    if (!docState) {
      message.error("No document state to edit.");
      return;
    }

    try {
      setApplyingEdits(true);
      const values = await form.validateFields();
      const next: TemplateVariables = { ...docState.vars };

      next.candidate_full_name = values.candidate_full_name ?? "";
      next.no_identity = values.no_identity ?? "";
      next.address = values.address ?? "";
      next.no_phone = values.no_phone ?? "";
      next.name_consultant = values.name_consultant ?? "";
      next.code_unique = values.code_unique ?? "";
      next.position = values.position ?? "";
      next.month = values.month ?? "";
      next.salary = values.salary ?? "";
      next.duties = parseMultilineList(values.duties);
      next.bonus = parseMultilineList(values.bonus);
      next.start_date = values.start_date
        ? formatDate(values.start_date.toDate())
        : "";

      const buf = await fetchArrayBuffer(docState.templateUrl);
      const rebuiltBlob = fillTemplateToDocxBlob(buf, next);

      revokeBlobUrl(docState.pdfUrl);
      setDocState({
        ...docState,
        docBlob: rebuiltBlob,
        vars: next,
        pdfBlob: null,
        pdfName: undefined,
        pdfUrl: undefined,
      });

      message.success("Edits applied. Regenerating PDF preview...");
      await convertDocxBlobToPdf(rebuiltBlob, docState.docName);
    } catch (error) {
      console.error(error);
      message.error(getErrorMessage(error));
    } finally {
      setApplyingEdits(false);
    }
  }, [docState, form, convertDocxBlobToPdf]);
  const uploadToSupabase = async (file: Blob, fileName: string) => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase env (NEXT_PUBLIC_SUPABASE_URL/KEY) belum diset."
      );
    }
    const safeName = fileName.replace(/\s+/g, "_");
    const folder = `contracts/${candidate?.id || "general"}`;
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from(supabaseBucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(path);
    if (!pub?.publicUrl) throw new Error("Gagal mendapatkan public URL.");
    return { path, publicUrl: pub.publicUrl };
  };

  const uploadPdfToSupabase = async (file: Blob, fileName: string) => {
    const safeName = fileName.replace(/\s+/g, "_").replace(/\.docx$/i, ".pdf");
    const folder = `contracts`;
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from(supabaseBucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(path);
    if (!pub?.publicUrl) throw new Error("Gagal mendapatkan public URL (PDF).");
    return { path, publicUrl: pub.publicUrl };
  };

  const handleCreateContract = useCallback(async () => {
    if (!docState?.docBlob) {
      message.error("No document to create contract.");
      return;
    }
    try {
      setCreatingContract(true);

      const { publicUrl: docxUrl } = await uploadToSupabase(
        docState.docBlob,
        docState.docName
      );

      let pdfUrl: string | null = null;
      if (docState.pdfBlob) {
        const up = await uploadPdfToSupabase(
          docState.pdfBlob,
          docState.pdfName || docState.docName.replace(/\.docx$/i, ".pdf")
        );
        pdfUrl = up.publicUrl;
      }

      const payload = {
        applicant_id: candidate?.id || "",
        name: docState.pdfName || docState.docName,
        filePath: pdfUrl ?? docxUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await onCreateContract(payload);

      if (candidate?.id) {
        queryClient.invalidateQueries({
          queryKey: ["offering-contract", candidate.id],
        });
      }

      message.success("Contract created & uploaded to Supabase.");
      closeResult();
    } catch (error) {
      console.error(error);
      message.error(getErrorMessage(error));
    } finally {
      setCreatingContract(false);
    }
  }, [
    candidate?.id,
    closeResult,
    docState,
    onCreateContract,
    queryClient,
    uploadToSupabase,
    uploadPdfToSupabase,
  ]);

  const handleConvertToPdf = useCallback(async () => {
    if (!docState?.docBlob) {
      message.error("No document found to convert.");
      return;
    }
    await convertDocxBlobToPdf(docState.docBlob, docState.docName);
  }, [docState, convertDocxBlobToPdf]);

  useEffect(() => {
    if (!docState) {
      form.resetFields();
      return;
    }
    form.setFieldsValue(mapTemplateVarsToFormValues(docState.vars));
  }, [docState, form]);

  useEffect(() => {
    if (!isReferralJob) return;
    const updates: Partial<ContractFormValues> = {};
    const currentName = form.getFieldValue("name_consultant");
    if (referralConsultantName && !currentName) {
      updates.name_consultant = referralConsultantName;
    }
    const currentCode = form.getFieldValue("code_unique");
    if (referralUniqueCode && !currentCode) {
      updates.code_unique = referralUniqueCode;
    }
    if (Object.keys(updates).length) {
      form.setFieldsValue(updates);
    }
  }, [isReferralJob, referralConsultantName, referralUniqueCode, form]);

  if (!candidate) {
    return (
      <Card style={{ borderRadius: 14 }}>
        <Empty description="No candidate selected" />
      </Card>
    );
  }

  return (
    <>
      <Card
        style={{ borderRadius: 14 }}
        title={
          <Space>
            <FileWordOutlined />
            <span>File Contract</span>
          </Space>
        }
        extra={
          hasExistingContract ? (
            <Tag color="green">Created</Tag>
          ) : (
            <Tag>Not Created</Tag>
          )
        }
      >
        {hasExistingContract ? (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                href={contractByApplicant?.filePath}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: 8 }}
              >
                Open
              </Button>
              <Button
                icon={<DownloadOutlined />}
                href={contractByApplicant?.filePath}
                download
              >
                Download
              </Button>
            </div>
            <Alert
              type="success"
              message="Contract has been generated. You can still regenerate it if needed."
              showIcon
            />
            <Button
              type="dashed"
              icon={<ReloadOutlined />}
              onClick={openPicker}
            >
              Regenerate Contract
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" size={8}>
            <Text type="secondary">
              No contract has been generated for this candidate.
            </Text>
            <Space>
              <Select
                style={{ minWidth: 260 }}
                placeholder="Choose a contract template"
                value={selectedTemplateId || undefined}
                onChange={setSelectedTemplateId}
                options={(templates || []).map((t) => ({
                  label: t.name,
                  value: t.id,
                }))}
              />
              <Button
                type="primary"
                icon={<FileWordOutlined />}
                onClick={() => {
                  if (!selectedTemplateId) {
                    message.info("Please select a template first.");
                    return;
                  }
                  openPicker();
                }}
              >
                Create Contract
              </Button>
            </Space>
            {selectedTemplateId ? (
              <Text type="secondary">
                Selected template:{" "}
                <Text strong>
                  {
                    (templates || []).find((t) => t.id === selectedTemplateId)
                      ?.name
                  }
                </Text>
              </Text>
            ) : null}
          </Space>
        )}
      </Card>

      {!isReferralJob ? (
        <DirectorSignatureCard
          hasExistingContract={hasExistingContract}
          hasDirectorSigned={hasDirectorSigned}
          directorSignatureRequestedAt={directorSignatureRequestedAt}
          directorSignatureSignedAt={directorSignatureSignedAt}
          directorEmail={directorEmail}
          isDirectorEmailValid={isDirectorEmailValid}
          showDirectorEmailError={
            !isDirectorEmailValid && Boolean(directorEmail)
          }
          onDirectorEmailChange={setDirectorEmail}
          onRequestSignature={handleRequestSignature}
          requestLoading={onRequestDirectorSignatureLoading}
          directorSignatureUrl={directorSignatureUrl!}
          directorSignedPdfUrl={directorSignedPdfUrl!}
          candidateSignedPdfUrl={candidateSignedPdfUrl!}
        />
      ) : (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {candidate.user?.member_card_url && !showReferralCardGenerator ? (
            <Card
              bordered={false}
              style={{
                borderRadius: 20,
                marginTop: 12,
                background: "#fff",
                boxShadow: "0 4px 18px rgba(15, 23, 42, 0.08)",
              }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              <Space
                align="center"
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Space>
                  <IdcardOutlined style={{ fontSize: 18 }} />
                  <Text strong style={{ fontSize: 16 }}>
                    Member Card
                  </Text>
                </Space>
                <Tag
                  color="success"
                  style={{
                    borderRadius: 999,
                    fontWeight: 600,
                    padding: "0 12px",
                  }}
                >
                  Created
                </Tag>
              </Space>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 12 }}
              >
                A referral member card PDF has been generated and stored by
                admin.
              </Text>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                {/\.(png|jpe?g|gif|webp)$/i.test(
                  candidate.user.member_card_url.split("?")[0] || ""
                ) ? (
                  <Image
                    src={candidate.user.member_card_url}
                    alt="Member card"
                    style={{
                      width: "100%",
                      maxWidth: 420,
                      borderRadius: 12,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                ) : (
                  <iframe
                    src={candidate.user.member_card_url}
                    title="Member card preview"
                    style={{
                      width: "100%",
                      height: 420,
                      borderRadius: 12,
                      border: "1px solid #f0f0f0",
                    }}
                  />
                )}
                <Button
                  type="link"
                  icon={<FilePdfOutlined />}
                  href={candidate.user.member_card_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ paddingLeft: 0 }}
                >
                  Download Member Card
                </Button>
                <Button
                  type="primary"
                  onClick={() => setShowReferralCardGenerator(true)}
                >
                  Regenerate Member Card
                </Button>
              </Space>
            </Card>
          ) : (
            <GenerateCardReferral
              applicant_id={candidate.id}
              consultantName={referralConsultantName}
              candidateName={candidate.user?.name || ""}
              no_unique={referralUniqueCode}
              loading={screeningAnswersLoading}
              onClose={
                candidate.user?.member_card_url
                  ? () => setShowReferralCardGenerator(false)
                  : undefined
              }
            />
          )}
        </Space>
      )}

      {!isReferralJob && (
        <div style={{ marginTop: 12 }}>
          {candidate?.user?.team_member_card_url &&
          !showTeamMemberCardGenerator ? (
            <Card
              title="Team Member Card"
              style={{ borderRadius: 14 }}
              bodyStyle={{ paddingBottom: 16 }}
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                {/\.(png|jpe?g|gif|webp)$/i.test(
                  candidate.user.team_member_card_url.split("?")[0] || ""
                ) ? (
                  <Image
                    src={candidate.user.team_member_card_url}
                    alt="Team member card"
                    style={{
                      width: "100%",
                      maxWidth: 420,
                      borderRadius: 12,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                ) : (
                  <iframe
                    src={candidate.user.team_member_card_url}
                    title="Team member card preview"
                    style={{
                      width: "100%",
                      height: 420,
                      borderRadius: 12,
                      border: "1px solid #f0f0f0",
                    }}
                  />
                )}
                <Space>
                  <Button
                    type="link"
                    icon={<FilePdfOutlined />}
                    href={candidate.user.team_member_card_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ paddingLeft: 0 }}
                  >
                    Download Team Member Card
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setShowTeamMemberCardGenerator(true)}
                  >
                    Regenerate Team Member Card
                  </Button>
                </Space>
              </Space>
            </Card>
          ) : (
            <GenerateCardTeamMember
              candidate={candidate ?? null}
              onClose={
                candidate?.user?.team_member_card_url
                  ? () => setShowTeamMemberCardGenerator(false)
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* <CandidateSignatureCard
        candidateSignatureUrl={candidateSignatureUrl}
        candidateSignedPdfUrl={candidateSignedPdfUrl}
        candidateSignedPdfAt={candidateSignedPdfAt}
        candidateNotifyEmail={candidateNotifyEmail}
        onApplyCandidateSignature={handleApplyCandidateSignature}
        onSendFinalEmail={handleSendFinalEmail}
        applyLoading={onApplyCandidateSignatureLoading}
        sendEmailLoading={onSendFinalEmailLoading}
      /> */}

      <OfferChecklistCard
        items={checklistItems}
        checklist={offerChecklist}
        onUpdate={updateChecklist}
        percent={checklistPercent}
        isOfferReady={isOfferReady}
        hasExistingContract={hasExistingContract}
        offerTriggeredAt={offerTriggeredAt}
        sendingOffer={sendingOffer}
        onTriggerOfferReady={handleTriggerOfferReady}
        onResetChecklist={handleResetOfferChecklist}
      />

      <TemplatePickerModal
        open={isPickerOpen}
        generating={generating}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        onGenerate={handleGenerateContract}
        onCancel={closePicker}
        selectedTemplatePath={selectedTemplate?.filePath}
      />

      <Modal
        open={isResultOpen}
        onCancel={closeResult}
        width={1100}
        bodyStyle={{ maxHeight: "75vh", overflowY: "auto" }}
        title="Contract Preview & Export"
        footer={[
          <Button
            key="apply"
            icon={<SaveOutlined />}
            loading={applyingEdits}
            onClick={handleApplyEdits}
            disabled={!docState}
          >
            Apply Edits
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={handleCreateContract}
            loading={creatingContract}
            disabled={!docState?.docBlob}
          >
            Create Contract
          </Button>,
          <Button
            key="download-docx"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (!docState?.docBlob) return;
              const url = URL.createObjectURL(docState.docBlob);
              const a = document.createElement("a");
              a.href = url;
              a.download = docState.docName || "Contract.docx";
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!docState?.docBlob}
          >
            Download DOCX
          </Button>,
          <Button
            key="convert"
            icon={<FilePdfOutlined />}
            onClick={handleConvertToPdf}
            loading={convertingPdf}
            disabled={
              !docState?.docBlob || (!!docState?.pdfBlob && !convertingPdf)
            }
          >
            {docState?.pdfBlob ? "Reconvert PDF" : "Convert to PDF"}
          </Button>,
          <Button
            key="download-pdf"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (!docState?.pdfBlob || !docState?.pdfUrl) return;
              const a = document.createElement("a");
              a.href = docState.pdfUrl;
              a.download = docState.pdfName || "Contract.pdf";
              a.click();
            }}
            disabled={!docState?.pdfBlob}
          >
            Download PDF
          </Button>,
        ]}
      >
        {!docState ? (
          <div
            style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}
          >
            <LoadingSplash />
          </div>
        ) : (
          <ContractResultTabs
            docState={docState}
            convertingPdf={convertingPdf}
            onConvertToPdf={handleConvertToPdf}
            form={form}
            candidate={candidate}
          />
        )}
      </Modal>
    </>
  );
}

type ContractResultTabsProps = {
  candidate: ApplicantDataModel;
  docState: GeneratedDoc;
  convertingPdf: boolean;
  onConvertToPdf: () => Promise<void>;
  form: FormInstance<ContractFormValues>;
};

const ContractResultTabs = ({
  docState,
  convertingPdf,
  onConvertToPdf,
  form,
  candidate,
}: ContractResultTabsProps) => {
  const items = useMemo(
    () => [
      {
        key: "vars",
        label: (
          <span>
            <EditOutlined /> Variables
          </span>
        ),
        children: (
          <VariableEditForm
            form={form}
            convertingPdf={convertingPdf}
            onConvertToPdf={onConvertToPdf}
            candidate={candidate}
          />
        ),
      },
      {
        key: "preview",
        label: (
          <span>
            <FileSearchOutlined /> Preview
          </span>
        ),
        children: (
          <div
            style={{
              minHeight: 360,
              border: "1px dashed #d9d9d9",
              borderRadius: 8,
              padding: 16,
            }}
          >
            {docState.pdfUrl ? (
              <iframe
                src={docState.pdfUrl}
                title="PDF Preview"
                style={{
                  width: "100%",
                  height: "60vh",
                  border: "none",
                  borderRadius: 8,
                }}
              />
            ) : convertingPdf ? (
              <div
                style={{
                  minHeight: "40vh",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <LoadingSplash />
              </div>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Generate the PDF to preview the document."
              />
            )}
          </div>
        ),
      },
      {
        key: "info",
        label: (
          <span>
            <FileWordOutlined /> Meta
          </span>
        ),
        children: <InfoTabContent docState={docState} />,
      },
    ],
    [docState, convertingPdf, form, onConvertToPdf, candidate]
  );

  return <Tabs items={items} destroyInactiveTabPane />;
};

type VariableEditFormProps = {
  candidate: ApplicantDataModel;
  form: FormInstance<ContractFormValues>;
  convertingPdf: boolean;
  onConvertToPdf: () => Promise<void>;
};

const VariableEditForm = ({
  form,
  convertingPdf,
  onConvertToPdf,
  candidate,
}: VariableEditFormProps) => (
  <div>
    <Alert
      style={{ marginBottom: 12 }}
      type="info"
      message="Update variables to match the offer details. Apply edits to refresh the document."
      showIcon
    />
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        duties: [""],
        bonus: [""],
      }}
    >
      <Alert
        style={{ margin: "8px 0 16px" }}
        type="info"
        message="Personal Information"
        showIcon
      />
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name="candidate_full_name" label="Candidate Full Name">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="no_identity" label="Identity Number">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="no_phone" label="Phone">
            <Input />
          </Form.Item>
        </Col>

        {candidate.job.type_job === "REFFERAL" && (
          <>
            <Col xs={24} md={12}>
              <Form.Item name="name_consultant" label="Name Consultant">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="code_unique" label="Code Unique">
                <Input />
              </Form.Item>
            </Col>
          </>
        )}
      </Row>

      {candidate.job.type_job !== "REFFERAL" && (
        <>
          <Alert
            style={{ margin: "8px 0 16px" }}
            type="info"
            message="ARTICLE 1 — Position & Duties"
            showIcon
          />
          <Form.Item name="position" label="Position">
            <Input />
          </Form.Item>
          <Form.List name="duties">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, idx) => (
                  <Row
                    key={field.key}
                    gutter={8}
                    align="middle"
                    style={{ marginBottom: 8 }}
                  >
                    <Col flex="auto">
                      <Form.Item
                        {...field}
                        label={idx === 0 ? "Job Duties" : undefined}
                        name={[field.name]}
                        fieldKey={field.fieldKey}
                        rules={[
                          {
                            required: true,
                            message: "Fill the duty or remove this line.",
                          },
                        ]}
                      >
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 3 }}
                          placeholder={`Job Duty ${idx + 1}`}
                        />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add("")}
                >
                  Add Duty
                </Button>
              </>
            )}
          </Form.List>

          <Alert
            style={{ margin: "8px 0 16px" }}
            type="info"
            message="ARTICLE 2 — Employment Period"
            showIcon
          />
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="month" label="Month (duration in months)">
                <Input placeholder="e.g. 3" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="start_date" label="Start Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            style={{ margin: "8px 0 16px" }}
            type="info"
            message="ARTICLE 4 — Salary & Bonuses"
            showIcon
          />
          <Form.Item label="Salary Amount" name="salary">
            <Input placeholder="e.g. Rp 3.000.000" />
          </Form.Item>

          <Form.List name="bonus">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, idx) => (
                  <Row
                    key={field.key}
                    gutter={8}
                    align="middle"
                    style={{ marginBottom: 8 }}
                  >
                    <Col flex="auto">
                      <Form.Item
                        {...field}
                        label={idx === 0 ? "Bonuses / Allowances" : undefined}
                        name={[field.name]}
                        fieldKey={field.fieldKey}
                      >
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 3 }}
                          placeholder={`Bonus/Allowance ${idx + 1}`}
                        />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add("")}
                >
                  Add Bonus/Allowance
                </Button>
              </>
            )}
          </Form.List>
        </>
      )}
    </Form>

    <Alert
      style={{ marginTop: 12 }}
      type="info"
      message="Click Apply Edits to re-render the template and refresh the PDF preview."
      showIcon
    />
    <Button
      type="primary"
      icon={<FilePdfOutlined />}
      style={{ marginTop: 12 }}
      loading={convertingPdf}
      onClick={onConvertToPdf}
    >
      Convert to PDF Again
    </Button>
  </div>
);

const InfoTabContent = ({ docState }: { docState: GeneratedDoc }) => (
  <Space direction="vertical" size={8} style={{ width: "100%" }}>
    <div>
      <Text type="secondary">DOCX file name</Text>
      <div>
        <Text strong>{docState.docName}</Text>
      </div>
    </div>

    {docState.pdfName && (
      <div>
        <Text type="secondary">PDF file name</Text>
        <div>
          <Text strong>{docState.pdfName}</Text>
        </div>
      </div>
    )}

    <Text type="secondary">Preview uses PDF rendering for accuracy.</Text>
  </Space>
);

type TemplatePickerModalProps = {
  open: boolean;
  generating: boolean;
  templates?: ContractTemplateDataModel[];
  selectedTemplateId: string;
  onSelectTemplate: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  selectedTemplatePath?: string;
};

const TemplatePickerModal = ({
  open,
  generating,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onGenerate,
  onCancel,
}: TemplatePickerModalProps) => {
  const options = useMemo(
    () =>
      (templates || []).map((template) => ({
        label: template.name,
        value: template.id,
      })),
    [templates]
  );

  return (
    <Modal
      title="Select Contract Template"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={generating}>
          Cancel
        </Button>,
        <Button
          key="generate"
          type="primary"
          loading={generating}
          disabled={!selectedTemplateId}
          onClick={onGenerate}
          icon={<ReloadOutlined />}
        >
          Generate
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item label="Template" required>
          <Select
            placeholder="Choose a template"
            value={selectedTemplateId || undefined}
            onChange={onSelectTemplate}
            options={options}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OfferContractManager;
