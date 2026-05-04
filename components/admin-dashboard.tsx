"use client";

import { useState } from "react";
import { FileUploader } from "./file-uploader";

interface User {
  id: string;
  name: string;
  email: string;
  _count: { assignedTasks: number };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: Date | string | null;
  createdAt: Date | string;
  attachments?: unknown;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AdminDashboardProps {
  users: User[];
  tasks: Task[];
  stats: {
    totalTasks: number;
    pending: number;
    inProgress: number;
    done: number;
    totalInterns: number;
  };
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  done: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};

export function AdminDashboard({ users, tasks, stats }: AdminDashboardProps) {
  const [allTasks, setAllTasks] = useState(tasks);
  const [allUsers] = useState(users);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    status: "pending",
    deadline: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      url: string;
      public_id: string;
      resource_type: string;
      name: string;
      size: number;
    }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredTasks = allTasks.filter((task) => {
    const matchesStatus = filter === "all" || task.status === filter;
    const matchesSearch =
      !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.assignedTo?.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
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

      setAllTasks((prev) => [data, ...prev]);
      setForm({
        title: "",
        description: "",
        assignedToId: "",
        status: "pending",
        deadline: "",
      });
      setUploadedFiles([]);
      setShowForm(false);
      setSuccess("Task created successfully");
    } catch {
      setError("Network error");
    }

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
      alert(data.error || "Failed to update");
      return;
    }

    setAllTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;

    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete");
      return;
    }

    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const filters = [
    { key: "all", label: "All", count: stats.totalTasks },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "in_progress", label: "In Progress", count: stats.inProgress },
    { key: "done", label: "Done", count: stats.done },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage tasks and team members
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          New Task
        </button>
      </div>

      {showForm && (
        <div className="bg-card/60 rounded-xl border border-border/50 shadow-xl shadow-black/10 backdrop-blur-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <h2 className="text-lg font-semibold">Create New Task</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Assign a task to a team member
            </p>
          </div>
          <form onSubmit={createTask} className="p-6">
            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-1.5 block text-sm font-medium">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Assign To <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={form.assignedToId}
                  onChange={(e) =>
                    setForm({ ...form, assignedToId: e.target.value })
                  }
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Select intern</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user._count.assignedTasks} tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Deadline
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Describe the task..."
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">
                  Attachments (optional)
                </label>
                <FileUploader
                  onFilesUploaded={(files) =>
                    setUploadedFiles((prev) => [...prev, ...files])
                  }
                />
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
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
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
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
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Task"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                  setSuccess(null);
                  setUploadedFiles([]);
                }}
                className="inline-flex h-9 items-center rounded-lg border border-border/50 px-4 text-sm font-medium transition-all hover:bg-muted/30"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Tasks", value: stats.totalTasks, color: "" },
          { label: "Pending", value: stats.pending, color: "text-amber-400" },
          {
            label: "In Progress",
            value: stats.inProgress,
            color: "text-blue-400",
          },
          { label: "Completed", value: stats.done, color: "text-emerald-400" },
          { label: "Interns", value: stats.totalInterns, color: "" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card/60 group relative overflow-hidden rounded-xl border border-border/50 p-5 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-lg transition-all group-hover:from-primary/20" />
            <p className="relative text-sm text-muted-foreground">
              {stat.label}
            </p>
            <p
              className={`relative mt-1 text-2xl font-bold ${stat.color || "bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card/60 rounded-xl border border-border/50 shadow-xl shadow-black/10 backdrop-blur-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">All Tasks</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background/50 py-2 pl-10 pr-3 text-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 sm:w-64"
                />
              </div>

              <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      filter === f.key
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredTasks.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Task
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
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border/20 transition-colors last:border-0 hover:bg-muted/20"
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
                                  <span className="max-w-[60px] truncate">
                                    {att.name}
                                  </span>
                                </a>
                              ),
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">
                          {task.assignedTo?.name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {task.assignedTo?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[task.status] || statusStyles.pending}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground/70">
                      {task.deadline ? (
                        <span>
                          {new Date(task.deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground/70">
                      {new Date(task.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="mt-4 text-sm text-muted-foreground">
                {search || filter !== "all"
                  ? "No tasks match your filters"
                  : "No tasks yet. Create your first task above."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
