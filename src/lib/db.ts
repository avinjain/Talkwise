import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { adminWindowChartDays, adminWindowWhere, type AdminWindow } from './adminWindow';

// Prefer Railway volume mount path when available (persistent storage)
const DB_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DB_DIR || process.cwd();
const DB_PATH = path.join(DB_DIR, 'talkwise.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    let dbPath = DB_PATH;
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (err) {
      console.warn('[db] Could not create DB_DIR:', err);
    }
    try {
      _db = new Database(DB_PATH);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('unable to open') && DB_DIR !== process.cwd()) {
        dbPath = path.join(process.cwd(), 'talkwise.db');
        console.warn('[db] Fallback: using', dbPath, '(', DB_DIR, 'not writable; add Railway volume at /data or set RAILWAY_RUN_UID=0)');
        _db = new Database(dbPath);
      } else {
        throw err;
      }
    }
    if (process.env.NODE_ENV !== 'test') {
      console.log('[db] SQLite at', dbPath);
    }
    _db.pragma('journal_mode = WAL');
    // Foreign keys disabled — with JWT sessions, user_id may reference
    // rows that no longer exist after a DB rebuild on deploy. Data integrity
    // is enforced at the application layer instead.
    _db.pragma('foreign_keys = OFF');
    try {
      initTables(_db);
    } catch (err) {
      _db.close();
      _db = null;
      throw err;
    }
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

    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS saved_personas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      track TEXT DEFAULT 'professional',
      name TEXT NOT NULL,
      designation TEXT DEFAULT '',
      life_context TEXT DEFAULT 'dating',
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

    CREATE TABLE IF NOT EXISTS mbti_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dimension TEXT NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      question_order INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mbti_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type_result TEXT NOT NULL,
      raw_answers TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_usage_user_created ON usage_logs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_login_user ON login_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_created ON login_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_personas_user ON saved_personas(user_id);
    CREATE INDEX IF NOT EXISTS idx_profile_user ON profile_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_convos_user ON saved_conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_mbti_results_user ON mbti_results(user_id);

    CREATE TABLE IF NOT EXISTS kickoff_states (
      user_id TEXT PRIMARY KEY,
      track TEXT NOT NULL,
      target_roles TEXT NOT NULL,
      timeline TEXT NOT NULL,
      feedback_directness INTEGER DEFAULT 5,
      biggest_concern TEXT DEFAULT '',
      interview_history TEXT NOT NULL,
      stalling_stage TEXT DEFAULT '',
      resume_text TEXT DEFAULT '',
      linkedin_text TEXT DEFAULT '',
      target_companies TEXT DEFAULT '[]',
      summary_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_kickoff_user ON kickoff_states(user_id);

    CREATE TABLE IF NOT EXISTS coach_artifacts (
      user_id TEXT NOT NULL,
      command TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, command),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_coach_user ON coach_artifacts(user_id);

    CREATE TABLE IF NOT EXISTS practice_coaching_focus (
      user_id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_practice_coaching_user ON practice_coaching_focus(user_id);

    CREATE TABLE IF NOT EXISTS interview_stories (
      user_id TEXT PRIMARY KEY,
      pitches_json TEXT NOT NULL DEFAULT '[]',
      workflow_stories_ack INTEGER NOT NULL DEFAULT 0,
      story_drafts_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_interview_stories_user ON interview_stories(user_id);

    CREATE TABLE IF NOT EXISTS storybank_stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      primary_skill TEXT NOT NULL DEFAULT '',
      secondary_skills TEXT NOT NULL DEFAULT '[]',
      situation TEXT NOT NULL DEFAULT '',
      task TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL DEFAULT '',
      earned_secret TEXT NOT NULL DEFAULT '',
      deploy_use_case TEXT NOT NULL DEFAULT '',
      spoken_draft TEXT NOT NULL DEFAULT '',
      strength INTEGER NOT NULL DEFAULT 0,
      scores_json TEXT NOT NULL DEFAULT '{}',
      version_history TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_storybank_user ON storybank_stories(user_id);

    CREATE TABLE IF NOT EXISTS interview_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      tag TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_interview_notes_user ON interview_notes(user_id);

    CREATE TABLE IF NOT EXISTS profile_result_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
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
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_profile_attempts_user ON profile_result_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_profile_attempts_created ON profile_result_attempts(created_at);
  `);

  // ── Migration: migrate profile_results to profile_result_attempts ──
  try {
    const count = db.prepare('SELECT COUNT(*) as c FROM profile_result_attempts').get() as { c: number };
    if (count.c === 0) {
      try {
        db.exec(`
          INSERT INTO profile_result_attempts (id, user_id, conscientiousness, emotional_stability, agreeableness, emotional_intelligence, integrity, assertiveness, conflict_style, stress_response, motivation_orientation, raw_answers, user_context, ai_feedback, created_at)
          SELECT id, user_id, conscientiousness, emotional_stability, agreeableness, emotional_intelligence, integrity, assertiveness, conflict_style, stress_response, motivation_orientation, raw_answers, user_context, ai_feedback, COALESCE(updated_at, created_at)
          FROM profile_results
        `);
        console.log('Migration: migrated profile_results to profile_result_attempts');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('no such table')) console.error('Profile migration:', err);
      }
    }
  } catch (err) {
    console.error('Profile attempts migration check failed:', err);
  }

  // ── Migration: add questions_snapshot to mbti_results ──
  try {
    const mbtiCols = db.pragma('table_info(mbti_results)') as { name: string }[];
    const mbtiColNames = new Set(mbtiCols.map((c) => c.name));
    if (!mbtiColNames.has('questions_snapshot')) {
      try {
        db.exec("ALTER TABLE mbti_results ADD COLUMN questions_snapshot TEXT DEFAULT '[]'");
        console.log("Migration: added column 'questions_snapshot' to mbti_results");
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('duplicate column')) {
          console.error("Migration failed for column 'questions_snapshot':", err);
        }
      }
    }
  } catch (err) {
    console.error('MBTI results migration check failed:', err);
  }

  // ── Migration: scope mbti_questions per user (was global) ──
  try {
    const mbtiQCols = db.pragma('table_info(mbti_questions)') as { name: string }[];
    const mbtiQColNames = new Set(mbtiQCols.map((c) => c.name));
    if (!mbtiQColNames.has('user_id')) {
      try {
        db.exec('ALTER TABLE mbti_questions ADD COLUMN user_id TEXT');
        // Legacy global rows cannot be attributed — drop them so users regenerate per-account.
        db.exec('DELETE FROM mbti_questions WHERE user_id IS NULL');
        console.log("Migration: added column 'user_id' to mbti_questions (cleared legacy global rows)");
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('duplicate column')) {
          console.error("Migration failed for column 'user_id' on mbti_questions:", err);
        }
      }
    }
    // Index must be created after user_id column exists (legacy DBs lack it in CREATE TABLE).
    const mbtiQColsAfter = db.pragma('table_info(mbti_questions)') as { name: string }[];
    if (mbtiQColsAfter.some((c) => c.name === 'user_id')) {
      db.exec('CREATE INDEX IF NOT EXISTS idx_mbti_questions_user ON mbti_questions(user_id)');
    }
  } catch (err) {
    console.error('MBTI questions migration check failed:', err);
  }

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
    if (!userColNames.has('last_login_at')) {
      try {
        db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT');
        console.log("Migration: added column 'last_login_at' to users");
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('duplicate column')) {
          console.error("Migration failed for column 'last_login_at':", err);
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
      ['designation',          "ALTER TABLE saved_personas ADD COLUMN designation TEXT DEFAULT ''"],
      ['life_context',         "ALTER TABLE saved_personas ADD COLUMN life_context TEXT DEFAULT 'dating'"],
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

  // ── Migration: story_drafts_json on interview_stories ──
  try {
    const isCols = db.pragma('table_info(interview_stories)') as { name: string }[];
    const isColNames = new Set(isCols.map((c) => c.name));
    if (!isColNames.has('story_drafts_json')) {
      try {
        db.exec(
          "ALTER TABLE interview_stories ADD COLUMN story_drafts_json TEXT NOT NULL DEFAULT '[]'"
        );
        console.log("Migration: added column 'story_drafts_json' to interview_stories");
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('duplicate column')) {
          console.error("Migration failed for column 'story_drafts_json':", err);
        }
      }
    }
  } catch (err) {
    console.error('interview_stories migration check failed:', err);
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

// ── Admin analytics (usage tracking dashboard) ──

export interface UsageTotals {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  tokens: number;
  cost: number;
}

export interface AdminOverview extends UsageTotals {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  usersWithConversations: number;
  logins: number;
  uniqueLogins: number;
}

export interface UsageByUserRow {
  userId: string;
  email: string;
  name: string;
  requests: number;
  tokens: number;
  cost: number;
  conversations: number;
  logins: number;
  lastActive: string | null;
  lastLogin: string | null;
}

export interface UsageBreakdownRow {
  key: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface UsageDayRow {
  day: string;
  requests: number;
  tokens: number;
  cost: number;
}

const ZERO_TOTALS: UsageTotals = {
  requests: 0,
  promptTokens: 0,
  completionTokens: 0,
  tokens: 0,
  cost: 0,
};

function adminWhereClause(window: AdminWindow, column = 'created_at'): string {
  return window === 'all' ? '' : `WHERE ${adminWindowWhere(column, window)}`;
}

/** Aggregate usage for an admin time window. */
export function getUsageTotals(window: AdminWindow = 'all'): UsageTotals {
  const db = getDb();
  const where = adminWhereClause(window);
  const row = db
    .prepare(
      `SELECT COUNT(*) AS requests,
              COALESCE(SUM(prompt_tokens), 0) AS promptTokens,
              COALESCE(SUM(completion_tokens), 0) AS completionTokens,
              COALESCE(SUM(total_tokens), 0) AS tokens,
              COALESCE(SUM(estimated_cost), 0) AS cost
       FROM usage_logs ${where}`
    )
    .get() as UsageTotals | undefined;
  return row ?? { ...ZERO_TOTALS };
}

/** Spend + tokens for the current calendar month (used for budget tracking). */
export function getUsageThisMonth(): UsageTotals {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS requests,
              COALESCE(SUM(prompt_tokens), 0) AS promptTokens,
              COALESCE(SUM(completion_tokens), 0) AS completionTokens,
              COALESCE(SUM(total_tokens), 0) AS tokens,
              COALESCE(SUM(estimated_cost), 0) AS cost
       FROM usage_logs
       WHERE created_at >= datetime('now', 'start of month')`
    )
    .get() as UsageTotals | undefined;
  return row ?? { ...ZERO_TOTALS };
}

export function logLogin(userId: string, email: string) {
  const db = getDb();
  const normalized = email.toLowerCase().trim();
  try {
    db.prepare('INSERT INTO login_logs (user_id, email) VALUES (?, ?)').run(userId, normalized);
  } catch (err) {
    console.error('[db] login_logs insert failed:', err);
  }
  try {
    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(userId);
  } catch (err) {
    console.error('[db] last_login_at update failed:', err);
  }
}

export function getLoginStats(window: AdminWindow = 'all'): { logins: number; uniqueUsers: number } {
  const db = getDb();
  const where = adminWhereClause(window);
  const row = db
    .prepare(
      `SELECT COUNT(*) AS logins, COUNT(DISTINCT user_id) AS uniqueUsers FROM login_logs ${where}`
    )
    .get() as { logins: number; uniqueUsers: number };
  return row ?? { logins: 0, uniqueUsers: 0 };
}

function countSessions(window: AdminWindow = 'all'): number {
  const db = getDb();
  const where = adminWhereClause(window);
  return (db.prepare(`SELECT COUNT(*) AS c FROM sessions ${where}`).get() as { c: number }).c;
}

function countActiveUsers(window: AdminWindow = 'all'): number {
  const db = getDb();
  const where = adminWhereClause(window);
  return (
    db.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM usage_logs ${where}`).get() as { c: number }
  ).c;
}

function countUsersWithSessions(window: AdminWindow = 'all'): number {
  const db = getDb();
  const where = adminWhereClause(window);
  return (
    db.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM sessions ${where}`).get() as { c: number }
  ).c;
}

export function getAdminOverview(window: AdminWindow = 'all'): AdminOverview {
  const db = getDb();
  const usage = getUsageTotals(window);
  const totalUsers = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
  const loginStats = getLoginStats(window);
  return {
    ...usage,
    totalUsers,
    activeUsers: countActiveUsers(window),
    totalConversations: countSessions(window),
    usersWithConversations: countUsersWithSessions(window),
    logins: loginStats.logins,
    uniqueLogins: loginStats.uniqueUsers,
  };
}

export function getUsageByUser(window: AdminWindow = 'all'): UsageByUserRow[] {
  const db = getDb();
  const usageFilter = window === 'all' ? '1=1' : adminWindowWhere('l.created_at', window);
  const loginFilter = window === 'all' ? '1=1' : adminWindowWhere('ll.created_at', window);
  const sessionFilter = window === 'all' ? '1=1' : adminWindowWhere('s.created_at', window);
  const userWindowFilter =
    window === 'all'
      ? '1=1'
      : `(EXISTS (SELECT 1 FROM login_logs ll WHERE ll.user_id = u.id AND ${loginFilter})
          OR EXISTS (SELECT 1 FROM usage_logs l WHERE l.user_id = u.id AND ${usageFilter})
          OR (u.last_login_at IS NOT NULL AND ${adminWindowWhere('u.last_login_at', window)}))`;

  return db
    .prepare(
      `SELECT u.id AS userId,
              u.email AS email,
              u.name AS name,
              (SELECT COUNT(*) FROM usage_logs l WHERE l.user_id = u.id AND (${usageFilter})) AS requests,
              (SELECT COALESCE(SUM(l.total_tokens), 0) FROM usage_logs l WHERE l.user_id = u.id AND (${usageFilter})) AS tokens,
              (SELECT COALESCE(SUM(l.estimated_cost), 0) FROM usage_logs l WHERE l.user_id = u.id AND (${usageFilter})) AS cost,
              (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND (${sessionFilter})) AS conversations,
              (SELECT COUNT(*) FROM login_logs ll WHERE ll.user_id = u.id AND (${loginFilter})) AS logins,
              (SELECT MAX(l.created_at) FROM usage_logs l WHERE l.user_id = u.id AND (${usageFilter})) AS lastActive,
              COALESCE(
                (SELECT MAX(ll2.created_at) FROM login_logs ll2 WHERE ll2.user_id = u.id),
                u.last_login_at
              ) AS lastLogin
       FROM users u
       WHERE ${userWindowFilter}
       ORDER BY COALESCE(lastLogin, lastActive, u.created_at) DESC, cost DESC, logins DESC`
    )
    .all() as UsageByUserRow[];
}

export function getUsageByModel(window: AdminWindow = 'all'): UsageBreakdownRow[] {
  const db = getDb();
  const where = adminWhereClause(window);
  return db
    .prepare(
      `SELECT model AS key,
              COUNT(*) AS requests,
              COALESCE(SUM(total_tokens), 0) AS tokens,
              COALESCE(SUM(estimated_cost), 0) AS cost
       FROM usage_logs
       ${where}
       GROUP BY model
       ORDER BY cost DESC`
    )
    .all() as UsageBreakdownRow[];
}

export function getUsageByEndpoint(window: AdminWindow = 'all'): UsageBreakdownRow[] {
  const db = getDb();
  const where = adminWhereClause(window);
  return db
    .prepare(
      `SELECT endpoint AS key,
              COUNT(*) AS requests,
              COALESCE(SUM(total_tokens), 0) AS tokens,
              COALESCE(SUM(estimated_cost), 0) AS cost
       FROM usage_logs
       ${where}
       GROUP BY endpoint
       ORDER BY cost DESC`
    )
    .all() as UsageBreakdownRow[];
}

export function getUsageByDay(window: AdminWindow = '30d'): UsageDayRow[] {
  const db = getDb();
  const chartDays = adminWindowChartDays(window);
  const where = window === 'all' ? '' : `WHERE ${adminWindowWhere('created_at', window)}`;

  const rows = db
    .prepare(
      `SELECT date(created_at) AS day,
              COUNT(*) AS requests,
              COALESCE(SUM(total_tokens), 0) AS tokens,
              COALESCE(SUM(estimated_cost), 0) AS cost
       FROM usage_logs
       ${where}
       GROUP BY day
       ORDER BY day ASC`
    )
    .all() as UsageDayRow[];

  if (window === 'all') {
    // All-time: show every day that has usage (cap at 90 most recent for readability).
    if (rows.length > 90) return rows.slice(-90);
    return rows;
  }

  return fillUsageDayBuckets(db, rows, chartDays);
}

/** Pad a fixed window with zero-cost days so the chart always renders the full range. */
function fillUsageDayBuckets(
  db: Database.Database,
  rows: UsageDayRow[],
  days: number
): UsageDayRow[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const n = Math.max(1, Math.min(180, Math.floor(days)));
  const result: UsageDayRow[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const { d: day } = db.prepare(`SELECT date('now', '-${i} days') AS d`).get() as { d: string };
    result.push(byDay.get(day) ?? { day, requests: 0, tokens: 0, cost: 0 });
  }
  return result;
}

// ── Kickoff state ──

export interface KickoffStateRow {
  user_id: string;
  track: string;
  target_roles: string;
  timeline: string;
  feedback_directness: number;
  biggest_concern: string;
  interview_history: string;
  stalling_stage: string;
  resume_text: string;
  linkedin_text: string;
  target_companies: string;
  summary_json: string;
  created_at: string;
  updated_at: string;
}

export interface SaveKickoffInput {
  userId: string;
  track: string;
  targetRoles: string;
  timeline: string;
  feedbackDirectness: number;
  biggestConcern: string;
  interviewHistory: string;
  stallingStage?: string;
  resumeText?: string;
  linkedInText?: string;
  targetCompanies?: string[];
  summary: unknown;
}

export function saveKickoffState(input: SaveKickoffInput) {
  const db = getDb();
  db.prepare(
    `INSERT INTO kickoff_states
       (user_id, track, target_roles, timeline, feedback_directness, biggest_concern,
        interview_history, stalling_stage, resume_text, linkedin_text, target_companies,
        summary_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       track = excluded.track,
       target_roles = excluded.target_roles,
       timeline = excluded.timeline,
       feedback_directness = excluded.feedback_directness,
       biggest_concern = excluded.biggest_concern,
       interview_history = excluded.interview_history,
       stalling_stage = excluded.stalling_stage,
       resume_text = excluded.resume_text,
       linkedin_text = excluded.linkedin_text,
       target_companies = excluded.target_companies,
       summary_json = excluded.summary_json,
       updated_at = datetime('now')`
  ).run(
    input.userId,
    input.track,
    input.targetRoles,
    input.timeline,
    input.feedbackDirectness,
    input.biggestConcern || '',
    input.interviewHistory,
    input.stallingStage || '',
    input.resumeText || '',
    input.linkedInText || '',
    JSON.stringify(input.targetCompanies || []),
    JSON.stringify(input.summary)
  );
}

export function getKickoffState(userId: string): KickoffStateRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM kickoff_states WHERE user_id = ?').get(userId) as
    | KickoffStateRow
    | undefined;
}

export function deleteKickoffState(userId: string) {
  const db = getDb();
  db.prepare('DELETE FROM kickoff_states WHERE user_id = ?').run(userId);
}

// ── Coach artifacts (prep / concerns / questions) ──

export interface CoachArtifactRow {
  user_id: string;
  command: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
}

export function saveCoachArtifact(userId: string, command: string, payload: unknown) {
  const db = getDb();
  db.prepare(
    `INSERT INTO coach_artifacts (user_id, command, payload_json, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, command) DO UPDATE SET
       payload_json = excluded.payload_json,
       updated_at = datetime('now')`
  ).run(userId, command, JSON.stringify(payload));
}

export function getCoachArtifact(userId: string, command: string): CoachArtifactRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM coach_artifacts WHERE user_id = ? AND command = ?')
    .get(userId, command) as CoachArtifactRow | undefined;
}

export function getAllCoachArtifacts(userId: string): CoachArtifactRow[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM coach_artifacts WHERE user_id = ?')
    .all(userId) as CoachArtifactRow[];
}

export function deleteCoachArtifact(userId: string, command: string) {
  const db = getDb();
  db.prepare('DELETE FROM coach_artifacts WHERE user_id = ? AND command = ?').run(userId, command);
}

// ── Practice coaching focus (kickoff Go → persisted lens for chat / feedback) ──

export interface PracticeCoachingFocusRow {
  user_id: string;
  payload_json: string;
  updated_at: string;
}

export function savePracticeCoachingFocus(userId: string, payload: unknown) {
  const db = getDb();
  db.prepare(
    `INSERT INTO practice_coaching_focus (user_id, payload_json, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       payload_json = excluded.payload_json,
       updated_at = datetime('now')`
  ).run(userId, JSON.stringify(payload));
}

export function getPracticeCoachingFocus(userId: string): PracticeCoachingFocusRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM practice_coaching_focus WHERE user_id = ?')
    .get(userId) as PracticeCoachingFocusRow | undefined;
}

export function deletePracticeCoachingFocus(userId: string) {
  const db = getDb();
  db.prepare('DELETE FROM practice_coaching_focus WHERE user_id = ?').run(userId);
}

// ── Interview speaking points / stories (resume workflow persistence) ──

export interface SpeakingPitchPersisted {
  name: string;
  hook?: string;
  bullets?: string[];
}

export interface StoryDraftPersisted {
  prompt: string;
  draft: string;
}

export interface InterviewStoriesRow {
  user_id: string;
  pitches_json: string;
  workflow_stories_ack: number;
  story_drafts_json?: string;
  updated_at: string;
}

/** Merge-update saved speaking points + optional story drafts for one user (partial updates OK). */
export function upsertInterviewStories(
  userId: string,
  patch: {
    pitches?: SpeakingPitchPersisted[];
    workflowStoriesAck?: boolean;
    storyDrafts?: StoryDraftPersisted[];
  }
) {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM interview_stories WHERE user_id = ?')
    .get(userId) as InterviewStoriesRow | undefined;

  let pitches: SpeakingPitchPersisted[] = [];
  if (patch.pitches !== undefined) {
    pitches = patch.pitches;
  } else if (row?.pitches_json) {
    try {
      const parsed = JSON.parse(row.pitches_json) as unknown;
      pitches = Array.isArray(parsed)
        ? parsed.filter((p) => p && typeof (p as SpeakingPitchPersisted).name === 'string')
        : [];
    } catch {
      pitches = [];
    }
  }

  let workflowStoriesAck = row?.workflow_stories_ack ?? 0;
  if (patch.workflowStoriesAck === true) workflowStoriesAck = 1;
  if (patch.workflowStoriesAck === false) workflowStoriesAck = 0;

  let storyDraftsJson = '[]';
  if (patch.storyDrafts !== undefined) {
    storyDraftsJson = JSON.stringify(patch.storyDrafts);
  } else if (row && typeof row.story_drafts_json === 'string' && row.story_drafts_json.length > 0) {
    storyDraftsJson = row.story_drafts_json;
  }

  db.prepare(
    `INSERT INTO interview_stories (user_id, pitches_json, workflow_stories_ack, story_drafts_json, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       pitches_json = excluded.pitches_json,
       workflow_stories_ack = excluded.workflow_stories_ack,
       story_drafts_json = excluded.story_drafts_json,
       updated_at = datetime('now')`
  ).run(userId, JSON.stringify(pitches), workflowStoriesAck, storyDraftsJson);
}

export function getInterviewStories(userId: string): InterviewStoriesRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM interview_stories WHERE user_id = ?').get(userId) as
    | InterviewStoriesRow
    | undefined;
}

export function deleteInterviewStories(userId: string) {
  const db = getDb();
  db.prepare('DELETE FROM interview_stories WHERE user_id = ?').run(userId);
}

// ── Storybank (full STAR story records — interview-coach-skill `stories`) ──

export interface StorybankStoryRow {
  id: string;
  user_id: string;
  title: string;
  primary_skill: string;
  secondary_skills: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  earned_secret: string;
  deploy_use_case: string;
  spoken_draft: string;
  strength: number;
  scores_json: string;
  version_history: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StorybankStoryInput {
  title: string;
  primarySkill?: string;
  secondarySkills?: string[];
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  earnedSecret?: string;
  deployUseCase?: string;
  spokenDraft?: string;
  strength?: number;
  scores?: unknown;
  versionHistory?: Array<{ date: string; note: string }>;
  notes?: string;
}

export function listStorybankStories(userId: string): StorybankStoryRow[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM storybank_stories WHERE user_id = ? ORDER BY updated_at DESC')
    .all(userId) as StorybankStoryRow[];
}

export function getStorybankStory(id: string, userId: string): StorybankStoryRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM storybank_stories WHERE id = ? AND user_id = ?')
    .get(id, userId) as StorybankStoryRow | undefined;
}

export function insertStorybankStory(userId: string, input: StorybankStoryInput): string {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO storybank_stories
       (id, user_id, title, primary_skill, secondary_skills, situation, task, action, result,
        earned_secret, deploy_use_case, spoken_draft, strength, scores_json, version_history, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.title,
    input.primarySkill || '',
    JSON.stringify(input.secondarySkills || []),
    input.situation || '',
    input.task || '',
    input.action || '',
    input.result || '',
    input.earnedSecret || '',
    input.deployUseCase || '',
    input.spokenDraft || '',
    input.strength ?? 0,
    JSON.stringify(input.scores ?? {}),
    JSON.stringify(input.versionHistory || []),
    input.notes || ''
  );
  return id;
}

export function updateStorybankStory(
  id: string,
  userId: string,
  updates: Partial<StorybankStoryInput>
) {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  const push = (col: string, val: string | number) => {
    fields.push(`${col} = ?`);
    values.push(val);
  };

  if (updates.title !== undefined) push('title', updates.title);
  if (updates.primarySkill !== undefined) push('primary_skill', updates.primarySkill);
  if (updates.secondarySkills !== undefined) push('secondary_skills', JSON.stringify(updates.secondarySkills));
  if (updates.situation !== undefined) push('situation', updates.situation);
  if (updates.task !== undefined) push('task', updates.task);
  if (updates.action !== undefined) push('action', updates.action);
  if (updates.result !== undefined) push('result', updates.result);
  if (updates.earnedSecret !== undefined) push('earned_secret', updates.earnedSecret);
  if (updates.deployUseCase !== undefined) push('deploy_use_case', updates.deployUseCase);
  if (updates.spokenDraft !== undefined) push('spoken_draft', updates.spokenDraft);
  if (updates.strength !== undefined) push('strength', updates.strength);
  if (updates.scores !== undefined) push('scores_json', JSON.stringify(updates.scores));
  if (updates.versionHistory !== undefined) push('version_history', JSON.stringify(updates.versionHistory));
  if (updates.notes !== undefined) push('notes', updates.notes);

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id, userId);

  db.prepare(
    `UPDATE storybank_stories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  ).run(...values);
}

export function deleteStorybankStory(id: string, userId: string) {
  const db = getDb();
  db.prepare('DELETE FROM storybank_stories WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Interview notes (free-form notes the candidate makes during prep) ──

export interface InterviewNoteRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tag: string;
  created_at: string;
  updated_at: string;
}

export function listInterviewNotes(userId: string): InterviewNoteRow[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM interview_notes WHERE user_id = ? ORDER BY updated_at DESC')
    .all(userId) as InterviewNoteRow[];
}

export function insertInterviewNote(
  userId: string,
  note: { title: string; body: string; tag?: string }
): string {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO interview_notes (id, user_id, title, body, tag) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, note.title, note.body, note.tag || '');
  return id;
}

export function updateInterviewNote(
  id: string,
  userId: string,
  updates: { title?: string; body?: string; tag?: string }
) {
  const db = getDb();
  const fields: string[] = [];
  const values: string[] = [];
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.body !== undefined) { fields.push('body = ?'); values.push(updates.body); }
  if (updates.tag !== undefined) { fields.push('tag = ?'); values.push(updates.tag); }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id, userId);
  db.prepare(
    `UPDATE interview_notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  ).run(...values);
}

export function deleteInterviewNote(id: string, userId: string) {
  const db = getDb();
  db.prepare('DELETE FROM interview_notes WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Saved Personas ──

export interface SavedPersonaRow {
  id: string;
  user_id: string;
  track: string;
  name: string;
  designation?: string;
  life_context?: string;
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
    `INSERT INTO saved_personas (id, user_id, track, name, designation, life_context, goal, scenario, difficulty_level, decision_orientation, communication_style, authority_posture, temperament_stability, social_presence, interest_level, flirtatiousness, communication_effort, emotional_openness, humor_style, pickiness)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    persona.id,
    persona.user_id,
    persona.track || 'professional',
    persona.name,
    persona.designation ?? '',
    persona.life_context ?? 'dating',
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
  if (updates.designation !== undefined) { fields.push('designation = ?'); values.push(updates.designation); }
  if (updates.life_context !== undefined) { fields.push('life_context = ?'); values.push(updates.life_context); }
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

const PROFILE_RESULTS_LIMIT = 3;

export function getProfileResult(userId: string): ProfileResultRow | undefined {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM profile_result_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId) as ProfileResultRow | undefined;
  if (row) {
    (row as { updated_at?: string }).updated_at = row.created_at;
  }
  return row;
}

export function getProfileResults(userId: string, limit = PROFILE_RESULTS_LIMIT): ProfileResultRow[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM profile_result_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit) as ProfileResultRow[];
  rows.forEach((r) => { (r as { updated_at?: string }).updated_at = r.created_at; });
  return rows;
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
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO profile_result_attempts (id, user_id, conscientiousness, emotional_stability, agreeableness, emotional_intelligence, integrity, assertiveness, conflict_style, stress_response, motivation_orientation, raw_answers, user_context, ai_feedback)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, userId,
    scores.conscientiousness, scores.emotionalStability, scores.agreeableness,
    scores.emotionalIntelligence, scores.integrity, scores.assertiveness,
    scores.conflictStyle, scores.stressResponse, scores.motivationOrientation,
    JSON.stringify(rawAnswers), JSON.stringify(userContext), aiFeedback
  );
  // Prune to keep only last 3
  const toKeep = db.prepare(
    'SELECT id FROM profile_result_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, PROFILE_RESULTS_LIMIT) as { id: string }[];
  if (toKeep.length >= PROFILE_RESULTS_LIMIT) {
    const ids = toKeep.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(
      `DELETE FROM profile_result_attempts WHERE user_id = ? AND id NOT IN (${placeholders})`
    ).run(userId, ...ids);
  }
}

// ── MBTI Questions & Results ──

export interface MBTIQuestionRow {
  id: string;
  user_id: string;
  dimension: string;
  question_text: string;
  option_a: string;
  option_b: string;
  question_order: number;
}

export function getMBTIQuestions(userId: string): MBTIQuestionRow[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM mbti_questions WHERE user_id = ? ORDER BY question_order ASC, id ASC'
  ).all(userId) as MBTIQuestionRow[];
}

export function insertMBTIQuestions(
  userId: string,
  questions: Array<{
    id: string;
    dimension: string;
    question_text: string;
    option_a: string;
    option_b: string;
    question_order: number;
  }>
) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO mbti_questions (id, user_id, dimension, question_text, option_a, option_b, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const q of questions) {
    stmt.run(q.id, userId, q.dimension, q.question_text, q.option_a, q.option_b, q.question_order);
  }
}

export function clearMBTIQuestions(userId: string) {
  const db = getDb();
  db.prepare('DELETE FROM mbti_questions WHERE user_id = ?').run(userId);
}

export function getMBTIResult(userId: string): { type_result: string; raw_answers: string; questions_snapshot: string; created_at: string } | undefined {
  const db = getDb();
  return db.prepare(
    "SELECT type_result, raw_answers, COALESCE(questions_snapshot, '[]') as questions_snapshot, created_at FROM mbti_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).get(userId) as { type_result: string; raw_answers: string; questions_snapshot: string; created_at: string } | undefined;
}

const MBTI_RESULTS_LIMIT = 3;

export function getMBTIResults(userId: string, limit = MBTI_RESULTS_LIMIT): Array<{ id: string; type_result: string; raw_answers: string; questions_snapshot: string; created_at: string }> {
  const db = getDb();
  return db.prepare(
    "SELECT id, type_result, raw_answers, COALESCE(questions_snapshot, '[]') as questions_snapshot, created_at FROM mbti_results WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
  ).all(userId, limit) as Array<{ id: string; type_result: string; raw_answers: string; questions_snapshot: string; created_at: string }>;
}

export function saveMBTIResult(
  userId: string,
  typeResult: string,
  rawAnswers: Record<string, string>,
  questionsSnapshot?: Array<{ id: string; dimension: string; question: string; optionA: string; optionB: string; order: number }>
) {
  const db = getDb();
  const id = crypto.randomUUID();
  const questionsJson = questionsSnapshot ? JSON.stringify(questionsSnapshot) : '[]';
  db.prepare(
    'INSERT INTO mbti_results (id, user_id, type_result, raw_answers, questions_snapshot) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, typeResult, JSON.stringify(rawAnswers), questionsJson);
  // Prune to keep only last 3
  const toKeep = db.prepare(
    'SELECT id FROM mbti_results WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, MBTI_RESULTS_LIMIT) as { id: string }[];
  if (toKeep.length >= MBTI_RESULTS_LIMIT) {
    const ids = toKeep.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(
      `DELETE FROM mbti_results WHERE user_id = ? AND id NOT IN (${placeholders})`
    ).run(userId, ...ids);
  }
}

export default getDb;
