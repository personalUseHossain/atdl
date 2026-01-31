// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export function middleware(request) {
  // Use next-auth's withAuth
  return withAuth(request, {
    // Specify protected routes
    pages: {
      signIn: "/login", // Custom sign-in page path
    },
  });
}

// Configure matching routes
export const config = {
  matcher: ["/dashboard/:path*", "/api/worker/:path*", "/api/user/:path*"],
};