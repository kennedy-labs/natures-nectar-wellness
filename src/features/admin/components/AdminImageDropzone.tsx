"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImagePlus, Link2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminImageDropzoneProps = {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  helperText?: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB raw upload guard
const ACCEPTED_TYPES =
  ".jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.bmp,image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,image/bmp";

function estimateDataUrlKb(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(",");
  if (base64Index === -1) return 0;
  const base64Length = dataUrl.length - base64Index - 1;
  return Math.max(1, Math.round((base64Length * 3) / 4 / 1024));
}

export function AdminImageDropzone({
  id,
  label,
  value,
  onChange,
  helperText = "Supports JPG, PNG, WebP, GIF, AVIF, and SVG photos up to 10 MB.",
}: AdminImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function processFile(file: File) {
    setUploadError(null);

    if (file.size > MAX_FILE_BYTES) {
      setUploadError("File is larger than 10 MB. Please choose a smaller image.");
      return;
    }

    const mime = file.type.toLowerCase();
    const looksLikeImage =
      mime.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|avif|svg|bmp)$/i.test(file.name);

    if (!looksLikeImage) {
      setUploadError(
        "Unsupported file type. Choose a JPG, PNG, WebP, GIF, AVIF, or SVG image."
      );
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onerror = () => {
      setIsProcessing(false);
      setUploadError("Could not read that image file. Please try another file.");
    };

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setIsProcessing(false);
        setUploadError("Image file was empty.");
        return;
      }

      // Preserve vector SVGs and animated GIFs under 1.2 MB directly without rasterizing
      if (
        (mime === "image/svg+xml" || mime === "image/gif") &&
        result.length <= 1_600_000
      ) {
        onChange(result);
        setIsProcessing(false);
        return;
      }

      const img = new window.Image();
      img.onerror = () => {
        setIsProcessing(false);
        setUploadError(
          "Your browser could not decode this image format. Try saving it as JPG, PNG, or WebP."
        );
      };

      img.onload = () => {
        const maxWidth = 960;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          setIsProcessing(false);
          setUploadError("Image processing is unavailable in this browser.");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const preserveTransparency =
          mime === "image/png" ||
          mime === "image/webp" ||
          mime === "image/avif" ||
          mime === "image/svg+xml";

        let encoded = canvas.toDataURL(
          preserveTransparency ? "image/webp" : "image/jpeg",
          0.84
        );

        // Fallback if a browser encodes image/webp as PNG larger than ideal
        if (encoded.length > 750_000) {
          encoded = canvas.toDataURL("image/jpeg", 0.78);
        }

        onChange(encoded);
        setIsProcessing(false);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  const trimmedValue = value.trim();
  const isDataUri = trimmedValue.startsWith("data:image/");

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Link2 className="h-3.5 w-3.5" />
          {showUrlInput ? "Hide URL box" : "Or paste image URL"}
        </button>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="sr-only"
      />

      {trimmedValue ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={trimmedValue}
                alt={`${label} preview`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {isDataUri ? "Uploaded photo ready" : "Image linked"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isDataUri
                  ? `Optimized (~${estimateDataUrlKb(trimmedValue)} KB) · Click save to store`
                  : trimmedValue}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10"
              disabled={isProcessing}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setUploadError(null);
                onChange("");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/15 hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {isProcessing
                ? "Optimizing image..."
                : "Tap to choose photo or drag & drop"}
            </p>
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>
        </div>
      )}

      {showUrlInput ? (
        <Input
          type="text"
          value={isDataUri ? "" : value}
          onChange={(e) => {
            setUploadError(null);
            onChange(e.target.value);
          }}
          placeholder="https://... or /images/product.jpg"
          className="h-11"
        />
      ) : null}

      {uploadError ? (
        <p className="text-xs font-medium text-destructive">{uploadError}</p>
      ) : null}
    </div>
  );
}
