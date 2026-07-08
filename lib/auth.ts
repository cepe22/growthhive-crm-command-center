export const allowedTeamEmails = [
  "joshua.ramadhan@gmail.com",
  "bariahinayatul@gmail.com",
  "sellinaukrida2020@gmail.com",
  "growthiveofficial@gmail.com",
  "hi.growthive@gmail.com",
] as const;

export const adminEmails = ["growthiveofficial@gmail.com"] as const;
export const readOnlyEmails = ["hi.growthive@gmail.com"] as const;

export type UserAccess = "admin" | "team" | "readonly";

const sessionCookieName = "gh-session";
const userEmailCookieName = "gh-user-email";
const passwordOverrideCookieName = "gh-password-overrides";
const maxAgeSeconds = 60 * 60 * 24 * 7;
const passwordMaxAgeSeconds = 60 * 60 * 24 * 365;

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || "growthhive-temporary-session";
}

export function normalizeEmail(email: string) {
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

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return adminEmails.includes(normalizeEmail(email) as (typeof adminEmails)[number]);
}

export function isReadOnlyEmail(email?: string | null) {
  if (!email) return false;
  return readOnlyEmails.includes(normalizeEmail(email) as (typeof readOnlyEmails)[number]);
}

export function getUserAccess(email?: string | null): UserAccess | null {
  if (!isAllowedEmail(email)) return null;
  if (isReadOnlyEmail(email)) return "readonly";
  return isAdminEmail(email) ? "admin" : "team";
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

export function defaultLoginPassword() {
  return process.env.TEMP_LOGIN_PASSWORD || "GrowthHive2026!";
}

export async function passwordHash(email: string, password: string) {
  return hmac(`${normalizeEmail(email)}:${password}`);
}

export async function readPasswordOverrides(token?: string | null) {
  if (!token) return {} as Record<string, string>;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== await hmac(payload)) return {};
  try {
    const data = JSON.parse(base64UrlDecode(payload)) as Record<string, string>;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export async function createPasswordOverridesToken(overrides: Record<string, string>) {
  const payload = base64UrlEncode(JSON.stringify(overrides));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyLoginPassword(email: string, password: string, overrideToken?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const overrides = await readPasswordOverrides(overrideToken);
  const override = overrides[normalizedEmail];
  if (override) return override === await passwordHash(normalizedEmail, password);
  return password === defaultLoginPassword();
}

export const authCookies = {
  session: sessionCookieName,
  email: userEmailCookieName,
  passwords: passwordOverrideCookieName,
  maxAge: maxAgeSeconds,
  passwordMaxAge: passwordMaxAgeSeconds,
};
