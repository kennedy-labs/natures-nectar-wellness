"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImagePlus, Link2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_IMAGE_TYPES,
  estimateDataUrlKb,
  optimizeAdminImageFile,
} from "@/features/admin/utils/image-optimize";

type AdminImageDropzoneProps = {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  error?: string;
  helperText?: string;
};

export function AdminImageDropzone({
  id,
  label,
  value,
  onChange,
  onProcessingChange,
  error,
  helperText = "Supports JPG, PNG, WebP, GIF, AVIF, and SVG photos up to 10 MB.",
}: AdminImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function setProcessingState(next: boolean) {
    setIsProcessing(next);
    onProcessingChange?.(next);
  }

  async function processFile(file: File) {
    setUploadError(null);
    setProcessingState(true);

    try {
      const encoded = await optimizeAdminImageFile(file);
      onChange(encoded);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Could not process this image file. Please try another file."
      );
    } finally {
      setProcessingState(false);
    }
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
  const displayedError = uploadError ?? error;

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
        accept={ACCEPTED_IMAGE_TYPES}
        onChange={handleFileChange}
        className="sr-only"
      />

      {trimmedValue ? (
        <div
          className={`flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between ${
            displayedError ? "border-destructive/60" : "border-border"
          }`}
        >
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
            displayedError
              ? "border-destructive/60 bg-destructive/5"
              : isDragging
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

      {displayedError ? (
        <p className="text-xs font-medium text-destructive">{displayedError}</p>
      ) : null}
    </div>
  );
}
