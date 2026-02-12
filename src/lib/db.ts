import Database from 'better-sqlite3';
import path from 'path';

const DB_DIR = process.env.DB_DIR || process.cwd();
const DB_PATH = path.join(DB_DIR, 'talkwise.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initTables(_db);
  }
  return _db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      persona_config TEXT NOT NULL,
      messages TEXT DEFAULT '[]',
      feedback TEXT,
      ended_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      session_id TEXT,
      endpoint TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      estimated_cost REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}

// ── User operations ──

export function createUser(id: string, email: string, name: string, passwordHash: string) {
  const db = getDb();
  db.prepare(
    'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
  ).run(id, email, name, passwordHash);
}

export function getUserByEmail(email: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: string; email: string; name: string; password_hash: string; created_at: string }
    | undefined;
}

export function getUserById(id: string) {
  const db = getDb();
  return db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(id) as
    | { id: string; email: string; name: string; created_at: string }
    | undefined;
}

// ── Usage logging ──

export interface UsageEntry {
  userId: string;
  sessionId?: string;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export function logUsage(entry: UsageEntry) {
  const db = getDb();
  db.prepare(
    `INSERT INTO usage_logs (user_id, session_id, endpoint, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entry.userId,
    entry.sessionId || null,
    entry.endpoint,
    entry.model,
    entry.promptTokens,
    entry.completionTokens,
    entry.totalTokens,
    entry.estimatedCost
  );
}

export function getUserUsageToday(userId: string): { totalRequests: number; totalTokens: number; totalCost: number } {
  const db = getDb();
  const row = db.prepare(
    `SELECT COUNT(*) as totalRequests, COALESCE(SUM(total_tokens), 0) as totalTokens, COALESCE(SUM(estimated_cost), 0) as totalCost
     FROM usage_logs
     WHERE user_id = ? AND created_at >= datetime('now', '-1 day')`
  ).get(userId) as { totalRequests: number; totalTokens: number; totalCost: number };
  return row;
}

export function getUserUsageAllTime(userId: string) {
  const db = getDb();
  return db.prepare(
    `SELECT COUNT(*) as totalRequests, COALESCE(SUM(total_tokens), 0) as totalTokens, COALESCE(SUM(estimated_cost), 0) as totalCost
     FROM usage_logs
     WHERE user_id = ?`
  ).get(userId) as { totalRequests: number; totalTokens: number; totalCost: number };
}

// ── Rate limit check (using usage_logs) ──

export function getRecentRequestCount(userId: string, windowSeconds: number): number {
  const db = getDb();
  const row = db.prepare(
    `SELECT COUNT(*) as cnt FROM usage_logs
     WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' seconds')`
  ).get(userId, windowSeconds) as { cnt: number };
  return row.cnt;
}

export default getDb;
