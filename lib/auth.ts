import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { get } from "./db";
import { getSessionUserId } from "./session";
import { permissionsFor, type Permission, type Role } from "./permissions";

// This file is the app's "Data Access Layer" for authentication.
// Every page, Server Action and API route calls one of these functions
// before touching patient data, so permissions are enforced on the server.

export type CurrentUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
  permissions: Permission[];
};

// cache() means we read the session at most once per request, even if
// several components ask for the user.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = get<{ id: number; name: string; username: string; role: Role; extra_permissions: string }>(
    "SELECT id, name, username, role, extra_permissions FROM users WHERE id = ?",
    userId,
  );
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    permissions: permissionsFor(user.role, user.extra_permissions),
  };
});

export function can(user: CurrentUser, permission: Permission) {
  return user.permissions.includes(permission);
}

// For pages and Server Actions: send logged-out users to the login page.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// For pages and Server Actions: logged-in users without the permission
// are sent to the "not allowed" page.
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user, permission)) redirect("/forbidden");
  return user;
}

// For API route handlers, which should answer with JSON status codes
// instead of redirecting.
export async function checkApiPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: Response.json({ error: "Not logged in" }, { status: 401 }) };
  if (!can(user, permission)) return { user: null, error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, error: null };
}
