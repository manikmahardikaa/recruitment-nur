import React, { useEffect, useMemo, useState } from "react";
import { IdcardOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Image,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { useCardTemplates } from "@/app/hooks/card-template";
import type { CardTemplateDataModel } from "@/app/models/card-template";
import { useQueryClient } from "@tanstack/react-query";

const { Text } = Typography;

type GenerateCardReferralProps = {
  applicant_id: string;
  consultantName?: string;
  candidateName?: string;
  no_unique?: string;
  loading?: boolean;
  onClose?: () => void;
};

type GeneratedCardState = {
  frontUrl: string;
  backUrl?: string;
  frontBlob: Blob;
  backBlob?: Blob;
};

const base64ToBlob = (base64: string, mime = "image/png") => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

export default function GenerateCardReferral({
  applicant_id,
  candidateName,
  no_unique,
  onClose,
}: GenerateCardReferralProps) {
  const queryClient = useQueryClient();
  const { data: cardTemplates, fetchLoading: templatesLoading } =
    useCardTemplates({});

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [cardResult, setCardResult] = useState<GeneratedCardState | null>(null);

  useEffect(() => {
    setSelectedTemplateId("");
    setCardResult((prev) => {
      if (prev?.frontUrl) URL.revokeObjectURL(prev.frontUrl);
      if (prev?.backUrl) URL.revokeObjectURL(prev.backUrl);
      return null;
    });
  }, [applicant_id]);

  const selectedTemplate = useMemo<CardTemplateDataModel | undefined>(
    () => cardTemplates?.find((tpl) => tpl.id === selectedTemplateId),
    [cardTemplates, selectedTemplateId]
  );

  useEffect(() => {
    return () => {
      if (cardResult?.frontUrl) URL.revokeObjectURL(cardResult.frontUrl);
      if (cardResult?.backUrl) URL.revokeObjectURL(cardResult.backUrl);
    };
  }, [cardResult]);

  const handleGenerateCard = async () => {
    if (!candidateName) {
      message.warning("Candidate name is required to generate the card.");
      return;
    }
    if (!selectedTemplate) {
      message.warning("Select a card template first.");
      return;
    }
    const templateFrontUrl = selectedTemplate.image_url_front;
    const templateBackUrl = selectedTemplate.image_url_back;

    if (!templateFrontUrl) {
      message.warning("Selected template harus memiliki gambar depan.");
      return;
    }
    try {
      setGenerating(true);
      const res = await fetch(
        "/api/admin/dashboard/card-template/generate-member-card",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: candidateName,
            no_unique: no_unique,
            applicant_id: applicant_id,
            templateFrontUrl,
            templateBackUrl: templateBackUrl || null,
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate card.");
      }
      const json = await res.json();
      const mimeType = json.result?.mimeType || "image/png";
      const frontBlob = base64ToBlob(json.result.front, mimeType);
      const backBlob = json.result.back
        ? base64ToBlob(json.result.back, mimeType)
        : undefined;

      if (cardResult?.frontUrl) URL.revokeObjectURL(cardResult.frontUrl);
      if (cardResult?.backUrl) URL.revokeObjectURL(cardResult.backUrl);

      const nextState: GeneratedCardState = {
        frontBlob,
        frontUrl: URL.createObjectURL(frontBlob),
        ...(backBlob
          ? { backBlob, backUrl: URL.createObjectURL(backBlob) }
          : {}),
      };
      setCardResult(nextState);
      message.success("Referral card generated.");
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      queryClient.invalidateQueries({ queryKey: ["applicant", applicant_id] });
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "Failed to generate card."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (type: "front" | "back") => {
    if (!cardResult) return;
    const blob = type === "front" ? cardResult.frontBlob : cardResult.backBlob;
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `member-card-${type}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Card
      style={{ borderRadius: 14, marginTop: 12 }}
      title={
        <Space>
          <IdcardOutlined />
          <span>Generate Card Member Referral</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {onClose ? (
          <Alert
            type="info"
            showIcon
            message="Regenerating referral card"
            description="Generating again will replace the previous referral card."
          />
        ) : null}
        <Select
          style={{ width: "100%" }}
          placeholder="Select card template"
          value={selectedTemplateId || undefined}
          onChange={setSelectedTemplateId}
          loading={templatesLoading}
          options={(cardTemplates || []).map((tpl) => ({
            label: tpl.name,
            value: tpl.id,
          }))}
        />

        <Button
          type="primary"
          onClick={handleGenerateCard}
          loading={generating}
          disabled={templatesLoading || !cardTemplates?.length}
        >
          Generate Member Card
        </Button>

        {cardResult ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text strong>Preview</Text>
            <Image
              src={cardResult.frontUrl}
              alt="Card front"
              style={{ borderRadius: 12 }}
            />
            {cardResult.backUrl ? (
              <Image
                src={cardResult.backUrl}
                alt="Card back"
                style={{ borderRadius: 12 }}
              />
            ) : null}
            <Space>
              <Button onClick={() => handleDownload("front")}>
                Download Front
              </Button>
              {cardResult.backBlob ? (
                <Button onClick={() => handleDownload("back")}>
                  Download Back
                </Button>
              ) : null}
            </Space>
          </Space>
        ) : (
          <Alert
            type="info"
            showIcon
            message="No card generated yet."
            description="Select a card template and click 'Generate Member Card'."
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
