"use client";

import { useEffect, useMemo, useState } from "react";
import { IdcardOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Image,
  Input,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { ApplicantDataModel } from "@/app/models/applicant";
import { useTeamMemberCardTemplates } from "@/app/hooks/team-member-card-template";
import { TeamMemberCardTemplateDataModel } from "@/app/models/team-member-card-template";
import { useQueryClient } from "@tanstack/react-query";

const { Text } = Typography;

type Props = {
  candidate: ApplicantDataModel | null;
  onClose?: () => void;
};

type GeneratedCard = {
  frontUrl: string;
  pdfUrl: string;
  employeeNumber: string;
  mimeType: string;
};

const base64ToBlob = (base64: string, mime = "image/png") => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

export default function GenerateCardTeamMember({ candidate, onClose }: Props) {
  const queryClient = useQueryClient();
  const { data: templates, fetchLoading: templatesLoading } =
    useTeamMemberCardTemplates({});

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [contractDate, setContractDate] = useState<Dayjs | null>(null);
  const [position, setPosition] = useState<string>(
    candidate?.job?.job_title || candidate?.job?.job_role || ""
  );
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    candidate?.user?.phone || ""
  );
  const [cardResult, setCardResult] = useState<GeneratedCard | null>(null);
  const [generating, setGenerating] = useState(false);

  const dateOfBirth = candidate?.user?.date_of_birth
    ? dayjs(candidate.user.date_of_birth)
    : null;

  useEffect(() => {
    if (!selectedTemplateId && templates?.length) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    setPosition(candidate?.job?.job_title || candidate?.job?.job_role || "");
    setWhatsappNumber(candidate?.user?.phone || "");
    setContractDate(null);
    setCardResult((prev) => {
      if (prev?.frontUrl) {
        URL.revokeObjectURL(prev.frontUrl);
      }
      return null;
    });
  }, [candidate?.id]);

  useEffect(() => {
    return () => {
      if (cardResult?.frontUrl) {
        URL.revokeObjectURL(cardResult.frontUrl);
      }
    };
  }, [cardResult]);

  const selectedTemplate: TeamMemberCardTemplateDataModel | undefined =
    useMemo(
      () => templates?.find((tpl) => tpl.id === selectedTemplateId),
      [templates, selectedTemplateId]
    );

  const employeeNumber = useMemo(() => {
    if (!contractDate || !dateOfBirth) return "";
    const contractKey = contractDate.format("DDMMYYYY");
    const dobKey = dateOfBirth.format("DDMMYYYY");
    return `OSS BALI/66BEMP - ${contractKey} - ${dobKey}`;
  }, [contractDate?.valueOf(), dateOfBirth?.valueOf()]);

  const missingPhoto = !candidate?.user?.photo_url;
  const missingWhatsapp = !whatsappNumber.trim();
  const disableGenerate =
    !candidate ||
    !candidate.id ||
    !selectedTemplate?.id ||
    !contractDate ||
    !dateOfBirth ||
    !position ||
    missingWhatsapp ||
    missingPhoto ||
    generating;

  const isRegeneration = Boolean(candidate?.user?.team_member_card_url && onClose);

  const handleGenerateCard = async () => {
    if (!candidate?.id) {
      message.warning("Candidate is required.");
      return;
    }
    if (!selectedTemplate?.id) {
      message.warning("Please select a team member card template.");
      return;
    }
    if (!contractDate) {
      message.warning("Please choose the contract date.");
      return;
    }
    if (!dateOfBirth) {
      message.warning("Candidate date of birth is required.");
      return;
    }
    if (!position.trim()) {
      message.warning("Position is required.");
      return;
    }
    if (!whatsappNumber.trim()) {
      message.warning("WhatsApp number is required.");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch(
        "/api/admin/dashboard/team-member-card-template/generate-team-member-card",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicant_id: candidate.id,
            templateId: selectedTemplate.id,
            contractDate: contractDate.toISOString(),
            position: position.trim(),
            whatsappNumber: whatsappNumber.trim(),
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json?.message || "Failed to generate team member card."
        );
      }

      const mimeType = json.result?.mimeType || "image/png";
      const blob = base64ToBlob(json.result.front, mimeType);
      if (cardResult?.frontUrl) {
        URL.revokeObjectURL(cardResult.frontUrl);
      }
      const url = URL.createObjectURL(blob);
      setCardResult({
        frontUrl: url,
        pdfUrl: json.result.team_member_card_url,
        employeeNumber: json.result.employeeNumber || employeeNumber,
        mimeType,
      });
      message.success("Team member card generated.");
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      if (candidate?.id) {
        queryClient.invalidateQueries({ queryKey: ["applicant", candidate.id] });
      }
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "Failed to generate card."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card
      style={{ borderRadius: 14 }}
      title={
        <Space>
          <IdcardOutlined />
          <span>Generate Team Member Card</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {!candidate && (
          <Alert
            type="warning"
            message="Select a candidate to generate a card."
            showIcon
          />
        )}

        {isRegeneration && (
          <Alert
            type="info"
            showIcon
            message="Regenerating card"
            description="Generating again will replace the previous team member card."
          />
        )}

        {missingPhoto && (
          <Alert
            type="warning"
            showIcon
            message="Candidate photo is missing."
            description="Upload the candidate photo before generating the card to ensure the photo appears on the card."
          />
        )}

        {!dateOfBirth && (
          <Alert
            type="warning"
            showIcon
            message="Candidate date of birth is missing."
            description="Date of birth is required to build the employee number."
          />
        )}

        {missingWhatsapp && (
          <Alert
            type="warning"
            showIcon
            message="WhatsApp number is missing."
            description="Add a WhatsApp number to generate the QR code on the card."
          />
        )}

        {!templatesLoading && (templates ?? []).length === 0 && (
          <Alert
            type="info"
            showIcon
            message="No team member card templates yet."
            description="Create at least one team member card template before generating the card."
          />
        )}

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text type="secondary">Selected template</Text>
          <Select
            value={selectedTemplateId || undefined}
            onChange={setSelectedTemplateId}
            placeholder="Select template"
            options={(templates || []).map((tpl) => ({
              label: tpl.name,
              value: tpl.id,
            }))}
            loading={templatesLoading}
          />
          {selectedTemplate?.image ? (
            <Image
              src={selectedTemplate.image}
              alt={selectedTemplate.name}
              style={{ width: "100%", borderRadius: 12 }}
            />
          ) : null}
        </Space>

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text type="secondary">Contract date</Text>
          <DatePicker
            style={{ width: "100%" }}
            value={contractDate}
            onChange={(value) => setContractDate(value)}
            placeholder="Select contract date"
            format="DD MMM YYYY"
            size="large"
          />
        </Space>

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text type="secondary">Position</Text>
          <Input
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="Enter position"
            size="large"
          />
        </Space>

        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text type="secondary">WhatsApp number</Text>
          <Input
            value={whatsappNumber}
            onChange={(event) => setWhatsappNumber(event.target.value)}
            placeholder="Example: 628123456789"
            size="large"
            inputMode="numeric"
          />
        </Space>

        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text type="secondary">Employee number</Text>
          <Input value={employeeNumber} readOnly size="large" />
        </Space>

        <Button
          type="primary"
          onClick={handleGenerateCard}
          loading={generating}
          disabled={disableGenerate}
        >
          Generate Team Member Card
        </Button>

        {cardResult ? (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Text strong>Preview</Text>
            <Image
              src={cardResult.frontUrl}
              alt="Team member card"
              style={{ borderRadius: 12 }}
            />
            <Space>
              <Button
                type="default"
                onClick={() => {
                  if (cardResult.frontUrl) {
                    const a = document.createElement("a");
                    a.href = cardResult.frontUrl;
                    a.download = "team-member-card.png";
                    a.click();
                  }
                }}
              >
                Download Image
              </Button>
              <Button
                type="primary"
                href={cardResult.pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open PDF
              </Button>
            </Space>
          </Space>
        ) : (
          <Alert
            type="info"
            showIcon
            message="No card generated yet."
            description="Fill the information and generate to preview the team member card."
          />
        )}

        {onClose ? (
          <Button onClick={onClose} disabled={generating}>
            Back to card preview
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}
