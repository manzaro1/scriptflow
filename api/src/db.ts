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
