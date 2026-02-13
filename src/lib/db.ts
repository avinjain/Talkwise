import Database from 'better-sqlite3';
import path from 'path';

const DB_DIR = process.env.DB_DIR || process.cwd();
const DB_PATH = path.join(DB_DIR, 'talkwise.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    // Foreign keys disabled — with JWT sessions, user_id may reference
    // rows that no longer exist after a DB rebuild on deploy. Data integrity
    // is enforced at the application layer instead.
    _db.pragma('foreign_keys = OFF');
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
      track TEXT DEFAULT 'professional',
      name TEXT NOT NULL,
      goal TEXT NOT NULL,
      scenario TEXT DEFAULT '',
      difficulty_level INTEGER DEFAULT 5,
      decision_orientation INTEGER DEFAULT 5,
      communication_style INTEGER DEFAULT 5,
      authority_posture INTEGER DEFAULT 5,
      temperament_stability INTEGER DEFAULT 5,
      social_presence INTEGER DEFAULT 5,
      interest_level INTEGER DEFAULT 5,
      flirtatiousness INTEGER DEFAULT 5,
      communication_effort INTEGER DEFAULT 5,
      emotional_openness INTEGER DEFAULT 5,
      humor_style INTEGER DEFAULT 5,
      pickiness INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS profile_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      conscientiousness REAL DEFAULT 0,
      emotional_stability REAL DEFAULT 0,
      agreeableness REAL DEFAULT 0,
      emotional_intelligence REAL DEFAULT 0,
      integrity REAL DEFAULT 0,
      assertiveness REAL DEFAULT 0,
      conflict_style REAL DEFAULT 0,
      stress_response REAL DEFAULT 0,
      motivation_orientation REAL DEFAULT 0,
      raw_answers TEXT DEFAULT '{}',
      user_context TEXT DEFAULT '{}',
      ai_feedback TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS saved_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      persona_config TEXT NOT NULL,
      messages TEXT NOT NULL DEFAULT '[]',
      title TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_personas_user ON saved_personas(user_id);
    CREATE INDEX IF NOT EXISTS idx_profile_user ON profile_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_convos_user ON saved_conversations(user_id);
  `);

  // ── Migration: add has_completed_onboarding to users ──
  try {
    const userCols = db.pragma('table_info(users)') as { name: string }[];
    const userColNames = new Set(userCols.map((c) => c.name));
    if (!userColNames.has('has_completed_onboarding')) {
      try {
        db.exec("ALTER TABLE users ADD COLUMN has_completed_onboarding INTEGER DEFAULT 0");
        console.log("Migration: added column 'has_completed_onboarding' to users");
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('duplicate column')) {
          console.error("Migration failed for column 'has_completed_onboarding':", err);
        }
      }
    }
  } catch (err) {
    console.error('Users migration check failed:', err);
  }

  // ── Migration: add new columns to existing saved_personas table ──
  try {
    const cols = db.pragma('table_info(saved_personas)') as { name: string }[];
    const colNames = new Set(cols.map((c) => c.name));

    const migrations: [string, string][] = [
      ['track',                "ALTER TABLE saved_personas ADD COLUMN track TEXT DEFAULT 'professional'"],
      ['interest_level',       'ALTER TABLE saved_personas ADD COLUMN interest_level INTEGER DEFAULT 5'],
      ['flirtatiousness',      'ALTER TABLE saved_personas ADD COLUMN flirtatiousness INTEGER DEFAULT 5'],
      ['communication_effort', 'ALTER TABLE saved_personas ADD COLUMN communication_effort INTEGER DEFAULT 5'],
      ['emotional_openness',   'ALTER TABLE saved_personas ADD COLUMN emotional_openness INTEGER DEFAULT 5'],
      ['humor_style',          'ALTER TABLE saved_personas ADD COLUMN humor_style INTEGER DEFAULT 5'],
      ['pickiness',            'ALTER TABLE saved_personas ADD COLUMN pickiness INTEGER DEFAULT 5'],
    ];

    for (const [col, sql] of migrations) {
      if (!colNames.has(col)) {
        try {
          db.exec(sql);
          console.log(`Migration: added column '${col}' to saved_personas`);
        } catch (err) {
          // Column might already exist (race condition); ignore "duplicate column" errors
          const msg = err instanceof Error ? err.message : '';
          if (!msg.includes('duplicate column')) {
            console.error(`Migration failed for column '${col}':`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('Migration check failed:', err);
  }

  // ── Migration: add new columns to existing profile_results table ──
  try {
    const prCols = db.pragma('table_info(profile_results)') as { name: string }[];
    const prColNames = new Set(prCols.map((c) => c.name));

    const prMigrations: [string, string][] = [
      ['user_context', "ALTER TABLE profile_results ADD COLUMN user_context TEXT DEFAULT '{}'"],
      ['ai_feedback', "ALTER TABLE profile_results ADD COLUMN ai_feedback TEXT DEFAULT ''"],
      ['conscientiousness', 'ALTER TABLE profile_results ADD COLUMN conscientiousness REAL DEFAULT 0'],
      ['emotional_stability', 'ALTER TABLE profile_results ADD COLUMN emotional_stability REAL DEFAULT 0'],
      ['agreeableness', 'ALTER TABLE profile_results ADD COLUMN agreeableness REAL DEFAULT 0'],
      ['integrity', 'ALTER TABLE profile_results ADD COLUMN integrity REAL DEFAULT 0'],
      ['conflict_style', 'ALTER TABLE profile_results ADD COLUMN conflict_style REAL DEFAULT 0'],
      ['stress_response', 'ALTER TABLE profile_results ADD COLUMN stress_response REAL DEFAULT 0'],
      ['motivation_orientation', 'ALTER TABLE profile_results ADD COLUMN motivation_orientation REAL DEFAULT 0'],
    ];

    for (const [col, sql] of prMigrations) {
      if (!prColNames.has(col)) {
        try {
          db.exec(sql);
          console.log(`Migration: added column '${col}' to profile_results`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (!msg.includes('duplicate column')) {
            console.error(`Migration failed for column '${col}':`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('Profile migration check failed:', err);
  }
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

export function updateUserPassword(email: string, newPasswordHash: string) {
  const db = getDb();
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(newPasswordHash, email);
}

export function getUserById(id: string) {
  const db = getDb();
  return db.prepare('SELECT id, email, name, has_completed_onboarding, created_at FROM users WHERE id = ?').get(id) as
    | { id: string; email: string; name: string; has_completed_onboarding: number; created_at: string }
    | undefined;
}

export function getOnboardingStatus(userId: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT has_completed_onboarding FROM users WHERE id = ?').get(userId) as
    | { has_completed_onboarding: number }
    | undefined;
  return row?.has_completed_onboarding === 1;
}

export function completeOnboarding(userId: string) {
  const db = getDb();
  db.prepare('UPDATE users SET has_completed_onboarding = 1 WHERE id = ?').run(userId);
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
  track: string;
  name: string;
  goal: string;
  scenario: string;
  difficulty_level: number;
  decision_orientation: number;
  communication_style: number;
  authority_posture: number;
  temperament_stability: number;
  social_presence: number;
  interest_level: number;
  flirtatiousness: number;
  communication_effort: number;
  emotional_openness: number;
  humor_style: number;
  pickiness: number;
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
    `INSERT INTO saved_personas (id, user_id, track, name, goal, scenario, difficulty_level, decision_orientation, communication_style, authority_posture, temperament_stability, social_presence, interest_level, flirtatiousness, communication_effort, emotional_openness, humor_style, pickiness)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    persona.id,
    persona.user_id,
    persona.track || 'professional',
    persona.name,
    persona.goal,
    persona.scenario,
    persona.difficulty_level,
    persona.decision_orientation,
    persona.communication_style,
    persona.authority_posture,
    persona.temperament_stability,
    persona.social_presence,
    persona.interest_level,
    persona.flirtatiousness,
    persona.communication_effort,
    persona.emotional_openness,
    persona.humor_style,
    persona.pickiness
  );
}

export function updatePersona(id: string, userId: string, updates: Partial<Omit<SavedPersonaRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.goal !== undefined) { fields.push('goal = ?'); values.push(updates.goal); }
  if (updates.scenario !== undefined) { fields.push('scenario = ?'); values.push(updates.scenario); }
  if (updates.track !== undefined) { fields.push('track = ?'); values.push(updates.track); }
  if (updates.difficulty_level !== undefined) { fields.push('difficulty_level = ?'); values.push(updates.difficulty_level); }
  if (updates.decision_orientation !== undefined) { fields.push('decision_orientation = ?'); values.push(updates.decision_orientation); }
  if (updates.communication_style !== undefined) { fields.push('communication_style = ?'); values.push(updates.communication_style); }
  if (updates.authority_posture !== undefined) { fields.push('authority_posture = ?'); values.push(updates.authority_posture); }
  if (updates.temperament_stability !== undefined) { fields.push('temperament_stability = ?'); values.push(updates.temperament_stability); }
  if (updates.social_presence !== undefined) { fields.push('social_presence = ?'); values.push(updates.social_presence); }
  if (updates.interest_level !== undefined) { fields.push('interest_level = ?'); values.push(updates.interest_level); }
  if (updates.flirtatiousness !== undefined) { fields.push('flirtatiousness = ?'); values.push(updates.flirtatiousness); }
  if (updates.communication_effort !== undefined) { fields.push('communication_effort = ?'); values.push(updates.communication_effort); }
  if (updates.emotional_openness !== undefined) { fields.push('emotional_openness = ?'); values.push(updates.emotional_openness); }
  if (updates.humor_style !== undefined) { fields.push('humor_style = ?'); values.push(updates.humor_style); }
  if (updates.pickiness !== undefined) { fields.push('pickiness = ?'); values.push(updates.pickiness); }

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

// ── Profile Results ──

export interface ProfileResultRow {
  id: string;
  user_id: string;
  conscientiousness: number;
  emotional_stability: number;
  agreeableness: number;
  emotional_intelligence: number;
  integrity: number;
  assertiveness: number;
  conflict_style: number;
  stress_response: number;
  motivation_orientation: number;
  raw_answers: string;
  user_context: string;
  ai_feedback: string;
  created_at: string;
  updated_at: string;
}

export function getProfileResult(userId: string): ProfileResultRow | undefined {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM profile_results WHERE user_id = ?'
  ).get(userId) as ProfileResultRow | undefined;
}

export function saveProfileResult(
  userId: string,
  scores: {
    conscientiousness: number;
    emotionalStability: number;
    agreeableness: number;
    emotionalIntelligence: number;
    integrity: number;
    assertiveness: number;
    conflictStyle: number;
    stressResponse: number;
    motivationOrientation: number;
  },
  rawAnswers: Record<number, number>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userContext: Record<string, any>,
  aiFeedback: string
) {
  const db = getDb();
  const existing = getProfileResult(userId);

  if (existing) {
    db.prepare(
      `UPDATE profile_results SET
        conscientiousness = ?, emotional_stability = ?, agreeableness = ?,
        emotional_intelligence = ?, integrity = ?, assertiveness = ?,
        conflict_style = ?, stress_response = ?, motivation_orientation = ?,
        raw_answers = ?, user_context = ?, ai_feedback = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(
      scores.conscientiousness, scores.emotionalStability, scores.agreeableness,
      scores.emotionalIntelligence, scores.integrity, scores.assertiveness,
      scores.conflictStyle, scores.stressResponse, scores.motivationOrientation,
      JSON.stringify(rawAnswers), JSON.stringify(userContext), aiFeedback, userId
    );
  } else {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO profile_results (id, user_id, conscientiousness, emotional_stability, agreeableness, emotional_intelligence, integrity, assertiveness, conflict_style, stress_response, motivation_orientation, raw_answers, user_context, ai_feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, userId,
      scores.conscientiousness, scores.emotionalStability, scores.agreeableness,
      scores.emotionalIntelligence, scores.integrity, scores.assertiveness,
      scores.conflictStyle, scores.stressResponse, scores.motivationOrientation,
      JSON.stringify(rawAnswers), JSON.stringify(userContext), aiFeedback
    );
  }
}

export default getDb;
