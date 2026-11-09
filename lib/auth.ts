// Session signing that works in both the Edge middleware and Node route handlers
// (Web Crypto only, no Node-specific APIs).

import type { BrandId } from "./brands";

export type Role = "owner" | BrandId;

export interface Account {
  username: string;
  role: Role;
  label: string;
  passwordEnv: string;
}

export interface Session {
  u: string; // username
  r: Role;
  exp: number; // unix seconds
}

export const SESSION_COOKIE = "tp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export const ACCOUNTS: Account[] = [
  { username: "owner", role: "owner", label: "Owner: all three companies", passwordEnv: "OWNER_PASSWORD" },
  { username: "ljs", role: "ljs", label: "LJ's Cleaning Solutions", passwordEnv: "LJS_PASSWORD" },
  { username: "allfaze", role: "allfaze", label: "All Faze Electric", passwordEnv: "ALLFAZE_PASSWORD" },
  { username: "platinum", role: "platinum", label: "Platinum Refrigeration", passwordEnv: "PLATINUM_PASSWORD" },
];

const isProd = process.env.NODE_ENV === "production";

export function getSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  return isProd ? null : "local-dev-secret-not-for-production";
}

export function passwordFor(account: Account): string | null {
  const p = process.env[account.passwordEnv] || process.env.DEMO_PASSWORD;
  if (p) return p;
  return isProd ? null : "demo";
}

const enc = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Compares two strings without leaking where they differ. */
export async function safeEqual(a: string, b: string, secret: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([hmac(secret, a), hmac(secret, b)]);
  return equalBytes(ha, hb);
}

export async function signSession(session: Session, secret: string): Promise<string> {
  const payload = toB64Url(enc.encode(JSON.stringify(session)));
  const sig = toB64Url(await hmac(secret, payload));
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined, secret: string | null): Promise<Session | null> {
  if (!token || !secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const expected = await hmac(secret, payload);
    if (!equalBytes(expected, fromB64Url(sig))) return null;
    const session = JSON.parse(new TextDecoder().decode(fromB64Url(payload))) as Session;
    if (typeof session.exp !== "number" || session.exp < Date.now() / 1000) return null;
    if (!ACCOUNTS.some((a) => a.username === session.u && a.role === session.r)) return null;
    return session;
  } catch {
    return null;
  }
}
