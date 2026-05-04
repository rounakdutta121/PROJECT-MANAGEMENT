import { auth } from "@/auth";
import { NextResponse } from "next/server";

const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/signup"];

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default auth(async (req) => {
  const url = req.nextUrl.clone();

  // Allow NextAuth API routes to work without auth check
  if (url.pathname.startsWith("/api/auth")) {
    return;
  }

  // Allow auth pages (login/signup) to render without redirecting
  if (authRoutes.some((route) => url.pathname.startsWith(route))) {
    if (req.auth) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return;
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Restrict admin routes to admins only
  const role = req.auth.user?.role;
  if (
    role !== "admin" &&
    adminRoutes.some((route) => url.pathname.startsWith(route))
  ) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
});
