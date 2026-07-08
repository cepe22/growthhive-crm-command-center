import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authCookies,
  createPasswordOverridesToken,
  passwordHash,
  readPasswordOverrides,
  verifyLoginPassword,
  verifySessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const email = await verifySessionToken(cookies().get(authCookies.session)?.value);
  if (!email) return NextResponse.json({ error: "Session tidak valid. Silakan login ulang." }, { status: 401 });

  const { currentPassword, newPassword, confirmPassword } = await request.json();
  if (!currentPassword || !newPassword || !confirmPassword) return NextResponse.json({ error: "Lengkapi semua field password." }, { status: 400 });
  if (String(newPassword).length < 8) return NextResponse.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
  if (newPassword !== confirmPassword) return NextResponse.json({ error: "Konfirmasi password baru belum sama." }, { status: 400 });

  const overrideToken = cookies().get(authCookies.passwords)?.value;
  const currentPasswordOk = await verifyLoginPassword(email, String(currentPassword), overrideToken);
  if (!currentPasswordOk) return NextResponse.json({ error: "Password lama salah." }, { status: 401 });

  const overrides = await readPasswordOverrides(overrideToken);
  overrides[email] = await passwordHash(email, String(newPassword));

  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookies.passwords, await createPasswordOverridesToken(overrides), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authCookies.passwordMaxAge,
    path: "/",
  });
  return response;
}
