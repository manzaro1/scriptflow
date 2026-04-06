import { db } from './db';

export function isAdmin(userId: string): boolean {
  const stmt = db.query('SELECT is_admin FROM users WHERE id = ?');
  const user = stmt.get(userId) as any;
  return user?.is_admin === 1;
}

export function getAllUsers() {
  const stmt = db.query('SELECT id, email, created_at, is_admin FROM users ORDER BY created_at DESC');
  return stmt.all();
}

export function getAllScripts() {
  const stmt = db.query(`
    SELECT s.id, s.title, s.author, s.user_id, s.genre, s.status, s.created_at, s.updated_at, u.email as owner_email
    FROM scripts s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.updated_at DESC
  `);
  return stmt.all();
}

export function getStats() {
  const usersStmt = db.query('SELECT COUNT(*) as count FROM users');
  const scriptsStmt = db.query('SELECT COUNT(*) as count FROM scripts');
  const collabStmt = db.query('SELECT COUNT(*) as count FROM script_collaborators');
  
  return {
    users: usersStmt.get() as any,
    scripts: scriptsStmt.get() as any,
    collaborations: collabStmt.get() as any,
  };
}

export function executeQuery(sql: string, params: any[] = []) {
  // Only allow SELECT queries for safety
  if (!sql.trim().toLowerCase().startsWith('select')) {
    throw new Error('Only SELECT queries allowed');
  }
  const stmt = db.query(sql);
  return stmt.all(...params);
}

export function deleteUser(userId: string) {
  db.query('DELETE FROM script_collaborators WHERE user_id = ?').run(userId);
  db.query('DELETE FROM scripts WHERE user_id = ?').run(userId);
  db.query('DELETE FROM users WHERE id = ?').run(userId);
  return { success: true };
}

export function deleteScript(scriptId: string) {
  db.query('DELETE FROM script_collaborators WHERE script_id = ?').run(scriptId);
  db.query('DELETE FROM scripts WHERE id = ?').run(scriptId);
  return { success: true };
}