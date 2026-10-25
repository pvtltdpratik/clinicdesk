// Creates the initial doctor and receptionist accounts for local development.
//
//   npm run db:seed
//
// The passwords below are DEVELOPMENT DEFAULTS ONLY. Override them with
// SEED_DOCTOR_PASSWORD / SEED_RECEPTIONIST_PASSWORD, or change them later with
// "npm run user:create" before using the app with real patients.
import { openDb, upsertUser } from "./db.mjs";

const db = openDb();

const accounts = [
  {
    role: "doctor",
    username: "doctor",
    name: "Dr. Asha Rao",
    password: process.env.SEED_DOCTOR_PASSWORD ?? "doctor-dev-123",
  },
  {
    role: "receptionist",
    username: "reception",
    name: "Priya Shah",
    password: process.env.SEED_RECEPTIONIST_PASSWORD ?? "reception-dev-123",
  },
];

for (const account of accounts) {
  upsertUser(db, account);
  console.log(`Saved ${account.role} account "${account.username}".`);
}
console.log("Passwords are the defaults in scripts/seed.mjs unless you set the SEED_* env vars.");
