"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { get } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { HOME_PATH, type Role } from "@/lib/permissions";

export type LoginState = { error?: string; username?: string };

// A real bcrypt hash of a random string. When the username doesn't exist we
// still compare against it, so "wrong username" and "wrong password" take the
// same time and an attacker can't discover which usernames exist.
const DUMMY_HASH = "$2b$12$y/rmAHryfq6uf6aIyxDNc.EhSHMNcILWAPwVherPcKTjGt05SMpMi";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password.", username };
  }

  // Note: the role comes from the database, never from the login form.
  const user = get<{ id: number; password_hash: string; role: Role }>(
    "SELECT id, password_hash, role FROM users WHERE username = ?",
    username,
  );
  const passwordOk = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !passwordOk) {
    return { error: "Incorrect username or password.", username };
  }

  await createSession(user.id);
  redirect(HOME_PATH[user.role]);
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
