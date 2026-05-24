import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken");
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isRootPage = request.nextUrl.pathname === "/";

  // Redirect root to dashboard or login
  if (isRootPage) {
    if (refreshToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // No token - redirect to login
  if (!refreshToken && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Has token - redirect away from login
  if (refreshToken && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};