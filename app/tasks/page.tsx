import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/db";
import { TaskManager } from "@/components/task-manager";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isIntern = session.user.role === "intern";
  const taskWhere = isIntern ? { assignedToId: session.user.id } : {};

  const [tasks, users] = await withRetry(() =>
    Promise.all([
      prisma.task.findMany({
        where: taskWhere,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      isIntern
        ? Promise.resolve([])
        : prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: "asc" },
          }),
    ])
  );

  return <TaskManager initialTasks={tasks} users={users} />;
}
