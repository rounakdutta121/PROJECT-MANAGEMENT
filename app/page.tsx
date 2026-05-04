import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/db";
import { StatCard } from "@/components/stat-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isIntern = session.user.role === "intern";
  const taskWhere = isIntern ? { assignedToId: session.user.id } : {};

  let userCount = isIntern ? 0 : 0;
  let taskCount = 0;
  let doneTasks = 0;
  let pendingTasks = 0;
  let recentTasks: any[] = [];
  let dbError: string | null = null;

  try {
    [userCount, taskCount, doneTasks, pendingTasks] = await withRetry(() =>
      Promise.all([
        isIntern ? Promise.resolve(0) : prisma.user.count(),
        prisma.task.count({ where: taskWhere }),
        prisma.task.count({ where: { ...taskWhere, status: "done" } }),
        prisma.task.count({ where: { ...taskWhere, status: "pending" } }),
      ]),
    );

    recentTasks = await withRetry(() =>
      prisma.task.findMany({
        where: taskWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: {
            select: { name: true, role: true },
          },
        },
      }),
    );
  } catch (error: unknown) {
    dbError =
      error instanceof Error ? error.message : "Database connection failed";
    console.error("Dashboard DB error:", dbError);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome,{" "}
          <span className="font-medium text-foreground">
            {session.user.name}
          </span>
        </p>
      </div>

      {dbError && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-400">
            Database connection unavailable. Showing cached data.
          </p>
          <p className="mt-1 text-xs text-amber-500/70">
            Please check your database connection and try again.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {!isIntern && (
          <StatCard
            title="Team Members"
            value={String(userCount)}
            description="Active users"
          />
        )}
        <StatCard
          title="Total Tasks"
          value={String(taskCount)}
          description={isIntern ? "Your tasks" : "All tasks"}
        />
        <StatCard
          title="Completed"
          value={String(doneTasks)}
          description="Done tasks"
        />
        <StatCard
          title="Pending"
          value={String(pendingTasks)}
          description="Awaiting action"
        />
      </div>

      <div className="bg-card/60 rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold">
            {isIntern ? "My Recent Tasks" : "Recent Tasks"}
          </h2>
        </div>
        <div className="border-t border-border/50">
          {recentTasks.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Title
                  </th>
                  {!isIntern && (
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Assigned To
                    </th>
                  )}
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Deadline
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-t border-border/30 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-6 py-4 font-medium">{task.title}</td>
                    {!isIntern && (
                      <td className="px-6 py-4 text-muted-foreground">
                        {task.assignedTo?.name || "Unassigned"}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          task.status === "done"
                            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                            : task.status === "in_progress"
                              ? "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {dbError ? "Unable to load tasks" : "No tasks yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
