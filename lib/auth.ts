export const allowedTeamEmails = [
  "joshua.ramadhan@gmail.com",
  "bariahinayatul@gmail.com",
  "sellinaukrida2020@gmail.com",
  "growthiveofficial@gmail.com",
] as const;

const sessionCookieName = "gh-session";
const userEmailCookieName = "gh-user-email";
const maxAgeSeconds = 60 * 60 * 24 * 7;

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || "growthhive-temporary-session";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncode(String.fromCharCode(...Array.from(new Uint8Array(signature))));
}

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  return allowedTeamEmails.includes(normalizeEmail(email) as (typeof allowedTeamEmails)[number]);
}

export async function createSessionToken(email: string) {
  const payload = base64UrlEncode(JSON.stringify({ email: normalizeEmail(email), exp: Date.now() + maxAgeSeconds * 1000 }));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== await hmac(payload)) return null;
  try {
    const data = JSON.parse(base64UrlDecode(payload)) as { email?: string; exp?: number };
    if (!data.email || !data.exp || Date.now() > data.exp || !isAllowedEmail(data.email)) return null;
    return normalizeEmail(data.email);
  } catch {
    return null;
  }
}

export const authCookies = {
  session: sessionCookieName,
  email: userEmailCookieName,
  maxAge: maxAgeSeconds,
};
