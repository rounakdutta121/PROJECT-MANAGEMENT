"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Attachment {
  url: string;
  public_id: string;
  resource_type: string;
  name: string;
  size: number;
}

interface Submission {
  id: string;
  taskId: string;
  internId: string;
  notes: string | null;
  attachments: Attachment[];
  status: string;
  feedback: string | null;
  submittedAt: string;
  updatedAt: string;
  intern: { id: string; name: string; email: string };
  task: { id: string; title: string };
}

export default function AdminSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) setSubmissions(await res.json());
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleReview = async (
    action: "approved" | "needs-revision" | "reopen",
  ) => {
    if (!selectedSubmission) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "reopen" ? undefined : action,
          feedback: remarks || null,
          reopen: action === "reopen",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update submission");
      }

      setMessage({
        type: "success",
        text:
          action === "reopen"
            ? "Task reopened and sent back to intern"
            : `Submission ${action} successfully`,
      });

      setSelectedSubmission(null);
      setRemarks("");
      fetchSubmissions();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      submitted:
        "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20",
      approved:
        "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
      "needs-revision":
        "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
    };
    return (
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}
      >
        {status.replace("-", " ")}
      </span>
    );
  };

  const filteredSubmissions = submissions.filter(
    (s) => filter === "all" || s.status === filter,
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (selectedSubmission) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => {
            setSelectedSubmission(null);
            setRemarks("");
            setMessage(null);
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to submissions
        </button>

        <div className="bg-card/60 space-y-4 rounded-xl border border-border/50 p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {selectedSubmission.task.title}
              </h1>
              <p className="text-sm text-muted-foreground/70">
                Submitted by{" "}
                <span className="text-foreground">
                  {selectedSubmission.intern.name}
                </span>{" "}
                ({selectedSubmission.intern.email})
              </p>
            </div>
            {getStatusBadge(selectedSubmission.status)}
          </div>

          <p className="text-xs text-muted-foreground/60">
            Submitted:{" "}
            {new Date(selectedSubmission.submittedAt).toLocaleString()}
          </p>

          {selectedSubmission.notes && (
            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Intern Notes
              </p>
              {selectedSubmission.notes}
            </div>
          )}

          {selectedSubmission.attachments &&
            selectedSubmission.attachments.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Attachments ({selectedSubmission.attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 px-3 py-1.5 text-xs transition-colors hover:bg-muted/30"
                    >
                      <span className="font-mono font-medium uppercase text-primary/70">
                        {attachment.resource_type === "image"
                          ? "IMG"
                          : attachment.resource_type === "video"
                            ? "VID"
                            : attachment.name.split(".").pop()?.toUpperCase() ||
                              "FILE"}
                      </span>
                      <span className="max-w-[120px] truncate">
                        {attachment.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          {selectedSubmission.feedback && (
            <div className="rounded-lg border border-blue-500/15 bg-blue-500/5 p-3">
              <p className="text-sm font-medium text-blue-400">
                Previous Feedback
              </p>
              <p className="mt-1 text-sm text-blue-300/80">
                {selectedSubmission.feedback}
              </p>
            </div>
          )}
        </div>

        <div className="bg-card/60 space-y-4 rounded-xl border border-border/50 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">Review & Remarks</h2>

          {message && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                message.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor="remarks" className="mb-2 block text-sm font-medium">
              Add Remarks
            </label>
            <textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your review remarks..."
              rows={4}
              className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleReview("approved")}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleReview("needs-revision")}
              disabled={submitting}
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-all hover:bg-amber-500 disabled:opacity-50"
            >
              Request Revision
            </button>
            {selectedSubmission.status !== "needs-revision" && (
              <button
                onClick={() => handleReview("reopen")}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-500 disabled:opacity-50"
              >
                Reopen Task
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Review Submissions
          </span>
        </h1>
        <p className="text-muted-foreground">
          Review intern submissions, add remarks, and manage task status
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-muted/30 p-1">
        {["all", "submitted", "approved", "needs-revision"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.replace("-", " ")} (
            {f === "all"
              ? submissions.length
              : submissions.filter((s) => s.status === f).length}
            )
          </button>
        ))}
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="bg-card/60 rounded-xl border border-border/50 p-8 text-center backdrop-blur-sm">
          <p className="text-muted-foreground">No submissions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <button
              key={submission.id}
              onClick={() => setSelectedSubmission(submission)}
              className="bg-card/40 hover:bg-card/60 group w-full rounded-xl border border-border/50 p-5 text-left transition-all hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{submission.task.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    {submission.intern.name} &middot; Submitted{" "}
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                  {submission.feedback && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/50">
                      Remarks: {submission.feedback}
                    </p>
                  )}
                </div>
                {getStatusBadge(submission.status)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
