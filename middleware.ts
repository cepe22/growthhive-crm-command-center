import { NextResponse, type NextRequest } from "next/server";
import { authCookies, verifySessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const loggedIn = await verifySessionToken(request.cookies.get(authCookies.session)?.value);
  const isLogin = request.nextUrl.pathname === "/login";
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");
  if (isAuthCallback) return NextResponse.next();
  if (!loggedIn && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (loggedIn && isLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
