"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Team", href: "/projects" },
  { name: "Tasks", href: "/tasks" },
  { name: "Submissions", href: "/submissions" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return null;
  }

  const visibleNav =
    session.user.role === "admin"
      ? [
          ...navigation,
          { name: "Review Submissions", href: "/admin/submissions" },
        ]
      : navigation;

  return (
    <aside className="bg-card/80 flex h-screen w-64 flex-col border-r backdrop-blur-xl">
      <div className="flex h-14 items-center border-b px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-wide"
        >
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PM
          </span>
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/15 text-cyan-400 shadow-sm shadow-cyan-400/10"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
              )}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t p-4">
        <div className="text-xs">
          <p className="truncate font-medium">{session.user.name}</p>
          <p className="truncate text-muted-foreground">{session.user.email}</p>
          <p className="mt-0.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
            {session.user.role}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 w-full rounded-lg border border-border/50 px-3 py-2 text-sm font-medium transition-all"
        >
          Sign out
        </button>
        <p className="text-center text-[10px] text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Project Management
        </p>
      </div>
    </aside>
  );
}
