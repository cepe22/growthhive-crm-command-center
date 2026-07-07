import { authCookies, verifySessionToken } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const email = await verifySessionToken(request.cookies.get(authCookies.session)?.value);
  if (!email) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email });
}
