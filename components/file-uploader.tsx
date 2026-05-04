"use client";

import { useState, useCallback, useRef } from "react";

interface UploadedFile {
  url: string;
  public_id: string;
  resource_type: string;
  name: string;
  size: number;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  acceptedTypes?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export function FileUploader({
  onFilesUploaded,
  maxFiles = 10,
  maxFileSizeMB = 100,
  acceptedTypes = "image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar,.py,.js,.ts,.jsx,.tsx,.java,.cpp,.c,.html,.css,.json,.xml,.csv,.md",
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      if (uploadingFiles.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newUploading: UploadingFile[] = fileArray.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        progress: 0,
        status: "uploading",
      }));

      setUploadingFiles((prev) => [...prev, ...newUploading]);

      const uploaded: UploadedFile[] = [];

      for (const item of newUploading) {
        if (item.file.size > maxFileSizeMB * 1024 * 1024) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    status: "error",
                    error: `File exceeds ${maxFileSizeMB}MB limit`,
                    progress: 0,
                  }
                : f,
            ),
          );
          continue;
        }

        const formData = new FormData();
        formData.append("file", item.file);

        try {
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: 30 } : f)),
          );

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: 70 } : f)),
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Upload failed");
          }

          const result: UploadedFile = await response.json();
          uploaded.push(result);

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: "success", progress: 100 } : f,
            ),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "error", error: message, progress: 0 }
                : f,
            ),
          );
        }
      }

      if (uploaded.length > 0) {
        onFilesUploaded(uploaded);
      }
    },
    [maxFiles, maxFileSizeMB, onFilesUploaded, uploadingFiles.length],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all ${
          isDragging
            ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border/50 hover:border-primary/30 hover:bg-muted/20"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div
            className={`mb-3 rounded-full p-3 transition-colors ${isDragging ? "bg-primary/10" : "bg-muted/30"}`}
          >
            <svg
              className={`h-7 w-7 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="mb-1 text-sm font-medium">
            Drop files here or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Images, videos, PDFs, code files, and more (max {maxFileSizeMB}MB
            per file)
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleInputChange}
        className="hidden"
      />

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex-1 truncate text-sm font-medium">
                {item.file.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(item.file.size)}
              </div>
              {item.status === "uploading" && (
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === "success" && (
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {item.status === "error" && (
                <div className="flex items-center gap-2">
                  <span className="text-destructive text-xs">{item.error}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUploadingFile(item.id);
                    }}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
