import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const loggedIn = request.cookies.get("gh-session")?.value === (process.env.AUTH_SESSION_SECRET || "growthhive-temporary-session");
  const isLogin = request.nextUrl.pathname === "/login";
  if (!loggedIn && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (loggedIn && isLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
