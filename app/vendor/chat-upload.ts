"use client";

import { getSupabaseClient } from "./supabase-client";

export type UploadedChatAttachment = {
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
};

const CHAT_BUCKET = "web-oss-recruitment";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function uploadChatFiles(
  files: File[]
): Promise<UploadedChatAttachment[]> {
  const supabase = getSupabaseClient();
  if (!files.length) return [];

  if (!CHAT_BUCKET) {
    throw new Error("Chat bucket belum dikonfigurasi");
  }

  const folder = "chat";
  const results: UploadedChatAttachment[] = [];

  for (const file of files) {
    const safeName = sanitizeFileName(file.name || "attachment");
    const uniqueSuffix = `${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const path = `${folder}/${uniqueSuffix}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Gagal mengunggah ${file.name}: ${uploadError.message}`
      );
    }

    const { data } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(path);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) {
      throw new Error(`Tidak bisa mendapatkan URL publik untuk ${file.name}`);
    }

    results.push({
      url: publicUrl,
      name: file.name,
      mimeType: file.type || undefined,
      size: typeof file.size === "number" ? file.size : undefined,
    });
  }

  return results;
}
