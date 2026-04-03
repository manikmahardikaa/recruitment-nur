"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  UploadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import {
  Button,
  message,
  Upload,
  Popconfirm,
  Typography,
  UploadProps,
} from "antd";
import type { UploadRequestOption as RcCustomRequestOptions } from "rc-upload/lib/interface";
import { getSupabaseClient } from "@/app/vendor/supabase-client";

const { Text } = Typography;
const { Dragger } = Upload;

type AllowedType = "pdf" | "doc" | "docx";

interface FileItem {
  url: string;
  path: string;
  name: string;
  ext: AllowedType;
}

interface SupaFileUploaderProps {
  bucket?: string;
  folder?: string;
  onUpload?: (path: string, url: string) => void;
  onDelete?: (path: string) => void;
  label?: string;
  /** Public URL (controlled) */
  value?: string | null;
  onChange?: (value: string | null) => void;
  initialPath?: string | null;
  maxSizeMB?: number;
  /** Which file types to allow (default: ['pdf','doc','docx']) */
  allowedTypes?: AllowedType[];
}

const MIME_BY_EXT: Record<AllowedType, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

const EXT_FROM_MIME: Record<string, AllowedType | undefined> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const EXTENSION_FILTER = ".pdf,.doc,.docx";

/** Derive extension from filename if possible */
function extFromName(name: string): AllowedType | undefined {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".doc")) return "doc";
  if (lower.endsWith(".docx")) return "docx";
  return undefined;
}

/** Choose an icon by extension */
function FileIcon({ ext }: { ext: AllowedType }) {
  if (ext === "pdf")
    return <FilePdfOutlined style={{ fontSize: 32, color: "#c30010" }} />;
  return <FileWordOutlined style={{ fontSize: 32, color: "#2b579a" }} />;
}

export default function SupaFileUploader({
  bucket = "",
  folder = "",
  onUpload,
  onDelete,
  label = "Upload File",
  value,
  onChange,
  initialPath = null,
  maxSizeMB = 10,
  allowedTypes = ["pdf", "doc", "docx"],
}: SupaFileUploaderProps) {
  const [preview, setPreview] = useState<FileItem | null>(
    value
      ? {
          url: value,
          path: initialPath ?? "",
          name: value.split("/").pop() || "file",
          ext: extFromName(value) ?? "pdf",
        }
      : null
  );

  // Build accept attribute from allowed types
  const acceptAttr = useMemo(() => {
    const exts: string[] = [];
    if (allowedTypes.includes("pdf")) exts.push(".pdf");
    if (allowedTypes.includes("doc")) exts.push(".doc");
    if (allowedTypes.includes("docx")) exts.push(".docx");
    return exts.join(",");
  }, [allowedTypes]);

  // Sync with controlled value
  useEffect(() => {
    if (value && (!preview || preview.url !== value)) {
      setPreview({
        url: value,
        path: initialPath ?? "",
        name: value.split("/").pop() || "file",
        ext: extFromName(value) ?? "pdf",
      });
    }
    if (!value) setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, initialPath]);

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const validMimes = allowedTypes.flatMap((t) => MIME_BY_EXT[t]);
    const typeOk =
      (file.type && validMimes.includes(file.type)) ||
      (extFromName(file.name) &&
        allowedTypes.includes(extFromName(file.name)!));

    if (!typeOk) {
      message.error(
        `Invalid file type. Allowed: ${allowedTypes.join(", ").toUpperCase()}`
      );
      return Upload.LIST_IGNORE;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      message.error(`Max file size is ${maxSizeMB}MB.`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUpload = async ({
    file,
    onSuccess,
    onError,
  }: RcCustomRequestOptions) => {
    try {
      const supabase = getSupabaseClient();
      if (typeof file === "string" || !(file instanceof File)) {
        throw new Error("Invalid upload file.");
      }

      // Decide extension
      const mimeExt = EXT_FROM_MIME[file.type] ?? extFromName(file.name);
      if (!mimeExt || !allowedTypes.includes(mimeExt)) {
        throw new Error(
          `Invalid file type. Allowed: ${allowedTypes.join(", ").toUpperCase()}`
        );
      }

      const fileName = file.name || `uploaded.${mimeExt}`;
      const filePath = folder
        ? `${folder}/${Date.now()}-${fileName}`
        : `${Date.now()}-${fileName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = data?.publicUrl;
      if (!publicUrl)
        throw new Error("Failed to get public URL from Supabase.");

      setPreview({
        url: publicUrl,
        path: filePath,
        name: fileName,
        ext: mimeExt,
      });
      onUpload?.(filePath, publicUrl);
      onChange?.(publicUrl);
      message.success("File uploaded successfully!");
      onSuccess?.(filePath as string);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error");
      message.error("Upload failed: " + err.message);
      onError?.(err);
    }
  };

  const handleDelete = async () => {
    const supabase = getSupabaseClient();
    if (!preview?.path && !preview?.url) {
      onChange?.(null);
      setPreview(null);
      return;
    }
    if (preview?.path) {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([preview.path]);
      if (error) {
        message.error("Failed to delete file: " + error.message);
        return;
      }
    }
    onDelete?.(preview?.path || "");
    setPreview(null);
    onChange?.(null);
    message.success("File deleted!");
  };

  const helperText = useMemo(() => {
    const pretty = allowedTypes.map((t) => t.toUpperCase()).join(", ");
    return `${pretty} up to ${maxSizeMB}MB`;
  }, [allowedTypes, maxSizeMB]);

  return (
    <div>
      {!preview ? (
        <Dragger
          customRequest={handleUpload as UploadProps["customRequest"]}
          showUploadList={false}
          accept={acceptAttr || EXTENSION_FILTER}
          multiple={false}
          beforeUpload={beforeUpload}
          style={{
            border: "2px dashed #d9d9d9",
            borderRadius: 12,
            background: "#fcfcfc",
            minHeight: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <div style={{ padding: 20, textAlign: "center" }}>
            {/* Show generic icon (PDF/Word icons appear after upload) */}
            <UploadOutlined style={{ fontSize: 44, color: "#3a7bd5" }} />
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 10 }}>
              Drag & drop file here, or{" "}
              <span
                style={{
                  color: "#3a7bd5",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                browse
              </span>
            </div>
            <div style={{ color: "#666", marginTop: 6, fontSize: 13 }}>
              {helperText}
            </div>
            <Button icon={<UploadOutlined />} style={{ marginTop: 12 }}>
              {label}
            </Button>
          </div>
        </Dragger>
      ) : (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "#f5f5f5",
            border: "1px dashed #d9d9d9",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <FileIcon ext={preview.ext} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong ellipsis style={{ display: "block" }}>
              {preview.name}
            </Text>
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ wordBreak: "break-all" }}
            >
              View File
            </a>
          </div>

          <Popconfirm
            title="Delete this file?"
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="Cancel"
          >
            <Button icon={<DeleteOutlined />} danger type="primary">
              Delete
            </Button>
          </Popconfirm>
        </div>
      )}
    </div>
  );
}
