"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FileUploader } from "./file-uploader";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: Date | string | null;
  assignedToId: string;
  createdAt: Date | string;
  attachments?: unknown;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskManagerProps {
  initialTasks: Task[];
  users: User[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  done: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};

export function TaskManager({ initialTasks, users }: TaskManagerProps) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending",
    deadline: "",
    assignedToId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      url: string;
      public_id: string;
      resource_type: string;
      name: string;
      size: number;
    }[]
  >([]);

  const isAdmin = session?.user?.role === "admin";

  async function refreshTasks() {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deadline: form.deadline || undefined,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create task");
      setLoading(false);
      return;
    }

    setTasks((prev) => [data, ...prev]);
    setForm({
      title: "",
      description: "",
      status: "pending",
      deadline: "",
      assignedToId: "",
    });
    setUploadedFiles([]);
    setShowForm(false);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update task");
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;

    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete task");
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function canUpdate(task: Task): boolean {
    return isAdmin || task.assignedToId === session?.user?.id;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "Manage all tasks" : "Your assigned tasks"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30"
          >
            {showForm ? "Cancel" : "New Task"}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-card/60 rounded-xl border border-border/50 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold">Create Task</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Task title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to</label>
                <select
                  required
                  value={form.assignedToId}
                  onChange={(e) =>
                    setForm({ ...form, assignedToId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  className="flex h-10 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="flex w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="Task description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Attachments (optional)
              </label>
              <FileUploader
                onFilesUploaded={(files) =>
                  setUploadedFiles((prev) => [...prev, ...files])
                }
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary">
                          {file.resource_type === "image"
                            ? "IMG"
                            : file.resource_type === "video"
                              ? "VID"
                              : file.name.split(".").pop()?.toUpperCase() ||
                                "FILE"}
                        </span>
                        <span>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-card/60 overflow-hidden rounded-xl border border-border/50 backdrop-blur-sm">
        {tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Deadline
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-t border-border/30 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">
                            {task.description}
                          </p>
                        )}
                        {task.attachments &&
                        Array.isArray(task.attachments) &&
                        task.attachments.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {task.attachments.map(
                              (
                                att: {
                                  url: string;
                                  name: string;
                                  resource_type: string;
                                },
                                i: number,
                              ) => (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded border border-border/30 px-1.5 py-0.5 text-[10px] transition-colors hover:bg-muted/30"
                                >
                                  <span className="font-mono font-medium uppercase text-primary/70">
                                    {att.resource_type === "image"
                                      ? "IMG"
                                      : att.resource_type === "video"
                                        ? "VID"
                                        : att.name
                                            .split(".")
                                            .pop()
                                            ?.toUpperCase() || "FILE"}
                                  </span>
                                  <span className="max-w-[80px] truncate">
                                    {att.name}
                                  </span>
                                </a>
                              ),
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground/70">
                      {task.assignedTo?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      {canUpdate(task) ? (
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateStatus(task.id, e.target.value)
                          }
                          className={`cursor-pointer rounded-full border-0 px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[task.status] || statusStyles.pending}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[task.status] || statusStyles.pending}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground/70">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : "-"}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            {isAdmin
              ? "No tasks found. Create one to get started."
              : "No tasks assigned to you."}
          </div>
        )}
      </div>
    </div>
  );
}
