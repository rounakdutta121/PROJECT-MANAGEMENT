import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/db";
import { AdminDashboard } from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    redirect("/");
  }

  const [users, tasks, totalInterns] = await withRetry(() =>
    Promise.all([
      prisma.user.findMany({
        where: { role: "intern" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          _count: { select: { assignedTasks: true } },
        },
      }),
      prisma.task.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.user.count({ where: { role: "intern" } }),
    ])
  );

  const stats = {
    totalTasks: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    totalInterns,
  };

  return <AdminDashboard users={users} tasks={tasks} stats={stats} />;
}
