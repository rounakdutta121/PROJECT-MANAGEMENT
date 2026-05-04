import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/signup"];

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Allow NextAuth API routes to work without auth check
  if (url.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Dynamically import auth to avoid build-time issues
  const { auth } = await import("@/auth");
  const session = await auth();

  // Allow auth pages (login/signup) to render without redirecting
  if (authRoutes.some((route) => url.pathname.startsWith(route))) {
    if (session) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!session) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Restrict admin routes to admins only
  const role = (session as any)?.user?.role;
  if (
    role !== "admin" &&
    adminRoutes.some((route) => url.pathname.startsWith(route))
  ) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
