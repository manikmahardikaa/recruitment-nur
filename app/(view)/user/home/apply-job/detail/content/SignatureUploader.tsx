"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Space, Typography, message } from "antd";
import {
  UndoOutlined,
  ClearOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

type Point = { x: number; y: number };
type Stroke = Point[];

type Props = {
  bucket: string;
  folder: string;
  value?: string;
  onUpload?: (path: string, publicUrl: string) => void;
  onSaved?: (path: string, publicUrl: string) => void;
  onDelete?: () => void;
  maxSizeMB?: number;
  width?: number;
  height?: number;
};

import { getSupabaseClient } from "@/app/vendor/supabase-client";

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (!stroke.length) return;
  ctx.beginPath();
  const [first, ...rest] = stroke;
  ctx.moveTo(first.x, first.y);
  rest.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
}

export default function SignaturePadUploader({
  bucket,
  folder,
  value,
  onUpload,
  onSaved,
  onDelete,
  maxSizeMB = 5,
  width = 560,
  height = 200,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const ratioRef = useRef(1);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  const redraw = useCallback(() => {
    clearCanvas();
    const ctx = contextRef.current;
    if (!ctx) return;
    strokesRef.current.forEach((stroke) => drawStroke(ctx, stroke));
  }, [clearCanvas]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    ratioRef.current = ratio;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (ctx.resetTransform) {
      ctx.resetTransform();
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.2;

    contextRef.current = ctx;
    redraw();
  }, [height, redraw, width]);

  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  const getRelativePoint = useCallback((event: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const point = getRelativePoint(event);
      if (!point) return;

      const ctx = contextRef.current;
      if (!ctx) return;

      isDrawingRef.current = true;
      currentStrokeRef.current = [point];
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
        activePointerRef.current = event.pointerId;
      } catch {
        // ignore pointer capture errors
      }
    },
    [getRelativePoint]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      event.preventDefault();
      const point = getRelativePoint(event);
      if (!point) return;

      const ctx = contextRef.current;
      const stroke = currentStrokeRef.current;
      if (!ctx || !stroke) return;

      stroke.push(point);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    },
    [getRelativePoint]
  );

  const finishStroke = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const stroke = currentStrokeRef.current;
    if (stroke && stroke.length) {
      strokesRef.current = [...strokesRef.current, stroke];
      setHasStroke(true);
    }
    currentStrokeRef.current = null;
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      if (
        activePointerRef.current !== null &&
        event.currentTarget.hasPointerCapture(activePointerRef.current)
      ) {
        try {
          event.currentTarget.releasePointerCapture(activePointerRef.current);
        } catch {
          // noop
        }
      }
      activePointerRef.current = null;
      finishStroke();
    },
    [finishStroke]
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      event.preventDefault();
      if (
        activePointerRef.current !== null &&
        event.currentTarget.hasPointerCapture(activePointerRef.current)
      ) {
        try {
          event.currentTarget.releasePointerCapture(activePointerRef.current);
        } catch {
          // noop
        }
        activePointerRef.current = null;
      }
      finishStroke();
    },
    [finishStroke]
  );

  const handleClear = useCallback(() => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    clearCanvas();
    setHasStroke(false);
  }, [clearCanvas]);

  const handleUndo = useCallback(() => {
    if (!strokesRef.current.length) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setHasStroke(strokesRef.current.length > 0);
    redraw();
  }, [redraw]);

  const getTrimmedCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return null;
    const strokes = strokesRef.current;
    if (!strokes.length) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach((stroke) =>
      stroke.forEach((point) => {
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
      })
    );

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY))
      return canvas;

    const padding = 12;
    minX = Math.max(minX - padding, 0);
    minY = Math.max(minY - padding, 0);
    maxX = Math.min(maxX + padding, width);
    maxY = Math.min(maxY + padding, height);

    const trimmedWidth = Math.max(maxX - minX, 1);
    const trimmedHeight = Math.max(maxY - minY, 1);

    const ratio = ratioRef.current;
    const offscreen = document.createElement("canvas");
    offscreen.width = trimmedWidth * ratio;
    offscreen.height = trimmedHeight * ratio;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return canvas;

    offCtx.scale(ratio, ratio);
    offCtx.lineCap = "round";
    offCtx.lineJoin = "round";
    offCtx.strokeStyle = ctx.strokeStyle;
    offCtx.lineWidth = ctx.lineWidth;

    strokes.forEach((stroke) => {
      const shifted = stroke.map((point) => ({
        x: point.x - minX,
        y: point.y - minY,
      }));
      drawStroke(offCtx, shifted);
    });

    return offscreen;
  };

  const dataURLtoBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const uploadToSupabase = async (blob: Blob) => {
    const supabase = getSupabaseClient();
    const safeFolder = folder.replace(/^\/*/, "").replace(/\.\./g, "");
    const fileName = `signature-${Date.now()}.png`;
    const path = `${safeFolder}/${fileName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/png",
    });
    if (error) throw error;

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!pub?.publicUrl) throw new Error("Gagal mendapatkan public URL.");

    return { path, publicUrl: pub.publicUrl };
  };

  const handleSave = useCallback(async () => {
    if (!strokesRef.current.length) {
      message.warning("Tanda tangan masih kosong.");
      return;
    }

    const canvas = getTrimmedCanvas() ?? canvasRef.current;
    if (!canvas) {
      message.error("Canvas tidak tersedia.");
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await dataURLtoBlob(dataUrl);

      const sizeMB = blob.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        message.warning(
          `Ukuran ${sizeMB.toFixed(2)}MB > ${maxSizeMB}MB, tetap diupload.`
        );
      }

      const { path, publicUrl } = await uploadToSupabase(blob);
      onUpload?.(path, publicUrl);
      onSaved?.(path, publicUrl);
      message.success("Tanda tangan tersimpan ke Supabase.");
    } catch (error: any) {
      message.error(error?.message || "Gagal menyimpan tanda tangan.");
    } finally {
      setIsUploading(false);
    }
  }, [maxSizeMB, onSaved, onUpload]);

  return (
    <div>
      <div
        style={{
          border: "1px dashed #d9d9d9",
          borderRadius: 12,
          padding: 8,
          background: "#fff",
          display: "inline-block",
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ background: "#fff", borderRadius: 8, touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />
      </div>

      <Space style={{ marginTop: 8 }}>
        <Button icon={<UndoOutlined />} onClick={handleUndo} disabled={!hasStroke}>
          Undo
        </Button>
        <Button icon={<ClearOutlined />} onClick={handleClear} disabled={!hasStroke}>
          Clear
        </Button>
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleSave}
          loading={isUploading}
          disabled={!hasStroke}
        >
          Save
        </Button>
      </Space>

      {value ? (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">Current file:</Text>{" "}
          <a href={value} target="_blank" rel="noreferrer">
            Preview
          </a>
          {onDelete ? (
            <Button type="link" danger onClick={onDelete}>
              Remove
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
