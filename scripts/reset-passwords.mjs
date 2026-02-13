/**
 * Reset/create all demo user accounts with correct names and passwords.
 *
 * Usage:  node scripts/reset-passwords.mjs
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = process.env.DB_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DB_DIR, 'talkwise.db');

const NEW_PASSWORD = 'TalkWise2026!';

const USERS = [
  { email: 'demotrial@demo.com', name: 'Demo Trial' },
  { email: 'baba@demo.com',      name: 'Saurav' },
  { email: 'aditi@demo.com',     name: 'Aditi' },
  { email: 'parul@demo.com',     name: 'Parul' },
  { email: 'subi@demo.com',      name: 'Subi' },
  { email: 'chitra@demo.com',    name: 'Chitra' },
  { email: 'avin@demo.com',      name: 'Avin' },
];

async function main() {
  console.log(`Opening database at: ${DB_PATH}`);
  const db = new Database(DB_PATH);

  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  for (const { email, name } of USERS) {
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      db.prepare('UPDATE users SET password_hash = ?, name = ? WHERE email = ?').run(hash, name, email);
      console.log(`✓ Reset password & updated name for ${email} → ${name}`);
    } else {
      const id = crypto.randomUUID();
      db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(id, email, name, hash);
      console.log(`✓ Created account for ${email} → ${name}`);
    }
  }

  db.close();

  console.log('\n── All accounts ──');
  console.log('Email                    Name       Password');
  console.log('───────────────────────  ─────────  ─────────────');
  for (const { email, name } of USERS) {
    console.log(`${email.padEnd(23)}  ${name.padEnd(9)}  ${NEW_PASSWORD}`);
  }
}

main().catch(console.error);
