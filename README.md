# Simple Doctor & Receptionist

A small clinic app built with Next.js 16 and SQLite (Node's built-in `node:sqlite`, no ORM).
Doctors and receptionists share one login page; what each person sees and can do depends on their role.

## Getting started

Requires **Node.js 22.13+** (for `node:sqlite`).

```bash
npm install
npm run setup      # creates data/clinic.db, the two starter accounts, and imports medicines
npm run dev        # http://localhost:3000
```

`npm run setup` runs two steps you can also run on their own:

| Command | What it does |
| --- | --- |
| `npm run db:seed` | Creates the starter accounts `doctor` and `reception`. Their development passwords are in `scripts/seed.mjs` (or set `SEED_DOCTOR_PASSWORD` / `SEED_RECEPTIONIST_PASSWORD`). |
| `npm run db:import-medicines` | Loads `data/medicines.csv` (the A–Z medicines dataset of India) into the `medicines` table for prescription autocomplete. Pass a different path with `npm run db:import-medicines -- path/to/file.csv`. |

Create more staff, or reset a password:

```bash
npm run user:create -- doctor drmehta "Dr. Anil Mehta" "a-strong-password"
```

Change the starter passwords before using the app with real patients.

## How access control works

- **Roles** live in the `users` table (`doctor` or `receptionist`). The login form has no role field; the role always comes from the database.
- **Permissions** are listed in `lib/permissions.ts`. Receptionists get patients, appointments, queue and invoices. Doctors get all of that plus `clinical:read` and `clinical:write`.
- To explicitly let a receptionist do something extra, add it to their `extra_permissions` column, e.g. `clinical:read`.
- **Enforced on the server**: every page, Server Action and API route starts with `requirePermission(...)` from `lib/auth.ts`. Hiding buttons is only for convenience.
- **Sessions**: a random token in an httpOnly cookie; the database stores only its SHA-256 hash (`sessions` table). Logging out deletes the row. Passwords are hashed with bcrypt.
- `proxy.ts` redirects anyone without a session cookie to `/login` before a page renders.

## Where things are

| Path | Purpose |
| --- | --- |
| `lib/schema.mjs` | All tables, in plain SQL |
| `lib/db.ts` | Database connection + `all` / `get` / `run` / `transaction` helpers |
| `lib/auth.ts`, `lib/session.ts` | Current user, permission checks, login sessions |
| `app/actions/*` | Server Actions (all writes) |
| `app/(app)/*` | Logged-in pages; `layout.tsx` builds the role-specific sidebar |
| `app/api/medicines` | Medicine autocomplete (doctors only) |
| `app/print/*` | Printable invoices and prescriptions |
