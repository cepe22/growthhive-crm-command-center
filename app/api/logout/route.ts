import { NextResponse } from "next/server";
import { authCookies } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookies.session, "", { expires: new Date(0), path: "/" });
  response.cookies.set(authCookies.email, "", { expires: new Date(0), path: "/" });
  return response;
}
