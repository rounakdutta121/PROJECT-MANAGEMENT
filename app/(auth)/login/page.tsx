import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="bg-card/60 w-full max-w-md space-y-8 rounded-2xl border border-border/50 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Welcome back
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">
            Loading...
          </p>
        }
      >
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
