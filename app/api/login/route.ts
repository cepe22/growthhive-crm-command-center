import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const validEmail = process.env.TEMP_LOGIN_EMAIL || "christopher@growthhive.id";
  const validPassword = process.env.TEMP_LOGIN_PASSWORD || "GrowthHive2026!";
  if (email !== validEmail || password !== validPassword) return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("gh-session", process.env.AUTH_SESSION_SECRET || "growthhive-temporary-session", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return response;
}
