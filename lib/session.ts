import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { get, run } from "./db";

// How sessions work:
// 1. On login we create a long random token and send it to the browser in an
//    httpOnly cookie (JavaScript in the page can't read it).
// 2. We store only a SHA-256 hash of that token in the sessions table.
// 3. On every request we hash the cookie again and look it up.
// Logging out deletes the row, so the cookie stops working immediately.

export const SESSION_COOKIE = "clinic_session";
const SESSION_DAYS = 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;

  run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", hashToken(token), userId, expiresAt);
  // Clean up old sessions while we're here.
  run("DELETE FROM sessions WHERE expires_at < ?", Date.now());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

// Returns the user id for the current request's session, or null.
export async function getSessionUserId(): Promise<number | null> {
  // Checking a session must always happen for the real request, never while
  // Next.js prerenders or prefetches a page ahead of time. connection() tells
  // Next.js "stop prerendering here". (Our SQLite queries are synchronous, so
  // Next.js can't detect this on its own.)
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = get<{ user_id: number; expires_at: number }>(
    "SELECT user_id, expires_at FROM sessions WHERE id = ?",
    hashToken(token),
  );
  if (!session || session.expires_at < Date.now()) return null;
  return session.user_id;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE id = ?", hashToken(token));
  cookieStore.delete(SESSION_COOKIE);
}
