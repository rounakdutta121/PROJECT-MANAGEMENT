import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { assignedTasks: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="mt-1 text-muted-foreground">Manage team members</p>
      </div>

      <div className="bg-card/60 overflow-hidden rounded-xl border border-border/50 backdrop-blur-sm">
        {users.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border/30 transition-colors hover:bg-muted/20"
                >
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        user.role === "admin"
                          ? "bg-purple-500/10 text-purple-400 ring-purple-500/20"
                          : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">{user._count.assignedTasks}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            No team members found.
          </div>
        )}
      </div>
    </div>
  );
}
