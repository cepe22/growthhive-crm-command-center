import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookies, createSessionToken, isAllowedEmail, verifyLoginPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const passwordOk = await verifyLoginPassword(String(email || ""), String(password || ""), cookies().get(authCookies.passwords)?.value);
  if (!passwordOk || !isAllowedEmail(email)) return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookies.session, await createSessionToken(email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: authCookies.maxAge, path: "/" });
  response.cookies.set(authCookies.email, String(email).toLowerCase(), { sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: authCookies.maxAge, path: "/" });
  return response;
}
