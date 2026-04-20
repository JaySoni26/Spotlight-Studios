import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "spotlight.db");
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  migrate(_db);
  return _db;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      schedule TEXT,
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      amount INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      validity_days INTEGER NOT NULL DEFAULT 30,
      batch_id TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS batch_history (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      from_batch_id TEXT,
      to_batch_id TEXT,
      changed_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      note TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
    CREATE INDEX IF NOT EXISTS idx_students_start ON students(start_date);
    CREATE INDEX IF NOT EXISTS idx_batch_history_student ON batch_history(student_id);
  `);
}

// Row types
export interface BatchRow {
  id: string;
  name: string;
  price: number;
  schedule: string | null;
  description: string | null;
  created_at: number;
}

export interface StudentRow {
  id: string;
  name: string;
  phone: string | null;
  amount: number;
  start_date: string;
  validity_days: number;
  batch_id: string | null;
  notes: string | null;
  created_at: number;
}

export interface BatchHistoryRow {
  id: string;
  student_id: string;
  from_batch_id: string | null;
  to_batch_id: string | null;
  changed_at: number;
  note: string | null;
}
