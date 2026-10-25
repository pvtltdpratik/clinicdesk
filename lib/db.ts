import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { DB_PATH, SCHEMA } from "./schema.mjs";

// One shared connection for the whole server process.
// In development Next.js reloads modules often, so we keep the connection on
// globalThis to avoid opening a new one on every hot reload.
const globalForDb = globalThis as unknown as { clinicDb?: DatabaseSync };

function openDatabase() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);
  return db;
}

export const db = globalForDb.clinicDb ?? (globalForDb.clinicDb = openDatabase());

// Small helpers so the rest of the app reads nicely:
//   all<Patient>("SELECT * FROM patients WHERE name LIKE ?", "%ram%")
type Param = string | number | null;

// node:sqlite returns rows as "null-prototype" objects. React can't pass those
// from Server Components to Client Components, so we copy each row into a
// normal object.
const plain = <T>(row: unknown) => ({ ...(row as object) }) as T;

export function all<T>(sql: string, ...params: Param[]): T[] {
  return db.prepare(sql).all(...params).map((row) => plain<T>(row));
}

export function get<T>(sql: string, ...params: Param[]): T | undefined {
  const row = db.prepare(sql).get(...params);
  return row === undefined ? undefined : plain<T>(row);
}

export function run(sql: string, ...params: Param[]) {
  const result = db.prepare(sql).run(...params);
  return { id: Number(result.lastInsertRowid), changes: Number(result.changes) };
}

// Runs several statements as one all-or-nothing unit.
export function transaction<T>(work: () => T): T {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
