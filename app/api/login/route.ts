import { NextResponse } from "next/server";
import {
  ACCOUNTS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  getSecret,
  passwordFor,
  safeEqual,
  signSession,
} from "@/lib/auth";

export async function POST(req: Request) {
  const secret = getSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Login isn't configured yet. Set AUTH_SECRET and the passwords in Vercel." },
      { status: 500 },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const account = ACCOUNTS.find((a) => a.username === username);
  const expected = account ? passwordFor(account) : null;
  // Always run the comparison so timing doesn't reveal which usernames exist.
  const ok = await safeEqual(password, expected ?? "\u0000no-account", secret);

  if (!account || !expected || !ok) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "That username and password don't match." }, { status: 401 });
  }

  const token = await signSession(
    { u: account.username, r: account.role, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    secret,
  );
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
