"use client";

import { useState } from "react";
import { FileUploader } from "./file-uploader";

interface UploadedFile {
  url: string;
  public_id: string;
  resource_type: string;
  name: string;
  size: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
}

interface SubmissionFormProps {
  task: Task;
  onSubmitSuccess: () => void;
}

export function SubmissionForm({ task, onSubmitSuccess }: SubmissionFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          notes: notes || null,
          attachments: uploadedFiles.map((f) => ({
            url: f.url,
            public_id: f.public_id,
            resource_type: f.resource_type,
            name: f.name,
            size: f.size,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(true);
      setUploadedFiles([]);
      setNotes("");
      setTimeout(() => {
        onSubmitSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (resourceType: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (resourceType === "image") return "IMG";
    if (resourceType === "video") return "VID";
    if (["py"].includes(ext)) return "PY";
    if (["js", "jsx", "ts", "tsx"].includes(ext)) return "JS";
    if (["java", "cpp", "c", "h"].includes(ext)) return "C";
    if (["html", "css", "json", "xml", "csv", "md"].includes(ext)) return "DOC";
    if (["pdf"].includes(ext)) return "PDF";
    if (["zip", "rar"].includes(ext)) return "ZIP";
    return "FILE";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card/60 rounded-xl border border-border/50 p-5 backdrop-blur-sm">
        <h3 className="font-semibold">{task.title}</h3>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
        {task.deadline && (
          <p className="mt-2 text-xs text-muted-foreground">
            Deadline: {new Date(task.deadline).toLocaleDateString()}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Upload Files</label>
        <FileUploader onFilesUploaded={handleFilesUploaded} />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Uploaded Files ({uploadedFiles.length})
          </label>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary">
                  {getFileIcon(file.resource_type, file.name)}
                </span>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="hover:bg-destructive/10 hover:text-destructive rounded-lg p-1 text-muted-foreground transition-colors"
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
          ))}
        </div>
      )}

      <div>
        <label htmlFor="notes" className="mb-2 block text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about your submission..."
          rows={4}
          className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          Submission successful!
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || uploadedFiles.length === 0}
        className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Work"}
      </button>
    </form>
  );
}
