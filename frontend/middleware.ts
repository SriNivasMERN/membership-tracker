import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml" ||
      /\.[a-zA-Z0-9]+$/.test(pathname)
    ) {
      return NextResponse.next();
    }

    const hasRefreshToken = Boolean(request.cookies.get("refreshToken")?.value);
    const isLoginPage = pathname === "/login";
    const isRootPage = pathname === "/";

    if (isRootPage) {
      return NextResponse.redirect(
        new URL(hasRefreshToken ? "/dashboard" : "/login", request.url),
      );
    }

    if (!hasRefreshToken && !isLoginPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (hasRefreshToken && isLoginPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/:path*"],
};
