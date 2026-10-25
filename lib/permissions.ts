// Every action in the app is guarded by one of these permissions.
// The server checks them (see requirePermission in lib/auth.ts); the UI only
// uses them to decide which links and buttons to show.

export const ROLES = ["doctor", "receptionist"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "patients:read", //      search patients, view profile & visit list
  "patients:write", //     register / edit patients
  "appointments:manage", // book, reschedule, cancel appointments
  "queue:manage", //       check patients in, maintain the waiting queue
  "invoices:manage", //    create invoices, update payment status, print
  "clinical:read", //      view complaints, diagnoses, notes, prescriptions
  "clinical:write", //     record consultations and write prescriptions
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const RECEPTIONIST_PERMISSIONS: Permission[] = [
  "patients:read",
  "patients:write",
  "appointments:manage",
  "queue:manage",
  "invoices:manage",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  receptionist: RECEPTIONIST_PERMISSIONS,
  // Doctors can do everything a receptionist can, plus clinical work.
  doctor: [...RECEPTIONIST_PERMISSIONS, "clinical:read", "clinical:write"],
};

export const HOME_PATH: Record<Role, string> = {
  doctor: "/doctor",
  receptionist: "/reception",
};

// Combines a role's permissions with any extras explicitly granted to the user.
export function permissionsFor(role: Role, extraPermissions = ""): Permission[] {
  const extras = extraPermissions
    .split(",")
    .map((p) => p.trim())
    .filter((p): p is Permission => (PERMISSIONS as readonly string[]).includes(p));
  return Array.from(new Set([...ROLE_PERMISSIONS[role], ...extras]));
}
