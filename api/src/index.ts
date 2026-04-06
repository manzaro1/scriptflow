import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { initDb, db } from './db';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateUserId,
  generateScriptId,
} from './auth';
import { isAdmin, getAllUsers, getAllScripts, getStats, executeQuery, deleteUser, deleteScript } from './admin';
import { serveStatic } from '@hono/node-server/serve-static';

initDb();

const app = new Hono();
app.use(cors({ origin: '*', allowHeaders: ['Authorization', 'Content-Type'] }));
app.use(logger());

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  c.set('user', payload);
  await next();
};

// Admin middleware
const adminMiddleware = async (c: any, next: any) => {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  if (!isAdmin(payload.userId)) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  c.set('user', payload);
  await next();
};

// ==================== AUTH ROUTES ====================

// Sign up
app.post('/api/auth/signup', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  // Check if user exists
  const checkStmt = db.query('SELECT id FROM users WHERE email = ?');
  const existing = checkStmt.get(email);
  if (existing) {
    return c.json({ error: 'User already exists' }, 409);
  }

  const id = generateUserId();
  const passwordHash = await hashPassword(password);

  const insertStmt = db.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)');
  insertStmt.run(id, email, passwordHash);

  const token = generateToken(id, email);
  return c.json({ user: { id, email }, token }, 201);
});

// Sign in
app.post('/api/auth/signin', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const stmt = db.query('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email) as any;
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = generateToken(user.id, user.email);
  return c.json({ user: { id: user.id, email: user.email }, token });
});

// Google sign-in
app.post('/api/auth/google', async (c) => {
  const { credential } = await c.req.json();

  if (!credential) {
    return c.json({ error: 'Google credential required' }, 400);
  }

  // Verify the Google ID token by calling Google's tokeninfo endpoint
  const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
  if (!googleRes.ok) {
    return c.json({ error: 'Invalid Google token' }, 401);
  }

  const googleUser = await googleRes.json() as { email?: string; sub?: string };
  const email = googleUser.email;
  if (!email) {
    return c.json({ error: 'No email in Google token' }, 400);
  }

  // Check if user exists
  const checkStmt = db.query('SELECT * FROM users WHERE email = ?');
  const existing = checkStmt.get(email) as any;

  if (existing) {
    // User exists — sign them in
    const token = generateToken(existing.id, existing.email);
    return c.json({ user: { id: existing.id, email: existing.email }, token });
  }

  // New user — create account (no password)
  const id = generateUserId();
  const insertStmt = db.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)');
  insertStmt.run(id, email, null);

  const token = generateToken(id, email);
  return c.json({ user: { id, email }, token }, 201);
});

// Get current user
app.get('/api/auth/user', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ id: user.userId, email: user.email });
});

// ==================== SCRIPTS ROUTES ====================

// List user's scripts
app.get('/api/scripts', authMiddleware, (c) => {
  const user = c.get('user');
  
  // Get scripts owned by user
  const ownedStmt = db.query('SELECT * FROM scripts WHERE user_id = ? ORDER BY updated_at DESC');
  const owned = ownedStmt.all(user.userId);
  
  // Get scripts where user is collaborator
  const collabStmt = db.query(`
    SELECT s.* FROM scripts s 
    JOIN script_collaborators sc ON s.id = sc.script_id 
    WHERE sc.user_id = ? ORDER BY s.updated_at DESC
  `);
  const collab = collabStmt.all(user.userId);
  
  const allScripts = [...owned, ...collab];
  
  // Remove duplicates by ID
  const uniqueScripts = Array.from(new Map(allScripts.map((s: any) => [s.id, s])).values());
  
  return c.json(uniqueScripts);
});

// Get single script
app.get('/api/scripts/:id', authMiddleware, (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const stmt = db.query('SELECT * FROM scripts WHERE id = ?');
  const script = stmt.get(id) as any;
  
  if (!script) {
    return c.json({ error: 'Not found' }, 404);
  }

  if (script.user_id !== user.userId) {
    const collabStmt = db.query('SELECT role FROM script_collaborators WHERE script_id = ? AND user_id = ?');
    const collab = collabStmt.get(id, user.userId) as any;
    if (!collab) {
      return c.json({ error: 'Not found' }, 404);
    }
  }

  return c.json(script);
});

// Create script
app.post('/api/scripts', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { title, author, content } = body;

  const id = generateScriptId();
  const now = new Date().toISOString();

  const stmt = db.query(
    'INSERT INTO scripts (id, user_id, title, author, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, user.userId, title || 'Untitled', author || '', JSON.stringify(content || []), now, now);

  // Return the created script
  const getStmt = db.query('SELECT * FROM scripts WHERE id = ?');
  const script = getStmt.get(id);
  return c.json(script, 201);
});

// Update script
app.patch('/api/scripts/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Check ownership or edit permission
  const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
  const script = checkStmt.get(id) as any;
  
  if (!script) {
    return c.json({ error: 'Not found' }, 404);
  }

  if (script.user_id !== user.userId) {
    const collabStmt = db.query("SELECT role FROM script_collaborators WHERE script_id = ? AND user_id = ? AND role = 'editor'");
    const collab = collabStmt.get(id, user.userId) as any;
    if (!collab) {
      return c.json({ error: 'Permission denied' }, 403);
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    values.push(body.title);
  }
  if (body.author !== undefined) {
    updates.push('author = ?');
    values.push(body.author);
  }
  if (body.content !== undefined) {
    updates.push('content = ?');
    values.push(JSON.stringify(body.content));
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const updateStmt = db.query(`UPDATE scripts SET ${updates.join(', ')} WHERE id = ?`);
  updateStmt.run(...values);

  return c.json({ success: true });
});

// Delete script
app.delete('/api/scripts/:id', authMiddleware, (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
  const script = checkStmt.get(id) as any;
  
  if (!script || script.user_id !== user.userId) {
    return c.json({ error: 'Not found' }, 404);
  }

  const deleteStmt = db.query('DELETE FROM scripts WHERE id = ?');
  deleteStmt.run(id);
  
  return c.json({ success: true });
});

// ==================== COLLABORATORS ====================

// Invite collaborator to a script (by email — user doesn't need to exist yet)
app.post('/api/scripts/:id/collaborators', authMiddleware, async (c) => {
  const user = c.get('user');
  const scriptId = c.req.param('id');
  const { email, role } = await c.req.json();

  if (!email) return c.json({ error: 'Email is required' }, 400);

  // Check ownership
  const checkStmt = db.query('SELECT user_id, title FROM scripts WHERE id = ?');
  const script = checkStmt.get(scriptId) as any;
  if (!script || script.user_id !== user.userId) {
    return c.json({ error: 'Permission denied' }, 403);
  }

  // Can't invite yourself
  if (email.toLowerCase() === user.email.toLowerCase()) {
    return c.json({ error: 'Cannot invite yourself' }, 400);
  }

  // Check if user exists — if so, link user_id; otherwise pending invite
  const userStmt = db.query('SELECT id FROM users WHERE email = ?');
  const existingUser = userStmt.get(email.toLowerCase()) as any;

  try {
    const insertStmt = db.query(
      'INSERT INTO script_collaborators (script_id, user_id, email, role, status) VALUES (?, ?, ?, ?, ?)'
    );
    insertStmt.run(
      scriptId,
      existingUser?.id || null,
      email.toLowerCase(),
      role || 'viewer',
      existingUser ? 'active' : 'pending'
    );
    return c.json({ success: true }, 201);
  } catch {
    return c.json({ error: 'Already a collaborator' }, 409);
  }
});

// List collaborators for a script
app.get('/api/scripts/:id/collaborators', authMiddleware, (c) => {
  const user = c.get('user');
  const scriptId = c.req.param('id');

  const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
  const script = checkStmt.get(scriptId) as any;
  if (!script) return c.json({ error: 'Not found' }, 404);

  // Must be owner or collaborator
  if (script.user_id !== user.userId) {
    const collabStmt = db.query('SELECT id FROM script_collaborators WHERE script_id = ? AND email = ?');
    const collab = collabStmt.get(scriptId, user.email);
    if (!collab) return c.json({ error: 'Not found' }, 404);
  }

  const listStmt = db.query('SELECT id, email, role, status, created_at FROM script_collaborators WHERE script_id = ?');
  return c.json(listStmt.all(scriptId));
});

// Update collaborator role
app.patch('/api/scripts/:id/collaborators/:collabId', authMiddleware, async (c) => {
  const user = c.get('user');
  const scriptId = c.req.param('id');
  const collabId = c.req.param('collabId');
  const { role } = await c.req.json();

  const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
  const script = checkStmt.get(scriptId) as any;
  if (!script || script.user_id !== user.userId) {
    return c.json({ error: 'Permission denied' }, 403);
  }

  const updateStmt = db.query('UPDATE script_collaborators SET role = ? WHERE id = ? AND script_id = ?');
  updateStmt.run(role, collabId, scriptId);
  return c.json({ success: true });
});

// Remove collaborator
app.delete('/api/scripts/:id/collaborators/:collabId', authMiddleware, (c) => {
  const user = c.get('user');
  const scriptId = c.req.param('id');
  const collabId = c.req.param('collabId');

  const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
  const script = checkStmt.get(scriptId) as any;
  if (!script || script.user_id !== user.userId) {
    return c.json({ error: 'Permission denied' }, 403);
  }

  const deleteStmt = db.query('DELETE FROM script_collaborators WHERE id = ? AND script_id = ?');
  deleteStmt.run(collabId, scriptId);
  return c.json({ success: true });
});

// Get all collaborators across all user's scripts (for Profile Teams tab)
app.get('/api/collaborators', authMiddleware, (c) => {
  const user = c.get('user');

  const stmt = db.query(`
    SELECT sc.id, sc.script_id, sc.email, sc.role, sc.status, sc.created_at, s.title as script_title
    FROM script_collaborators sc
    JOIN scripts s ON sc.script_id = s.id
    WHERE s.user_id = ?
    ORDER BY sc.created_at DESC
  `);
  return c.json(stmt.all(user.userId));
});

// Get total unique collaborator count for a user
app.get('/api/collaborators/count', authMiddleware, (c) => {
  const user = c.get('user');

  const stmt = db.query(`
    SELECT COUNT(DISTINCT email) as count
    FROM script_collaborators sc
    JOIN scripts s ON sc.script_id = s.id
    WHERE s.user_id = ?
  `);
  const result = stmt.get(user.userId) as any;
  return c.json({ count: result?.count || 0 });
});

// ==================== AI PROXY ====================

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_BASE_URL = process.env.AI_BASE_URL || '';
const AI_MODEL = process.env.AI_MODEL || '';

// Proxy AI chat completions — keeps the API key server-side
app.post('/api/ai/chat', authMiddleware, async (c) => {
  if (!AI_API_KEY || !AI_BASE_URL) {
    return c.json({ error: 'AI provider not configured' }, 500);
  }

  const body = await c.req.json();
  const { messages, max_tokens, temperature, model } = body;

  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: 'messages array is required' }, 400);
  }

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || AI_MODEL,
        messages,
        max_tokens: max_tokens || 2048,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return c.json({ error: `AI provider error (${res.status})`, details: errText }, res.status as any);
    }

    const data = await res.json();
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message || 'AI request failed' }, 500);
  }
});

// Legacy function-based AI routes — proxy to the AI provider
app.post('/api/ai/:function', authMiddleware, async (c) => {
  if (!AI_API_KEY || !AI_BASE_URL) {
    return c.json({ error: 'AI provider not configured' }, 500);
  }

  const fn = c.req.param('function');
  const body = await c.req.json();

  const prompts: Record<string, { messages: any[]; temperature?: number }> = {
    'ai-autocomplete': {
      messages: [
        { role: 'system', content: 'You are a screenplay writing assistant. Continue the screenplay naturally. Return ONLY the continuation text.' },
        { role: 'user', content: `Context:\n${(body.blocks || []).slice(Math.max(0, (body.currentBlockIndex || 0) - 5), (body.currentBlockIndex || 0) + 1).map((b: any) => `[${b.type}] ${b.content}`).join('\n')}\n\nContinue:` },
      ],
      temperature: 0.7,
    },
    'ai-character-chat': {
      messages: [
        { role: 'system', content: `You are ${body.characterName || 'a character'} from a screenplay. Stay in character. Reference lines:\n${(body.characterDialogue || []).slice(0, 10).join('\n')}` },
        ...(body.conversationHistory || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: body.userMessage || '' },
      ],
      temperature: 0.8,
    },
    'ai-dialogue-feedback': {
      messages: [
        { role: 'system', content: 'Analyze dialogue quality. Return JSON: {"overall_score": 1-10, "feedback": [{"category": string, "score": 1-10, "comment": string}]}. Categories: Authenticity, Subtext, Character Voice, Pacing, Conflict. Return ONLY valid JSON.' },
        { role: 'user', content: `Character: ${body.characterName}\nDialogue: "${body.dialogue}"\nContext:\n${(body.surroundingBlocks || []).map((b: any) => `[${b.type}] ${b.content}`).join('\n')}` },
      ],
      temperature: 0.3,
    },
  };

  const prompt = prompts[fn];
  if (!prompt) {
    return c.json({ error: `Unknown AI function: ${fn}` }, 404);
  }

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages: prompt.messages, max_tokens: 2048, temperature: prompt.temperature ?? 0.7 }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return c.json({ error: `AI provider error (${res.status})`, details: errText }, res.status as any);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Format response based on function type
    if (fn === 'ai-autocomplete') return c.json({ suggestion: content.trim() });
    if (fn === 'ai-character-chat') return c.json({ response: content.trim() });
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message || 'AI request failed' }, 500);
  }
});

// ==================== ADMIN ROUTES ====================

// Get all users (admin only)
app.get('/api/admin/users', adminMiddleware, (c) => {
  return c.json(getAllUsers());
});

// Get all scripts (admin only)
app.get('/api/admin/scripts', adminMiddleware, (c) => {
  return c.json(getAllScripts());
});

// Get stats (admin only)
app.get('/api/admin/stats', adminMiddleware, (c) => {
  return c.json(getStats());
});

// Execute query (admin only)
app.post('/api/admin/query', adminMiddleware, async (c) => {
  try {
    const { sql, params } = await c.req.json();
    const results = executeQuery(sql, params || []);
    return c.json({ results });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', adminMiddleware, (c) => {
  const id = c.req.param('id');
  deleteUser(id);
  return c.json({ success: true });
});

// Delete script (admin only)
app.delete('/api/admin/scripts/:id', adminMiddleware, (c) => {
  const id = c.req.param('id');
  deleteScript(id);
  return c.json({ success: true });
});

// Static file serving using Bun
app.use('/assets/*', async (c) => {
  const path = c.req.path.replace('/assets/', '');
  const filePath = `/home/workspace/scriptflow/dist/assets/${path}`;
  const file = Bun.file(filePath);
  if (await file.exists()) {
    const contentType = filePath.endsWith('.js') || filePath.endsWith('.mjs') ? 'application/javascript' :
                      filePath.endsWith('.css') ? 'text/css' :
                      filePath.endsWith('.wasm') ? 'application/wasm' :
                      filePath.endsWith('.svg') ? 'image/svg+xml' :
                      filePath.endsWith('.png') ? 'image/png' :
                      filePath.endsWith('.ico') ? 'image/x-icon' :
                      'application/octet-stream';
    return new Response(file, { headers: { 'Content-Type': contentType } });
  }
  return c.text('Not Found', 404);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// SPA fallback — serve index.html for all non-API, non-asset routes
app.get('*', async (c) => {
  const file = Bun.file('/home/workspace/scriptflow/dist/index.html');
  if (await file.exists()) {
    return new Response(file, { headers: { 'Content-Type': 'text/html' } });
  }
  return c.text('Not Found', 404);
});

const PORT = process.env.PORT || 3001;
console.log(`Server running on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
