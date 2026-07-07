import { NextResponse, type NextRequest } from "next/server";
import { authCookies, getUserAccess, verifySessionToken } from "@/lib/auth";

const teamAllowedPaths = ["/", "/client-management", "/reimbursements"];
const teamBlockedPaths = ["/crm", "/clients", "/invoices", "/finance", "/reports", "/settings"];

function pathStartsWith(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const email = await verifySessionToken(request.cookies.get(authCookies.session)?.value);
  const access = getUserAccess(email);
  const isLogin = request.nextUrl.pathname === "/login";
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");
  if (isAuthCallback) return NextResponse.next();
  if (!email && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (email && isLogin) return NextResponse.redirect(new URL("/", request.url));
  if (access === "team" && pathStartsWith(request.nextUrl.pathname, teamBlockedPaths)) return NextResponse.redirect(new URL("/", request.url));
  if (access === "team" && !pathStartsWith(request.nextUrl.pathname, teamAllowedPaths)) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
