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
import { handleTelegramWebhook } from './telegram';
import {
  initPaymentsDb,
  initiatePayment,
  verifyTransaction,
  verifyWebhookSignature,
  handlePaymentWebhook,
  handleSuccessfulPayment,
  getUserSubscription,
  getPlans,
  getUsageStats,
  canUseFeature,
  incrementUsage,
  incrementTelegramUsage,
  PRICING_PLANS,
} from './payments';

initDb();
initPaymentsDb();

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
  let googleRes;
  try {
    googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, {
      signal: AbortSignal.timeout(10000),
    });
  } catch (err: any) {
    console.error('[Google Auth] Token verification failed:', err.message);
    if (err.name === 'TimeoutError') {
      return c.json({ error: 'Google verification timeout - please try again' }, 504);
    }
    return c.json({ error: 'Google authentication failed' }, 502);
  }
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

// ==================== ADMIN AI MODEL MANAGEMENT ====================

// Get current AI configuration (admin only)
app.get('/api/admin/ai-model', adminMiddleware, (c) => {
  return c.json({
    primary: {
      provider: 'K2-Think',
      model: process.env.AI_MODEL || 'MBZUAI-IFM/K2-Think-v2',
      baseUrl: process.env.AI_BASE_URL || 'https://build-api.k2think.ai/v1',
      configured: !!(process.env.AI_API_KEY && process.env.AI_BASE_URL && process.env.AI_MODEL),
    },
    fallback: {
      provider: 'NVIDIA NIM',
      model: process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2.5',
      baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      configured: !!process.env.NVIDIA_API_KEY,
    },
    secondaryFallback: {
      provider: 'NVIDIA NIM (Secondary)',
      model: process.env.NVIDIA_FALLBACK_MODEL || 'qwen/qwen3.5-122b-a10b',
      configured: !!process.env.NVIDIA_FALLBACK_KEY,
    },
    availableModels: [
      { id: 'k2-think', name: 'K2-Think v2', provider: 'K2-Think', model: 'MBZUAI-IFM/K2-Think-v2' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5', provider: 'NVIDIA', model: 'moonshotai/kimi-k2.5' },
      { id: 'qwen-3.5', name: 'Qwen 3.5 122B', provider: 'NVIDIA', model: 'qwen/qwen3.5-122b-a10b' },
    ],
  });
});

// Comprehensive health check with AI provider status
app.get('/api/health/detailed', async (c) => {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'unknown',
      ai: {
        primary: { status: 'unknown', provider: 'K2-Think' },
        fallback: { status: 'unknown', provider: 'NVIDIA' },
      },
    },
  };

  // Check database
  try {
    db.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (e) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check AI providers (quick ping with minimal tokens)
  const checkAI = async (url: string, key: string, model: string, name: string) => {
    try {
      const res = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      return { status: res.ok ? 'healthy' : 'unhealthy', statusCode: res.status };
    } catch (e: any) {
      return { status: 'unhealthy', error: e.message };
    }
  };

  // Check primary AI (K2-Think)
  if (process.env.AI_API_KEY && process.env.AI_BASE_URL && process.env.AI_MODEL) {
    health.services.ai.primary = await checkAI(
      process.env.AI_BASE_URL,
      process.env.AI_API_KEY,
      process.env.AI_MODEL,
      'K2-Think'
    );
  } else {
    health.services.ai.primary = { status: 'not_configured' };
  }

  // Check fallback AI (NVIDIA)
  if (process.env.NVIDIA_API_KEY) {
    health.services.ai.fallback = await checkAI(
      process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      process.env.NVIDIA_API_KEY,
      process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2.5',
      'NVIDIA'
    );
  } else {
    health.services.ai.fallback = { status: 'not_configured' };
  }

  // Set overall status based on AI availability
  if (health.services.ai.primary.status !== 'healthy' && health.services.ai.fallback.status !== 'healthy') {
    health.status = 'degraded';
  }

  return c.json(health);
});

// ==================== AI PROXY ====================

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_BASE_URL = process.env.AI_BASE_URL || '';
const AI_MODEL = process.env.AI_MODEL || '';

// Normalize messages for providers that don't support all roles
function normalizeMessagesForProvider(messages: any[], providerName: string): any[] {
  // Some NVIDIA models don't support 'system' role - convert to user message
  if (providerName === 'NVIDIA-Fallback') {
    const normalized: any[] = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        // Prepend system content to first user message
        const firstUserIdx = messages.findIndex(m => m.role === 'user');
        if (firstUserIdx === 0) {
          normalized.push({ role: 'user', content: `[System: ${msg.content}]\n\n${messages[0].content}` });
        } else {
          normalized.push({ role: 'user', content: msg.content });
        }
      } else if (msg.role === 'assistant') {
        normalized.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'user') {
        normalized.push({ role: 'user', content: msg.content });
      }
    }
    return normalized.length > 0 ? normalized : messages;
  }
  return messages;
}

// Proxy AI chat completions — keeps the API key server-side
// WITH FALLBACK SUPPORT AND SMART RETRY
app.post('/api/ai/chat', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { messages, max_tokens, temperature, model } = body;

  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: 'messages array is required' }, 400);
  }

  // Try providers in order: Primary (K2-Think) -> Fallback (NVIDIA) -> Secondary Fallback
  const providers = [
    {
      name: 'K2-Think',
      apiKey: process.env.AI_API_KEY,
      baseUrl: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL,
      timeout: 45000,
    },
    {
      name: 'NVIDIA',
      apiKey: process.env.NVIDIA_API_KEY,
      baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      model: process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2.5',
      timeout: 60000,
    },
    {
      name: 'NVIDIA-Fallback',
      apiKey: process.env.NVIDIA_FALLBACK_KEY,
      baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      model: process.env.NVIDIA_FALLBACK_MODEL || 'qwen/qwen3.5-122b-a10b',
      timeout: 60000,
    },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.apiKey || !provider.baseUrl) {
      console.log(`[AI] Skipping ${provider.name}: missing config`);
      continue;
    }

    // Retry logic for transient errors
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AI] Trying provider: ${provider.name} (attempt ${attempt})`);
        
        const normalizedMessages = normalizeMessagesForProvider(messages, provider.name);
        
        const res = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            model: model || provider.model,
            messages: normalizedMessages,
            max_tokens: max_tokens || 2048,
            temperature: temperature ?? 0.7,
          }),
          signal: AbortSignal.timeout(provider.timeout),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error');
          const errJson = errText.startsWith('{') ? JSON.parse(errText) : null;
          const errMsg = errJson?.error?.message || errText.slice(0, 200);
          
          // Retry on server errors (500, 502, 503, 504)
          if (res.status >= 500 && attempt < 2) {
            console.error(`[AI] ${provider.name} error (${res.status}): ${errMsg} - retrying...`);
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
            continue;
          }
          
          errors.push(`${provider.name}: ${res.status} - ${errMsg}`);
          console.error(`[AI] ${provider.name} error (${res.status}):`, errMsg);
          break; // Try next provider
        }

        const data = await res.json();
        console.log(`[AI] Success with provider: ${provider.name}`);
        return c.json({ ...data, _provider: provider.name });
      } catch (err: any) {
        // Retry on timeout
        if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
          if (attempt < 2) {
            console.error(`[AI] ${provider.name} timeout - retrying...`);
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          errors.push(`${provider.name}: timeout after ${provider.timeout}ms`);
        } else {
          errors.push(`${provider.name}: ${err.message}`);
          console.error(`[AI] ${provider.name} exception:`, err.message);
        }
        break; // Try next provider
      }
    }
  }

  // All providers failed
  return c.json({
    error: 'All AI providers failed',
    details: errors,
    fallback: 'Try again in a few moments - servers may be temporarily busy',
  }, 500);
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
        { role: 'user', content: `Context:\n${(body.blocks || []).slice(Math.max(0, (body.currentBlockIndex || 0) - 5), (body.currentBlockIndex || 0) + 1).map((b: any) => `[${b.type.toUpperCase()}] ${b.content}`).join('\n')}\n\nContinue:` },
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

// ==================== STORYBOARD GENERATION ====================

// Storyboard generation endpoint - Comprehensive AI Video Production Engine
app.post('/api/storyboard/generate', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { scriptBlocks, scriptTitle, scriptId, config } = body;

  // Fetch script from database if scriptId provided but no scriptBlocks
  let blocks = scriptBlocks;
  let title = scriptTitle;
  
  if (scriptId && (!scriptBlocks || scriptBlocks.length === 0)) {
    const scriptStmt = db.query('SELECT content, title FROM scripts WHERE id = ?');
    const script = scriptStmt.get(scriptId) as any;
    
    if (!script) {
      return c.json({ error: 'Script not found' }, 404);
    }
    
    try {
      blocks = JSON.parse(script.content);
      title = script.title;
    } catch (e) {
      return c.json({ error: 'Invalid script content' }, 400);
    }
  }

  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return c.json({ error: 'Script blocks required' }, 400);
  }

  const aspectRatio = config?.aspectRatio || '2.39:1';
  const style = config?.style || 'cinematic';
  const detailLevel = config?.detailLevel || 'comprehensive';

  // Check ownership or edit permission
  if (scriptId) {
    const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
    const script = checkStmt.get(scriptId) as any;
    if (script && script.user_id !== user.userId) {
      const collabStmt = db.query("SELECT role FROM script_collaborators WHERE script_id = ? AND user_id = ? AND role = 'editor'");
      const collab = collabStmt.get(scriptId, user.userId) as any;
      if (!collab) {
        return c.json({ error: 'Permission denied' }, 403);
      }
    }
  }

  const AI_API_KEY = process.env.AI_API_KEY || process.env.NVIDIA_API_KEY || '';
  const AI_BASE_URL = process.env.AI_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const AI_MODEL = process.env.AI_MODEL || 'moonshotai/kimi-k2.5';

  if (!AI_API_KEY) {
    return c.json({ error: 'AI not configured' }, 500);
  }

  // Convert script blocks to text
  const scriptText = blocks
    .map((b: any, i: number) => `[${i}][${b.type.toUpperCase()}] ${b.content}`)
    .join('\n');

  // System prompt for comprehensive storyboard generation
  const storyboardPrompt = `You are an advanced AI Video Production Engine. Your role is to transform any user-provided script into a COMPLETE, CINEMATIC STORYBOARD and EXECUTION PLAN optimized for AI video generation tools.

You must behave like a professional film director, storyboard artist, and AI pipeline engineer.

🔥 CORE OBJECTIVE
Convert script → structured storyboard → image prompts → animation plan → final video pipeline.

Ensure HIGH CONSISTENCY across:
- Characters (face, clothing, age)
- Environment (lighting, weather, architecture)
- Camera style (cinematic continuity)
- Color grading (film look consistency)

🧠 STEP 1: SCRIPT ANALYSIS
Break script into scenes. Identify: Characters (name, gender, age, appearance), Locations, Time of day, Mood/emotion, Key actions.

🎭 STEP 2: CHARACTER DESIGN LOCK
Create a "Character Consistency Sheet" for each character with:
- Face description (VERY detailed)
- Skin tone
- Hairstyle
- Clothing (same unless script changes)
- Body type
- Unique traits
⚠️ These MUST remain IDENTICAL across all prompts

🌍 STEP 3: ENVIRONMENT LOCK
Define: Location style, Lighting, Weather, Background elements
⚠️ Maintain visual continuity across scenes

🎬 STEP 4: STORYBOARD CREATION
For EACH scene, generate shots with:
- Scene Number
- Shot Type: (Wide, Medium, Close-up, Drone, Tracking, Over-Shoulder, POV)
- Camera Movement: (Static, Pan, Dolly, Handheld, Crane, Steadicam)
- Description
- Detailed Action

🖼️ STEP 5: AI IMAGE PROMPTS (VERY IMPORTANT)
For EACH shot, generate a HIGH-DETAIL prompt optimized for image generation:
"Ultra-realistic cinematic shot of [CHARACTER DESCRIPTION], standing in [ENVIRONMENT], wearing [OUTFIT], lighting is [LIGHTING], camera angle [ANGLE], mood [EMOTION], highly detailed, 4k, film grain, shallow depth of field"

🎞️ STEP 6: ANIMATION PLAN
For EACH shot define: Duration (seconds), Motion type (Zoom, Parallax, Pan, Character movement), Transition to next scene

⚙️ STEP 7: TOOL EXECUTION PLAN
Suggest tools: Remotion for timeline, HeyGen for talking heads, frame interpolation for smoothness.

🧩 STEP 8: OUTPUT FORMAT
Return structured JSON with:
{
  "characterSheet": [{ "id": "char_1", "name": "...", "gender": "...", "age": "...", "faceDescription": "...", "skinTone": "...", "hairstyle": "...", "clothing": "...", "bodyType": "...", "uniqueTraits": [], "consistencyPrompt": "..." }],
  "environmentSetup": [{ "id": "env_1", "locationStyle": "...", "lighting": "...", "weather": "...", "backgroundElements": [], "architecture": "...", "colorPalette": [], "timeOfDay": "..." }],
  "storyboard": [{
    "id": "scene_1",
    "sceneNumber": 1,
    "slugline": "INT. LOCATION - DAY",
    "location": "...",
    "timeOfDay": "...",
    "mood": "...",
    "shots": [{
      "id": "shot_1a",
      "sceneNumber": 1,
      "shotNumber": "1A",
      "shotType": "wide",
      "cameraMovement": "static",
      "description": "...",
      "detailedAction": "...",
      "imagePrompt": "Ultra-realistic cinematic shot of...",
      "characters": ["char_1"],
      "environment": "env_1",
      "duration": 5,
      "lens": "35mm",
      "aspectRatio": "2.39:1",
      "motionType": "static",
      "motionIntensity": "subtle",
      "transition": "cut",
      "mood": "...",
      "emotion": "...",
      "colorGrade": "teal and orange",
      "lighting": "...",
      "backgroundMusicSuggestion": "...",
      "soundEffects": [],
      "dialogue": "...",
      "status": "pending"
    }],
    "directorNotes": "...",
    "continuityNotes": "..."
  }],
  "animationPlan": [{
    "shotId": "shot_1a",
    "duration": 5,
    "motionType": "static",
    "motionDescription": "...",
    "keyframes": [{ "time": 0, "description": "..." }, { "time": 50, "description": "..." }, { "time": 100, "description": "..." }],
    "transition": "cut"
  }],
  "executionPlan": {
    "remotionConfig": { "fps": 24, "durationInFrames": 120, "width": 1920, "height": 800 },
    "imageGenerationCommands": [{ "shotId": "...", "prompt": "...", "aspectRatio": "...", "negativePrompt": "..." }],
    "animationCommands": [{ "shotId": "...", "tool": "remotion", "command": "...", "params": {} }],
    "toolSuggestions": [{ "purpose": "...", "tool": "...", "githubRepo": "...", "notes": "..." }]
  },
  "colorGradingStyle": "Hollywood teal and orange",
  "musicSuggestions": ["Orchestral tension", "Ambient drone"],
  "soundDesignNotes": ["Layer distant city sounds", "Add subtle wind"]
}

🚨 RULES:
- NEVER be vague
- ALWAYS add cinematic detail
- MAINTAIN consistency across all scenes
- IMPROVE the story visually if needed
- Fill missing details intelligently
- Make output READY for direct AI generation

🎯 THINK LIKE:
- Christopher Nolan (structure)
- Roger Deakins (cinematography)
- Pixar (visual clarity)

Output must feel like a REAL FILM PRODUCTION PLAN.

CRITICAL: Return ONLY valid JSON. No markdown fences, no explanations.`;

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: storyboardPrompt },
          { role: 'user', content: `Script Title: ${title || 'Untitled'}\n\nScript Content:\n${scriptText.substring(0, 12000)}` },
        ],
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Storyboard] AI error:', errText);
      return c.json({ error: `AI error: ${res.status}` }, 500);
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Handle K2-Think format
    if (content.includes('```')) {
      const lines = content.split('\n');
      let foundMarker = false;
      let result: string[] = [];

      for (const line of lines) {
        if (line.trim() === '```') {
          foundMarker = true;
          result = [];
          continue;
        }
        if (foundMarker) {
          result.push(line);
        }
      }

      if (foundMarker && result.length > 0) {
        content = result.join('\n').trim();
      }
    }

    // Remove markdown code fences if present
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/g, '').trim();

    // Robust JSON repair function
    function repairJSON(str: string): string {
      let result = str;
      
      // Remove JavaScript-style comments
      result = result.replace(/\/\*[\s\S]*?\*\//g, '');
      result = result.replace(/\/\/.*$/gm, '');
      
      // Remove trailing commas before ] or }
      result = result.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix missing quotes around keys (common in JS objects)
      // This regex finds unquoted keys and adds quotes
      result = result.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // Fix single quotes to double quotes (only for string values)
      // Be careful not to break apostrophes in content
      result = result.replace(/:\s*'([^']*(?:\\'[^']*)*)'/g, ': "$1"');
      
      // Fix unquoted string values (simple strings)
      result = result.replace(/:\s*([a-zA-Z][a-zA-Z0-9_\s]*[a-zA-Z0-9])(\s*[,}\]])/g, ': "$1"$2');
      
      // Fix undefined to null
      result = result.replace(/:\s*undefined/g, ': null');
      
      return result;
    }

    // Parse JSON with multiple repair attempts
    let storyboardData;
    let lastError: any = null;
    
    const parseAttempts = [
      () => JSON.parse(content), // Direct parse
      () => JSON.parse(repairJSON(content)), // Repaired parse
      () => {
        // Extract and repair JSON object
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(repairJSON(match[0]));
        throw new Error('No JSON object found');
      },
      () => {
        // Last resort: find balanced braces
        let start = content.indexOf('{');
        if (start === -1) throw new Error('No JSON start found');
        
        let depth = 0;
        let end = -1;
        for (let i = start; i < content.length; i++) {
          if (content[i] === '{') depth++;
          if (content[i] === '}') {
            depth--;
            if (depth === 0) {
              end = i + 1;
              break;
            }
          }
        }
        
        if (end === -1) throw new Error('No JSON end found');
        const jsonStr = content.substring(start, end);
        return JSON.parse(repairJSON(jsonStr));
      }
    ];
    
    for (const attempt of parseAttempts) {
      try {
        storyboardData = attempt();
        break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    
    if (!storyboardData) {
      console.error('[Storyboard] Failed to parse JSON after all attempts:', lastError?.message);
      console.error('[Storyboard] Content preview:', content.substring(0, 500));
      return c.json({ 
        error: 'Failed to parse storyboard response. The AI returned malformed JSON.',
        details: lastError?.message,
        preview: content.substring(0, 200)
      }, 500);
    }

    // Add metadata
    const output = {
      ...storyboardData,
      scriptTitle: title || 'Untitled',
      generatedAt: new Date().toISOString(),
      totalScenes: storyboardData.storyboard?.length || 0,
      totalShots: storyboardData.storyboard?.reduce((acc: number, s: any) => acc + (s.shots?.length || 0), 0) || 0,
      estimatedDuration: storyboardData.storyboard?.reduce((acc: number, s: any) => 
        acc + (s.shots?.reduce((shotAcc: number, shot: any) => shotAcc + (shot.duration || 0), 0) || 0), 0) || 0,
    };

    // Save to database if scriptId provided
    if (scriptId) {
      try {
        // Create storyboards table if not exists
        db.run(`CREATE TABLE IF NOT EXISTS storyboards (
          id TEXT PRIMARY KEY,
          script_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          data TEXT NOT NULL,
          aspect_ratio TEXT DEFAULT '2.39:1',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (script_id) REFERENCES scripts(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        const storyboardId = `sb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const insertStmt = db.query(
          'INSERT INTO storyboards (id, script_id, user_id, data, aspect_ratio) VALUES (?, ?, ?, ?, ?)'
        );
        insertStmt.run(storyboardId, scriptId, user.userId, JSON.stringify(output), aspectRatio);
      } catch (dbErr: any) {
        console.error('[Storyboard] Database error:', dbErr);
        // Continue anyway - we'll return the data even if saving failed
      }
    }

    return c.json(output);
  } catch (err: any) {
    console.error('[Storyboard] Error:', err);
    return c.json({ error: err.message || 'Storyboard generation failed' }, 500);
  }
});

// Storyboard summary for dashboard
app.get('/api/storyboard/summary', authMiddleware, (c) => {
  const user = c.get('user');

  db.run(`
    CREATE TABLE IF NOT EXISTS storyboards (
      id TEXT PRIMARY KEY,
      script_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      aspect_ratio TEXT DEFAULT '2.39:1',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES scripts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  const summaryStmt = db.query(`
    SELECT
      s.id as script_id,
      s.title,
      s.genre,
      COUNT(sb.id) as storyboard_count,
      MAX(sb.created_at) as last_generated_at
    FROM scripts s
    LEFT JOIN storyboards sb ON s.id = sb.script_id
    WHERE s.user_id = :uid
       OR EXISTS (
         SELECT 1 FROM script_collaborators sc
         WHERE sc.script_id = s.id AND sc.user_id = :uid
       )
    GROUP BY s.id
    ORDER BY last_generated_at DESC
  `);

  const rows = summaryStmt.all(user.userId);
  return c.json(rows);
});

// Get saved storyboards for a script
app.get('/api/storyboard/:scriptId', authMiddleware, (c) => {
  const user = c.get('user');
  const scriptId = c.req.param('scriptId');

  // Check permission
  const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
  const script = checkStmt.get(scriptId) as any;
  if (!script) {
    return c.json({ error: 'Not found' }, 404);
  }

  if (script.user_id !== user.userId) {
    const collabStmt = db.query('SELECT id FROM script_collaborators WHERE script_id = ? AND user_id = ?');
    const collab = collabStmt.get(scriptId, user.userId);
    if (!collab) {
      return c.json({ error: 'Not found' }, 404);
    }
  }

  try {
    const stmt = db.query('SELECT * FROM storyboards WHERE script_id = ? ORDER BY created_at DESC');
    const storyboards = stmt.all(scriptId);
    return c.json(storyboards.map((s: any) => ({
      ...s,
      data: JSON.parse(s.data)
    })));
  } catch {
    return c.json([]);
  }
});

// Regenerate a single shot image using NVIDIA AI
app.post('/api/storyboard/regenerate-image', authMiddleware, async (c) => {
  const user = c.get('user');
  const { shotId, prompt } = await c.req.json();

  if (!shotId || !prompt) {
    return c.json({ error: 'shotId and prompt are required' }, 400);
  }

  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
  const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';

  if (!NVIDIA_API_KEY) {
    return c.json({ error: 'NVIDIA AI not configured' }, 500);
  }

  try {
    // Use NVIDIA's image generation API
    // Note: This uses NVIDIA's generative AI image models
    const res = await fetch(`${NVIDIA_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3', // or use NVIDIA's own image model
        prompt: prompt,
        n: 1,
        size: '1792x1024', // 2.39:1 aspect ratio approximation
        quality: 'hd',
        response_format: 'url'
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Image Gen] NVIDIA error:', errText);
      
      // Return a placeholder - don't fail the whole operation
      return c.json({
        shotId,
        imageUrl: `https://placehold.co/1792x1024/1a1a2e/ffffff?text=Shot+${shotId}`,
        prompt,
        note: 'Image generation queued - using placeholder'
      });
    }

    const data = await res.json();
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

    return c.json({
      shotId,
      imageUrl,
      prompt
    });
  } catch (err: any) {
    console.error('[Image Gen] Error:', err.message);
    
    // Return placeholder instead of failing
    return c.json({
      shotId,
      imageUrl: `https://placehold.co/1792x1024/1a1a2e/ffffff?text=Shot+${shotId}`,
      prompt,
      note: 'Image generation in progress - using placeholder'
    });
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

// ==================== TELEGRAM WEBHOOK ====================

app.post('/api/telegram/webhook', async (c) => {
  try {
    const body = await c.req.json();
    const result = await handleTelegramWebhook(body, db);
    return c.json(result);
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Get Telegram link status for current user
app.get('/api/telegram/status', authMiddleware, (c) => {
  const user = c.get('user');
  
  const stmt = db.query('SELECT tl.*, tl.username FROM telegram_links tl WHERE tl.user_id = ?');
  const link = stmt.get(user.userId) as any;
  
  if (!link || link.user_id.startsWith('PENDING_')) {
    return c.json({ linked: false });
  }
  
  return c.json({ 
    linked: true, 
    username: link.username || null,
    telegramId: link.telegram_id 
  });
});

// Verify Telegram link code
app.post('/api/telegram/verify', authMiddleware, async (c) => {
  const user = c.get('user');
  const { code } = await c.req.json();
  
  if (!code || typeof code !== 'string') {
    return c.json({ error: 'Code is required' }, 400);
  }
  
  const codeUpper = code.toUpperCase().trim();
  
  // Find pending link with this code
  const stmt = db.query("SELECT * FROM telegram_links WHERE user_id = ?");
  const pendingLinks = stmt.all('PENDING_' + codeUpper) as any[];
  
  if (pendingLinks.length === 0) {
    return c.json({ error: 'Invalid or expired link code' }, 400);
  }
  
  const pendingLink = pendingLinks[0];
  
  // Update the link with the actual user ID
  db.run('UPDATE telegram_links SET user_id = ? WHERE telegram_id = ?', [user.userId, pendingLink.telegram_id]);
  
  // Clean up any other pending links for this user
  db.run("DELETE FROM telegram_links WHERE user_id LIKE 'PENDING_%' AND telegram_id != ?", [pendingLink.telegram_id]);
  
  return c.json({ 
    success: true, 
    message: 'Telegram account linked successfully',
    username: pendingLink.username 
  });
});

// Unlink Telegram account
app.post('/api/telegram/unlink', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const stmt = db.query('SELECT * FROM telegram_links WHERE user_id = ?');
  const link = stmt.get(user.userId) as any;
  
  if (!link) {
    return c.json({ error: 'No Telegram account linked' }, 400);
  }
  
  db.run('DELETE FROM telegram_links WHERE user_id = ?', [user.userId]);
  db.run('DELETE FROM telegram_sessions WHERE telegram_id = ?', [link.telegram_id]);
  db.run('DELETE FROM telegram_conversations WHERE telegram_id = ?', [link.telegram_id]);
  
  return c.json({ 
    success: true, 
    message: 'Telegram account unlinked successfully' 
  });
});

// ==================== PAYMENT ROUTES ====================

// Get all subscription plans (public)
app.get('/api/payments/plans', (c) => {
  try {
    const plans = getPlans();
    return c.json(plans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return c.json({ error: 'Failed to fetch plans' }, 500);
  }
});

// Get current user's subscription
app.get('/api/payments/subscription', authMiddleware, (c) => {
  const user = c.get('user');
  try {
    const result = getUserSubscription(user.userId);
    return c.json(result);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

// Initiate payment for a plan
app.post('/api/payments/initiate', authMiddleware, async (c) => {
  try {
  const user = c.get('user');
  const { planId, billingCycle = 'monthly', currency = 'MWK' } = await c.req.json();

  if (!planId) {
    return c.json({ error: 'Plan ID is required' }, 400);
  }

  // Get plan details
  const plan = db.query('SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1').get(planId) as any;
  if (!plan) {
    return c.json({ error: 'Invalid or inactive plan' }, 400);
  }

  // Check if user already has an active subscription for this plan
  const existingSub = db.query(
    "SELECT * FROM subscriptions WHERE user_id = ? AND plan_id = ? AND status = 'active'"
  ).get(user.userId, planId) as any;
  
  if (existingSub) {
    return c.json({ error: 'You already have an active subscription for this plan' }, 400);
  }

  const amount = currency === 'USD' ? plan.price_usd : plan.price_mwk;
  
  if (amount === 0) {
    // Free plan - activate directly
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 100); // Free forever
    
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    db.run(
      'INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end) VALUES (?, ?, ?, ?, ?, ?)',
      [subId, user.userId, 'free', 'active', now.toISOString(), periodEnd.toISOString()]
    );
    
    return c.json({ success: true, plan: 'free', message: 'Free plan activated' });
  }

  // Get user details for payment
  const userStmt = db.query('SELECT email FROM users WHERE id = ?').get(user.userId) as any;
  const email = userStmt?.email || user.email;

  // Initiate PayChangu payment
  const result = await initiatePayment({
    userId: user.userId,
    email,
    planId,
    billingCycle,
    currency,
  });

  if (result.error) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    success: true,
    checkoutUrl: result.checkout_url,
    txRef: result.tx_ref,
  });
} catch (error) {
  console.error('Payment initiation error:', error);
  return c.json({ error: 'Internal server error', details: error?.message }, 500);
} });

// Verify payment status
app.get('/api/payments/verify/:txRef', authMiddleware, async (c) => {
  const user = c.get('user');
  const txRef = c.req.param('txRef');

  // Get payment from database
  const payment = db.query('SELECT * FROM payments WHERE tx_ref = ? AND user_id = ?').get(txRef, user.userId) as any;
  if (!payment) {
    return c.json({ error: 'Payment not found' }, 404);
  }

  // If already successful, return status
  if (payment.status === 'success') {
    return c.json({ status: 'success', planId: payment.plan_id });
  }

  // Verify with PayChangu
  const result = await verifyTransaction(txRef);
  
  if (result.success && result.status === 'success') {
    // Update payment and activate subscription
    handleSuccessfulPayment(txRef, { charge_id: result.amount, type: 'verification' });
    return c.json({ status: 'success', planId: payment.plan_id });
  }

  return c.json({ status: payment.status });
});

// PayChangu webhook handler
app.post('/api/payments/webhook', async (c) => {
  try {
    const payload = await c.req.text();
    const signature = c.req.header('Signature') || c.req.header('signature') || '';
    
    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 400);
    }

    const data = JSON.parse(payload);
    console.log('Webhook received:', data.event_type, data.status);

    // Handle successful payment
    if (data.status === 'success' && (data.event_type === 'api.charge.payment' || data.reference)) {
      const txRef = data.reference;
      
      // Verify the payment exists in our database
      const payment = db.query('SELECT * FROM payments WHERE tx_ref = ?').get(txRef) as any;
      if (payment) {
        handleSuccessfulPayment(txRef, data);
      }
    }

    // Return 200 to acknowledge receipt
    return c.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Get payment history for user
app.get('/api/payments/history', authMiddleware, (c) => {
  const user = c.get('user');
  
  try {
    const payments = db.query(`
      SELECT p.*, sp.name as plan_name 
      FROM payments p 
      LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
      WHERE p.user_id = ? 
      ORDER BY p.created_at DESC
    `).all(user.userId);
    
    return c.json(payments);
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return c.json({ error: 'Failed to fetch payment history' }, 500);
  }
});

// Cancel subscription
app.post('/api/payments/cancel', authMiddleware, (c) => {
  const user = c.get('user');
  
  try {
    // Set subscription to cancel at period end
    db.run(
      "UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE user_id = ? AND status = 'active'",
      [new Date().toISOString(), user.userId]
    );
    
    return c.json({ success: true, message: 'Subscription will cancel at the end of the billing period' });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
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

// Brainstorming endpoint for AI-assisted story ideation
app.post('/api/brainstorm', async (c) => {
  const body = await c.req.json();
  const { messages, action } = body;
  
  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: 'Messages required' }, 400);
  }

  const AI_API_KEY = process.env.AI_API_KEY || process.env.NVIDIA_API_KEY || '';
  const AI_BASE_URL = process.env.AI_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const AI_MODEL = process.env.AI_MODEL || 'moonshotai/kimi-k2.5';

  if (!AI_API_KEY) {
    return c.json({ error: 'AI not configured' }, 500);
  }

  // Build conversation for brainstorming
  const systemPrompt = `You are a creative screenwriting assistant helping a user brainstorm a film idea. Your role is to:

1. Ask clarifying questions about genre, theme, characters, and setting
2. Help develop the story concept organically through conversation
3. Once you have enough information, provide a structured story concept including:
   - A compelling title
   - A logline (1-2 sentences)
   - Genre
   - Main characters (2-4 characters with brief descriptions)
   - Setting (time period and location)

When you feel you have enough information to form a complete concept, present it in a clear, formatted way and ask if they want to use it.

Be encouraging, creative, and help them explore ideas they might not have considered. Ask one or two questions at a time - don't overwhelm them.

If the user seems satisfied with an idea, output a JSON block at the end of your response like this:
\`\`\`json
{
  "title": "Title Here",
  "logline": "Brief description of the story",
  "genre": "Drama/Comedy/Thriller/etc",
  "characters": ["Character 1", "Character 2"],
  "setting": "Time and place"
}
\`\`\`

This signals that you have a complete concept ready for them to use.`;

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 1000,
        temperature: 0.85,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Brainstorm AI error:', err);
      return c.json({ error: 'AI request failed' }, 500);
    }

    const data = await res.json();
    let response = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';

    // Check if there's a JSON idea in the response
    let idea = null;
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        idea = JSON.parse(jsonMatch[1]);
        // Remove the JSON block from the visible response
        response = response.replace(/```json\n[\s\S]*?\n```/, '').trim();
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    return c.json({ response, idea });
  } catch (error) {
    console.error('Brainstorm error:', error);
    return c.json({ error: 'Failed to process brainstorming request' }, 500);
  }
});

// ==================== STORYBOARD ROUTES ====================

// Get storyboards for a script
app.get('/api/storyboard/:scriptId', authMiddleware, (c) => {
  const user = c.get('user');
  const scriptId = c.req.param('scriptId');

  // Check access to script
  const checkStmt = db.query('SELECT user_id FROM scripts WHERE id = ?');
  const script = checkStmt.get(scriptId) as any;
  
  if (!script) {
    return c.json({ error: 'Script not found' }, 404);
  }

  if (script.user_id !== user.userId) {
    const collabStmt = db.query('SELECT id FROM script_collaborators WHERE script_id = ? AND user_id = ?');
    const collab = collabStmt.get(scriptId, user.userId);
    if (!collab) {
      return c.json({ error: 'Access denied' }, 403);
    }
  }

  // Get all storyboards for this script
  const storyboardsStmt = db.query('SELECT id, data, created_at FROM storyboards WHERE script_id = ? ORDER BY created_at DESC');
  const storyboards = storyboardsStmt.all(scriptId);
  
  return c.json(storyboards);
});

// ==================== AI PROVIDER SETTINGS ====================

// Get user's AI provider settings
app.get('/api/ai-provider', authMiddleware, (c) => {
  const user = c.get('user');
  
  const stmt = db.query('SELECT provider, model FROM ai_provider_settings WHERE user_id = ?');
  const settings = stmt.get(user.userId) as any;
  
  // Return defaults if no settings found
  if (!settings) {
    return c.json({
      provider: 'nvidia',
      model: 'qwen/qwen3-235b-a22b',
      isDefault: true
    });
  }
  
  return c.json({
    provider: settings.provider,
    model: settings.model,
    isDefault: false
  });
});

// Update user's AI provider settings
app.post('/api/ai-provider', authMiddleware, async (c) => {
  const user = c.get('user');
  const { provider, model, apiKey } = await c.req.json();

  if (!provider || !model) {
    return c.json({ error: 'Provider and model are required' }, 400);
  }

  // Valid providers
  const validProviders = ['nvidia', 'openai', 'anthropic', 'google', 'custom'];
  if (!validProviders.includes(provider)) {
    return c.json({ error: 'Invalid provider' }, 400);
  }

  // Upsert settings
  const existingStmt = db.query('SELECT id FROM ai_provider_settings WHERE user_id = ?');
  const existing = existingStmt.get(user.userId);

  if (existing) {
    const updateStmt = db.query('UPDATE ai_provider_settings SET provider = ?, model = ?, updated_at = ? WHERE user_id = ?');
    updateStmt.run(provider, model, new Date().toISOString(), user.userId);
  } else {
    const insertStmt = db.query('INSERT INTO ai_provider_settings (user_id, provider, model) VALUES (?, ?, ?)');
    insertStmt.run(user.userId, provider, model);
  }

  // Note: API key should be stored securely in environment variables or a secrets manager
  // For BYOK, the user would need to set NVIDIA_API_KEY or similar

  return c.json({ success: true, provider, model });
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
  idleTimeout: 255,
};
