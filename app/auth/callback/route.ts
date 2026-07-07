import { authCookies, createSessionToken, isAllowedEmail } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", origin));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.redirect(new URL("/login?error=config", origin));

  const cookieStore = cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }[]) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const email = data.user?.email;
  if (error || !isAllowedEmail(email)) {
    await supabase.auth.signOut();
    const response = NextResponse.redirect(new URL("/login?error=unauthorized", origin));
    response.cookies.set(authCookies.session, "", { expires: new Date(0), path: "/" });
    response.cookies.set(authCookies.email, "", { expires: new Date(0), path: "/" });
    return response;
  }

  const response = NextResponse.redirect(new URL("/", origin));
  response.cookies.set(authCookies.session, await createSessionToken(email!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authCookies.maxAge,
    path: "/",
  });
  response.cookies.set(authCookies.email, email!.toLowerCase(), {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authCookies.maxAge,
    path: "/",
  });
  return response;
}
