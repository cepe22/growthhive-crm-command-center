import { NextResponse } from "next/server";
import { authCookies, createSessionToken, isAllowedEmail } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const validEmail = process.env.TEMP_LOGIN_EMAIL || "growthiveofficial@gmail.com";
  const validPassword = process.env.TEMP_LOGIN_PASSWORD || "GrowthHive2026!";
  if (email !== validEmail || password !== validPassword || !isAllowedEmail(email)) return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookies.session, await createSessionToken(email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: authCookies.maxAge, path: "/" });
  response.cookies.set(authCookies.email, String(email).toLowerCase(), { sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: authCookies.maxAge, path: "/" });
  return response;
}
