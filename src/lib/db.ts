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

    CREATE TABLE IF NOT EXISTS saved_personas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      goal TEXT NOT NULL,
      scenario TEXT DEFAULT '',
      difficulty_level INTEGER DEFAULT 5,
      decision_orientation INTEGER DEFAULT 5,
      communication_style INTEGER DEFAULT 5,
      authority_posture INTEGER DEFAULT 5,
      temperament_stability INTEGER DEFAULT 5,
      social_presence INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_personas_user ON saved_personas(user_id);
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

// ── Saved Personas ──

export interface SavedPersonaRow {
  id: string;
  user_id: string;
  name: string;
  goal: string;
  scenario: string;
  difficulty_level: number;
  decision_orientation: number;
  communication_style: number;
  authority_posture: number;
  temperament_stability: number;
  social_presence: number;
  created_at: string;
  updated_at: string;
}

export function getUserPersonas(userId: string): SavedPersonaRow[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM saved_personas WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(userId) as SavedPersonaRow[];
}

export function getPersonaById(id: string, userId: string): SavedPersonaRow | undefined {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM saved_personas WHERE id = ? AND user_id = ?'
  ).get(id, userId) as SavedPersonaRow | undefined;
}

export function savePersona(persona: Omit<SavedPersonaRow, 'created_at' | 'updated_at'>) {
  const db = getDb();
  db.prepare(
    `INSERT INTO saved_personas (id, user_id, name, goal, scenario, difficulty_level, decision_orientation, communication_style, authority_posture, temperament_stability, social_presence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    persona.id,
    persona.user_id,
    persona.name,
    persona.goal,
    persona.scenario,
    persona.difficulty_level,
    persona.decision_orientation,
    persona.communication_style,
    persona.authority_posture,
    persona.temperament_stability,
    persona.social_presence
  );
}

export function updatePersona(id: string, userId: string, updates: Partial<Omit<SavedPersonaRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.goal !== undefined) { fields.push('goal = ?'); values.push(updates.goal); }
  if (updates.scenario !== undefined) { fields.push('scenario = ?'); values.push(updates.scenario); }
  if (updates.difficulty_level !== undefined) { fields.push('difficulty_level = ?'); values.push(updates.difficulty_level); }
  if (updates.decision_orientation !== undefined) { fields.push('decision_orientation = ?'); values.push(updates.decision_orientation); }
  if (updates.communication_style !== undefined) { fields.push('communication_style = ?'); values.push(updates.communication_style); }
  if (updates.authority_posture !== undefined) { fields.push('authority_posture = ?'); values.push(updates.authority_posture); }
  if (updates.temperament_stability !== undefined) { fields.push('temperament_stability = ?'); values.push(updates.temperament_stability); }
  if (updates.social_presence !== undefined) { fields.push('social_presence = ?'); values.push(updates.social_presence); }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id, userId);

  db.prepare(
    `UPDATE saved_personas SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  ).run(...values);
}

export function deletePersona(id: string, userId: string) {
  const db = getDb();
  db.prepare('DELETE FROM saved_personas WHERE id = ? AND user_id = ?').run(id, userId);
}

export default getDb;
