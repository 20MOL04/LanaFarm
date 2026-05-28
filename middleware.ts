import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  AUTH_API_PREFIX,
  AUTH_PUBLIC_PATHS,
  AUTH_SESSION_COOKIE,
} from "@/lib/auth/constants";
import { isValidSessionToken } from "@/lib/auth/verify-session";

function isPublicPath(pathname: string): boolean {
  if (AUTH_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname.startsWith(AUTH_API_PREFIX)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const authenticated = isValidSessionToken(token);

  if (isPublicPath(pathname)) {
    if (authenticated && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") {
      login.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
