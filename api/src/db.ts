import { Database } from 'bun:sqlite';
import { z } from 'zod';

const DB_PATH = process.env.DB_PATH || './scriptflow.db';

export const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.run("PRAGMA journal_mode = WAL");

// Initialize tables
export function initDb() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scripts table
  db.run(`
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Collaborators table — supports invite-by-email (user_id may be NULL for pending invites)
  db.run(`
    CREATE TABLE IF NOT EXISTS script_collaborators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id TEXT NOT NULL,
      user_id TEXT,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
      UNIQUE(script_id, email)
    )
  `);

  // Sessions table for JWT tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Telegram links - connects Telegram accounts to ScriptFlow users
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Telegram sessions - active character chat sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      character_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Telegram conversations - chat history for character sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Telegram brainstorm - independent brainstorming sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_brainstorm (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      topic TEXT,
      ideas TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Telegram active script - currently selected script
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_active_script (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      script_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Telegram multi-characters - multiple characters in conversation
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_multi_characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      character_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(telegram_id, character_name)
    )
  `);

  // User subscriptions - tier management
  db.run(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      tier TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      cancelled_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // AI usage tracking - monthly limits for free tier
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      month_year TEXT NOT NULL,
      scene_generations INTEGER DEFAULT 0,
      ai_suggestions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, month_year)
    )
  `);

  // Telegram daily usage - message limits for free tier
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_daily_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      usage_date TEXT NOT NULL,
      chat_messages INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(telegram_id, usage_date)
    )
  `);

  // Payment history - PayChangu transactions
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'MWK',
      tier TEXT NOT NULL,
      duration_months INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      paychangu_ref TEXT,
      paychangu_trans_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Script backups - for premium users
  db.run(`
    CREATE TABLE IF NOT EXISTS script_backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id TEXT NOT NULL,
      content TEXT NOT NULL,
      backup_type TEXT DEFAULT 'weekly',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
    )
  `);

  // Storyboards - AI-generated production blueprints
  db.run(`
    CREATE TABLE IF NOT EXISTS storyboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
    )
  `);

  // AI provider settings - user's preferred AI provider
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_provider_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL DEFAULT 'nvidia',
      model TEXT NOT NULL DEFAULT 'qwen/qwen3-235b-a22b',
      api_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized');
}

// Schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ScriptSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  author: z.string().optional(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CollaboratorSchema = z.object({
  id: z.number(),
  script_id: z.string(),
  user_id: z.string(),
  role: z.enum(['editor', 'viewer']),
  created_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type Script = z.infer<typeof ScriptSchema>;
export type Collaborator = z.infer<typeof CollaboratorSchema>;
