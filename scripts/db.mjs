// Opens the same SQLite file the app uses and makes sure the tables exist.
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import { DB_PATH, SCHEMA } from "../lib/schema.mjs";

export function openDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);
  return db;
}

// Creates a user, or updates name/role/password if the username already exists.
export function upsertUser(db, { name, username, password, role }) {
  if (!["doctor", "receptionist"].includes(role)) {
    throw new Error(`role must be "doctor" or "receptionist", got "${role}"`);
  }
  if (!password || password.length < 8) {
    throw new Error("password must be at least 8 characters");
  }
  const passwordHash = bcrypt.hashSync(password, 12);
  db.prepare(
    `INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET name = excluded.name,
       password_hash = excluded.password_hash, role = excluded.role`,
  ).run(name, username, passwordHash, role);
}
