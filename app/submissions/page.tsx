"use client";

import { useEffect, useState, useCallback } from "react";
import { SubmissionForm } from "../../components/submission-form";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  createdAt: string;
}

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
  notes: string | null;
  attachments: Attachment[];
  status: string;
  feedback: string | null;
  submittedAt: string;
  updatedAt: string;
  task: {
    id: string;
    title: string;
  };
}

export default function SubmissionsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, submissionsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/submissions"),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitSuccess = () => {
    setSelectedTask(null);
    fetchData();
    setActiveTab("history");
  };

  const submittedTaskIds = new Set(
    submissions
      .filter((s) => s.status !== "needs-revision")
      .map((s) => s.taskId),
  );

  const availableTasks = tasks.filter(
    (t) => !submittedTaskIds.has(t.id) && t.status !== "done",
  );

  const revisionTasks = submissions
    .filter((s) => s.status === "needs-revision")
    .map((s) => ({ ...s, task: tasks.find((t) => t.id === s.taskId) }))
    .filter((s) => s.task);

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
        {status === "needs-revision" ? "reopened" : status.replace("-", " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (selectedTask) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          onClick={() => setSelectedTask(null)}
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
        <h1 className="text-2xl font-bold">Submit Your Work</h1>
        <SubmissionForm
          task={selectedTask}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Submissions</h1>
        <p className="text-muted-foreground">
          Submit your work and track submission status
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-muted/30 p-1">
        {(["submit", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "submit"
              ? "Submit Work"
              : `History (${submissions.length})`}
          </button>
        ))}
      </div>

      {activeTab === "submit" && (
        <div className="space-y-6">
          {revisionTasks.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                Needs Revision ({revisionTasks.length})
              </h2>
              <div className="space-y-3">
                {revisionTasks.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedTask(submission.task!)}
                    className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {submission.task!.title}
                        </h3>
                        {submission.task!.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/70">
                            {submission.task!.description}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        Revision
                      </span>
                    </div>
                    {submission.feedback && (
                      <div className="mt-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-2 text-xs text-amber-300/80">
                        Admin remarks: {submission.feedback}
                      </div>
                    )}
                    {submission.task!.deadline && (
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        Deadline:{" "}
                        {new Date(
                          submission.task!.deadline,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold">
              {revisionTasks.length > 0 ? "Other Tasks" : "Available Tasks"}
            </h2>
            {availableTasks.length === 0 ? (
              <div className="bg-card/60 rounded-xl border border-border/50 p-8 text-center backdrop-blur-sm">
                <p className="text-muted-foreground">
                  No tasks available for submission. All your tasks have been
                  submitted or completed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="bg-card/40 hover:bg-card/60 group w-full rounded-xl border border-border/50 p-4 text-left transition-all hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/70">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <svg
                        className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    {task.deadline && (
                      <p className="mt-2 text-xs text-muted-foreground/60">
                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div>
          {submissions.length === 0 ? (
            <div className="bg-card/60 rounded-xl border border-border/50 p-8 text-center backdrop-blur-sm">
              <p className="text-muted-foreground">
                No submissions yet. Submit your work for a task to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-card/60 space-y-3 rounded-xl border border-border/50 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{submission.task.title}</h3>
                    {getStatusBadge(submission.status)}
                  </div>

                  <p className="text-xs text-muted-foreground/60">
                    Submitted:{" "}
                    {new Date(submission.submittedAt).toLocaleString()}
                  </p>

                  {submission.notes && (
                    <div className="rounded-lg bg-muted/30 p-3 text-sm">
                      {submission.notes}
                    </div>
                  )}

                  {submission.attachments &&
                    submission.attachments.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">
                          Attachments ({submission.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {submission.attachments.map((attachment, index) => (
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
                                    : attachment.name
                                        .split(".")
                                        .pop()
                                        ?.toUpperCase() || "FILE"}
                              </span>
                              <span className="max-w-[120px] truncate">
                                {attachment.name}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {submission.feedback && (
                    <div className="rounded-lg border border-blue-500/15 bg-blue-500/5 p-3">
                      <p className="text-sm font-medium text-blue-400">
                        Feedback
                      </p>
                      <p className="mt-1 text-sm text-blue-300/80">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
