import { createClient, type Client as LibsqlClient, type InArgs } from "@libsql/client";

type Params = unknown[];

/** Trim and strip surrounding quotes (common .env copy-paste mistakes). */
function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = process.env[key];
    if (raw === undefined || raw === "") continue;
    let v = raw.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1).trim();
    }
    if (v !== "") return v;
  }
  return undefined;
}

/** Reject obvious .env.example copy-paste so users get a clear message instead of HTTP 404. */
function assertRealRemoteConfig(url: string, authToken: string | undefined) {
  const host = url.toLowerCase();
  if (host.includes("your-database-your-org")) {
    throw new Error(
      "TURSO_DATABASE_URL is still the .env.example placeholder (your-database-your-org). In Turso open your database → Connect → copy the real libsql://… URL into .env.local, then restart the dev server.",
    );
  }
  const t = authToken?.trim().toLowerCase();
  if (t === "your-turso-auth-token" || t === "changeme" || t === "replace_me") {
    throw new Error(
      "TURSO_AUTH_TOKEN is still a placeholder. In Turso: Connect → create a token → paste it into .env.local.",
    );
  }
}

/**
 * Node's fetch sometimes returns a Response body without a spec-compliant `.cancel()`.
 * @libsql/hrana-client calls `resp.body?.cancel()` on error paths and throws TypeError,
 * masking the real HTTP error from Turso. Buffering fixes that for small SQL responses.
 */
function libsqlFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init).then(async (res) => {
    const body = res.body;
    if (body != null && typeof (body as ReadableStream).cancel !== "function") {
      const bytes = await res.arrayBuffer();
      return new Response(bytes, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    }
    return res;
  });
}

export interface DbClient {
  get<T = any>(sql: string, params?: Params): Promise<T | undefined>;
  all<T = any>(sql: string, params?: Params): Promise<T[]>;
  run(sql: string, params?: Params): Promise<{ changes: number }>;
  exec(sql: string): Promise<void>;
}

let _dbPromise: Promise<DbClient> | null = null;

export async function db(): Promise<DbClient> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = createDbClient();
  return _dbPromise;
}

async function createDbClient(): Promise<DbClient> {
  const url = readEnv("TURSO_DATABASE_URL", "LIBSQL_URL");
  if (!url) {
    throw new Error(
      "Database URL missing. Set TURSO_DATABASE_URL or LIBSQL_URL (and TURSO_AUTH_TOKEN / LIBSQL_AUTH_TOKEN). Local file storage is disabled.",
    );
  }
  const authToken = readEnv("TURSO_AUTH_TOKEN", "LIBSQL_AUTH_TOKEN");
  assertRealRemoteConfig(url, authToken);
  const client = createClient({
    url,
    authToken,
    fetch: libsqlFetch as typeof fetch,
  });
  const wrapped = createLibsqlAdapter(client);
  await migrate(wrapped);
  return wrapped;
}

/** Turso / libsql may return bigint for integers — JSON routes need plain numbers. */
function normalizeLibsqlRow(row: unknown): any {
  if (row == null || typeof row !== "object" || Array.isArray(row)) return row;
  const obj = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    out[key] = typeof v === "bigint" ? Number(v) : v;
  }
  return out;
}

function createLibsqlAdapter(client: LibsqlClient): DbClient {
  return {
    async get<T = any>(sql: string, params: Params = []) {
      const result = await client.execute({ sql, args: params as InArgs });
      const first = result.rows[0];
      return (first == null ? undefined : normalizeLibsqlRow(first)) as T | undefined;
    },
    async all<T = any>(sql: string, params: Params = []) {
      const result = await client.execute({ sql, args: params as InArgs });
      return result.rows.map((r) => normalizeLibsqlRow(r)) as T[];
    },
    async run(sql: string, params: Params = []) {
      const result = await client.execute({ sql, args: params as InArgs });
      return { changes: result.rowsAffected ?? 0 };
    },
    async exec(sql: string) {
      await client.executeMultiple(sql);
    },
  };
}

async function migrate(d: DbClient) {
  await d.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      schedule TEXT,
      schedule_json TEXT,
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

    CREATE TABLE IF NOT EXISTS delete_events (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      refund_amount INTEGER NOT NULL DEFAULT 0,
      deleted_payload TEXT,
      deleted_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS studio_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS freelance_gigs (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      phone TEXT,
      amount INTEGER NOT NULL DEFAULT 0,
      work_days INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS transaction_events (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL DEFAULT 'student',
      entity_id TEXT,
      student_name TEXT,
      action TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT,
      note TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
    CREATE INDEX IF NOT EXISTS idx_students_start ON students(start_date);
    CREATE INDEX IF NOT EXISTS idx_batch_history_student ON batch_history(student_id);
    CREATE INDEX IF NOT EXISTS idx_delete_events_entity ON delete_events(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_freelance_created ON freelance_gigs(created_at);
    CREATE INDEX IF NOT EXISTS idx_transaction_events_created ON transaction_events(created_at);
  `);

  const batchColumns = await d.all<{ name: string }>("PRAGMA table_info(batches)");
  if (!batchColumns.some((col) => col.name === "schedule_json")) {
    await d.exec("ALTER TABLE batches ADD COLUMN schedule_json TEXT");
  }

  await d.run(`
    INSERT OR IGNORE INTO studio_settings (key, value)
    VALUES ('delete_admin_code', '0000')
  `);
  await d.run(`
    INSERT OR IGNORE INTO studio_settings (key, value)
    VALUES ('leave_transfer_percent', '50')
  `);
  await d.run(`
    INSERT OR IGNORE INTO studio_settings (key, value)
    VALUES ('ui_theme', 'system')
  `);

  await d.exec(`
    CREATE TABLE IF NOT EXISTS student_leaves (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      leave_days INTEGER NOT NULL,
      transfer_days INTEGER NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_student_leaves_student ON student_leaves(student_id);
  `);

  const studentCols = await d.all<{ name: string }>("PRAGMA table_info(students)");
  if (!studentCols.some((c) => c.name === "enrollment_kind")) {
    await d.exec(`ALTER TABLE students ADD COLUMN enrollment_kind TEXT DEFAULT 'paid'`);
    await d.run(`UPDATE students SET enrollment_kind = 'paid' WHERE enrollment_kind IS NULL`);
  }
  if (!studentCols.some((c) => c.name === "trial_end_date")) {
    await d.exec(`ALTER TABLE students ADD COLUMN trial_end_date TEXT`);
  }
  const deleteEventCols = await d.all<{ name: string }>("PRAGMA table_info(delete_events)");
  if (!deleteEventCols.some((c) => c.name === "deleted_payload")) {
    await d.exec("ALTER TABLE delete_events ADD COLUMN deleted_payload TEXT");
  }
}

// Row types
export interface BatchRow {
  id: string;
  name: string;
  price: number;
  schedule: string | null;
  schedule_json: string | null;
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
  enrollment_kind?: string | null;
  trial_end_date?: string | null;
}

export interface BatchHistoryRow {
  id: string;
  student_id: string;
  from_batch_id: string | null;
  to_batch_id: string | null;
  changed_at: number;
  note: string | null;
}

export interface StudioSettingRow {
  key: string;
  value: string;
  updated_at: number;
}

export interface FreelanceGigRow {
  id: string;
  client_name: string;
  phone: string | null;
  amount: number;
  work_days: number;
  notes: string | null;
  created_at: number;
}

export interface TransactionEventRow {
  id: string;
  entity_type: string;
  entity_id: string | null;
  student_name: string | null;
  action: string;
  amount: number;
  payment_method: string | null;
  note: string | null;
  created_at: number;
}
