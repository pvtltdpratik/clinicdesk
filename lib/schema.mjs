// The whole database schema lives here, in plain SQL.
// It is shared by the Next.js app (lib/db.ts) and the CLI scripts in /scripts,
// so both always agree on the table structure.
//
// Every statement uses "IF NOT EXISTS", so running it again is harmless.

import path from "node:path";

export const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "clinic.db");

export const SCHEMA = `
PRAGMA foreign_keys = ON;

-- Staff who can log in. role decides what they are allowed to do.
-- extra_permissions is an optional comma-separated list used to explicitly
-- grant a receptionist something extra (for example "clinical:read").
CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  username          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash     TEXT NOT NULL,
  role              TEXT NOT NULL CHECK (role IN ('doctor', 'receptionist')),
  extra_permissions TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per logged-in browser. We store a SHA-256 hash of the session
-- token, never the token itself, so a leaked database can't be used to log in.
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  gender          TEXT NOT NULL DEFAULT '',
  date_of_birth   TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  blood_group     TEXT NOT NULL DEFAULT '',
  allergies       TEXT NOT NULL DEFAULT '',
  medical_history TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

CREATE TABLE IF NOT EXISTS appointments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,             -- YYYY-MM-DD
  time       TEXT NOT NULL DEFAULT '',  -- HH:MM
  reason     TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'scheduled'
             CHECK (status IN ('scheduled', 'arrived', 'completed', 'cancelled', 'no_show')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- A visit starts when the patient arrives (it is their place in the queue)
-- and holds the doctor's clinical record for that consultation.
CREATE TABLE IF NOT EXISTS visits (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id     INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  visit_date     TEXT NOT NULL,         -- YYYY-MM-DD
  queue_number   INTEGER NOT NULL,
  arrived_at     TEXT NOT NULL DEFAULT (datetime('now')),
  status         TEXT NOT NULL DEFAULT 'waiting'
                 CHECK (status IN ('waiting', 'in_consultation', 'completed', 'cancelled')),
  complaints     TEXT NOT NULL DEFAULT '',
  diagnosis      TEXT NOT NULL DEFAULT '',
  notes          TEXT NOT NULL DEFAULT '',
  advice         TEXT NOT NULL DEFAULT '',
  doctor_id      INTEGER REFERENCES users(id),
  completed_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);

-- The medicines on a visit's prescription.
CREATE TABLE IF NOT EXISTS prescription_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id      INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage        TEXT NOT NULL DEFAULT '',
  frequency     TEXT NOT NULL DEFAULT '',
  duration      TEXT NOT NULL DEFAULT '',
  instructions  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_rx_visit ON prescription_items(visit_id);

CREATE TABLE IF NOT EXISTS invoices (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id     INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id       INTEGER REFERENCES visits(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'unpaid'
                 CHECK (status IN ('unpaid', 'paid', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT '',
  notes          TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at        TEXT
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  REAL NOT NULL DEFAULT 0
);

-- Filled from the CSV by "npm run db:import-medicines".
CREATE TABLE IF NOT EXISTS medicines (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  price           REAL,
  is_discontinued INTEGER NOT NULL DEFAULT 0,
  manufacturer    TEXT NOT NULL DEFAULT '',
  type            TEXT NOT NULL DEFAULT '',
  pack_size       TEXT NOT NULL DEFAULT '',
  composition     TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name COLLATE NOCASE);
`;
