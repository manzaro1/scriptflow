// Telegram Bot Handler for ScriptFlow
import { config } from 'dotenv';
config({ path: '/home/workspace/scriptflow/api/.env' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Get AI config from database (with fallback to env)
const getAIConfig = async (db: any) => {
  let apiKey = process.env.AI_API_KEY || "";
  let baseUrl = process.env.AI_BASE_URL || "";
  let model = process.env.AI_MODEL || "";
  let provider = 'k2think';

  try {
    const result = db.query('SELECT value FROM ai_config WHERE key = ?').get('provider');
    if (result?.value) {
      provider = result.value;
    }
  } catch (e) {
    console.log('[TELEGRAM] Could not read provider from database');
  }

  if (provider === 'nvidia') {
    apiKey = process.env.NVIDIA_API_KEY || '';
    baseUrl = 'https://integrate.api.nvidia.com/v1';
    model = process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2.5';
  } else if (provider === 'nvidia-fallback') {
    apiKey = process.env.NVIDIA_FALLBACK_KEY || '';
    baseUrl = 'https://integrate.api.nvidia.com/v1';
    model = process.env.NVIDIA_FALLBACK_MODEL || 'qwen/qwen3.5-122b-a10b';
  } else {
    apiKey = process.env.AI_API_KEY || '';
    baseUrl = 'https://build-api.k2think.ai/v1';
    model = 'MBZUAI-IFM/K2-Think-v2';
  }

  console.log('[TELEGRAM] Provider:', provider, '| Model:', model);
  return { apiKey, baseUrl, model };
};

// Helper: Extract final response from K2 model output
function extractFinalResponse(content: string): string {
  if (!content) return '';
  let trimmed = content.trim();

  if (trimmed.length < 3) {
    console.log('[TELEGRAM] Very short response:', trimmed);
    return trimmed;
  }

  const thinkPatterns = ['</think>', '&lt;/think&gt;'];
  for (const pattern of thinkPatterns) {
    if (trimmed.includes(pattern)) {
      const parts = trimmed.split(pattern);
      if (parts.length > 1) {
        const finalAnswer = parts[parts.length - 1].trim();
        if (finalAnswer.length > 0) {
          console.log('[TELEGRAM] Extracted from think tag, length:', finalAnswer.length);
          return finalAnswer;
        }
      }
    }
  }

  if (trimmed.includes('```')) {
    const lines = trimmed.split('\n');
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
      const extracted = result.join('\n').trim();
      if (extracted.length > 10) {
        console.log('[TELEGRAM] Extracted from backticks, length:', extracted.length);
        return extracted;
      }
    }
  }

  const markers = ['### Response', '### Answer', '### Final', '**Answer:**', '**Response:**'];
  for (const marker of markers) {
    const idx = trimmed.indexOf(marker);
    if (idx !== -1 && idx < trimmed.length - marker.length - 20) {
      const extracted = trimmed.substring(idx + marker.length).trim();
      if (extracted.length > 10) {
        console.log('[TELEGRAM] Extracted from marker:', marker, 'length:', extracted.length);
        return extracted;
      }
    }
  }

  if (/^["']/.test(trimmed) || /^[A-Z][a-z]+:/.test(trimmed)) {
    console.log('[TELEGRAM] Response looks like dialogue, using as-is');
    return trimmed;
  }

  if (trimmed.length < 200) {
    console.log('[TELEGRAM] Short response (<200), using as-is:', trimmed.substring(0, 50));
    return trimmed;
  }

  if (trimmed.length > 800) {
    const dialogueMatch = trimmed.match(/\n\n(["']|I\s|[A-Z][a-z]+:)/);
    if (dialogueMatch && dialogueMatch.index && dialogueMatch.index > 200) {
      const extracted = trimmed.substring(dialogueMatch.index).trim();
      if (extracted.length > 50) {
        console.log('[TELEGRAM] Extracted dialogue from long response');
        return extracted;
      }
    }
  }

  console.log('[TELEGRAM] Using full response, length:', trimmed.length);
  return trimmed;
}

// AI request with fallback
async function aiRequestWithFallback(messages: any[], maxTokens = 300, temperature = 0.8, db: any): Promise<string> {
  const dbConfig = await getAIConfig(db);
  
  if (dbConfig.apiKey && dbConfig.baseUrl) {
    try {
      console.log(`[AI] Trying database config: ${dbConfig.model}...`);
      const res = await fetch(`${dbConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dbConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: dbConfig.model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || '';
        console.log(`[AI] Database config succeeded`);
        return extractFinalResponse(rawContent);
      }
    } catch (err: any) {
      console.log(`[AI] Database config error: ${err.message}`);
    }
  }

  const fallbacks = [
    { name: 'K2-Think', apiKey: process.env.AI_API_KEY, baseUrl: process.env.AI_BASE_URL, model: process.env.AI_MODEL },
    { name: 'NVIDIA-Kimi', apiKey: process.env.NVIDIA_API_KEY, baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'moonshotai/kimi-k2.5' },
    { name: 'NVIDIA-Qwen', apiKey: process.env.NVIDIA_FALLBACK_KEY, baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'qwen/qwen3.5-122b-a10b' },
  ];

  for (const cfg of fallbacks) {
    if (!cfg.apiKey || !cfg.baseUrl) continue;
    try {
      console.log(`[AI] Trying fallback ${cfg.name}...`);
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ model: cfg.model, messages, max_tokens: maxTokens, temperature }),
      });
      if (res.ok) {
        const data = await res.json();
        return extractFinalResponse(data.choices?.[0]?.message?.content || '');
      }
    } catch (err: any) {
      console.log(`[AI] ${cfg.name} error: ${err.message}`);
    }
  }

  throw new Error('All AI providers failed');
}

// Helper: Send Telegram message with optional inline keyboard
export async function sendTelegramMessage(chatId: string, text: string, parse_mode?: string, reply_markup?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: parse_mode || 'HTML' };
  if (reply_markup) {
    body.reply_markup = reply_markup;
  }
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Helper: Send typing indicator
async function sendTypingIndicator(chatId: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

// Helper: Answer callback query (for button clicks)
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text || '', show_alert: false }),
  });
}

// Helper: Edit message (for updating button messages)
async function editMessage(chatId: string, messageId: number, text: string, reply_markup?: any) {
  const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' };
  if (reply_markup) {
    body.reply_markup = reply_markup;
  }
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Handle callback queries (button clicks)
async function handleCallbackQuery(callbackQuery: any, db: any) {
  const chatId = callbackQuery.message.chat.id.toString();
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;
  
  console.log('[TELEGRAM] Callback:', data);
  
  await answerCallbackQuery(callbackQuery.id);
  
  // Handle list_scripts
  if (data === 'list_scripts') {
    const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
    
    if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
      await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
      return;
    }
    
    const userId = (links[0] as any).user_id;
    const scripts = db.query('SELECT id, title FROM scripts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10').all(userId);
    
    if (scripts.length === 0) {
      await sendTelegramMessage(chatId, '📝 No scripts found. Create one at scriptflow-zaro.zocomputer.io');
      return;
    }
    
    const scriptButtons: any[][] = [];
    for (let i = 0; i < scripts.length; i += 2) {
      const row: any[] = [];
      row.push({ text: `🎬 ${(scripts[i] as any).title.substring(0, 20)}`, callback_data: `script_${(scripts[i] as any).id}` });
      if (scripts[i + 1]) {
        row.push({ text: `🎬 ${(scripts[i + 1] as any).title.substring(0, 20)}`, callback_data: `script_${(scripts[i + 1] as any).id}` });
      }
      scriptButtons.push(row);
    }
    scriptButtons.push([{ text: '💡 Brainstorm New Ideas', callback_data: 'global_brainstorm' }]);
    
    await sendTelegramMessage(chatId, `📚 <b>Your Scripts</b>\n\n<i>Tap a script to interact:</i>`, 'HTML', {
      inline_keyboard: scriptButtons
    });
    return;
  }
  
  // Handle global_brainstorm
  if (data === 'global_brainstorm') {
    const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
    
    if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
      await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
      return;
    }
    
    // Clear existing sessions
    db.run('DELETE FROM telegram_sessions WHERE telegram_id = ?', [telegramId]);
    db.run('DELETE FROM telegram_conversations WHERE telegram_id = ?', [telegramId]);
    
    db.run(`CREATE TABLE IF NOT EXISTS telegram_brainstorm (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      topic TEXT,
      script_id TEXT,
      messages TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run('DELETE FROM telegram_brainstorm WHERE telegram_id = ?', [telegramId]);
    db.run('INSERT INTO telegram_brainstorm (telegram_id, topic) VALUES (?, ?)', 
      [telegramId, 'New Ideas']);
    
    await sendTelegramMessage(chatId, `💡 <b>Brainstorming Session</b>

I'm your creative writing partner! Let's explore ideas together.

<b>What would you like to discuss?</b>
• A story concept
• Character ideas  
• Plot problems
• Scene ideas

Just type your thoughts!

<i>/idea [text] - Save breakthrough
/summary - View saved ideas
/end - Stop brainstorming</i>`);
    return;
  }
  
  // Handle show_help
  if (data === 'show_help') {
    const helpMsg = `🎬 <b>ScriptFlow Bot</b>

<b>Navigation:</b>
/start - Main menu
/scripts - Choose a script

<b>Character Chat:</b>
(Tap a character from your script)
/call [name] - Invite another character
/end - End chat

<b>Creative Tools:</b>
/discuss [topic] - Brainstorm
/idea [text] - Save idea
/summary - View ideas
/feedback [dialogue] - Analyze`;
    
    await sendTelegramMessage(chatId, helpMsg);
    return;
  }
  
  // Check if user is linked (for script/char callbacks)
  const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
  if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
    await editMessage(chatId, messageId, '❌ Please link your account first with /link');
    return;
  }
  
  const userId = (links[0] as any).user_id;
  
  // Handle script selection
  if (data.startsWith('script_')) {
    const scriptId = data.replace('script_', '');
    const script = db.query('SELECT id, title, content FROM scripts WHERE id = ?').get(scriptId) as any;
    
    if (!script) {
      await editMessage(chatId, messageId, '❌ Script not found');
      return;
    }
    
    // Extract characters from script
    let characters: string[] = [];
    let currentChar = '';
    try {
      const content = JSON.parse(script.content || '[]');
      for (const block of content) {
        if (block.type === 'character') {
          currentChar = block.content?.toUpperCase() || '';
          const cleanName = currentChar.replace(/\s*\([^)]*\)\s*/g, '').trim();
          if (cleanName && !characters.includes(cleanName)) {
            characters.push(cleanName);
          }
        }
      }
    } catch (e) {}
    
    // Store selected script in session table
    db.run(`CREATE TABLE IF NOT EXISTS telegram_selected_script (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      script_id TEXT NOT NULL,
      script_title TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run('INSERT OR REPLACE INTO telegram_selected_script (telegram_id, script_id, script_title) VALUES (?, ?, ?)', 
      [telegramId, scriptId, script.title]);
    
    // Build character buttons
    const charButtons = characters.slice(0, 8).map(char => [{
      text: `🎭 ${char}`,
      callback_data: `char_${char}_${scriptId.substring(0, 8)}`
    }]);
    
    // Add brainstorm button
    charButtons.push([{ text: '💡 Brainstorm Ideas', callback_data: `brainstorm_${scriptId.substring(0, 8)}` }]);
    charButtons.push([{ text: '📝 Script Info', callback_data: `info_${scriptId.substring(0, 8)}` }]);
    
    await editMessage(chatId, messageId, 
      `🎬 <b>${script.title}</b>\n\n` +
      `<b>Characters:</b> ${characters.length > 0 ? characters.join(', ') : 'No characters found'}\n\n` +
      `<i>Tap a character to start chatting, or brainstorm ideas:</i>`,
      { inline_keyboard: charButtons }
    );
    return;
  }
  
  // Handle character selection
  if (data.startsWith('char_')) {
    const parts = data.replace('char_', '').split('_');
    const charName = parts.slice(0, -1).join(' ');
    const scriptIdShort = parts[parts.length - 1];
    
    // Get full script ID from selected_script table
    const selected = db.query('SELECT script_id, script_title FROM telegram_selected_script WHERE telegram_id = ?').get(telegramId) as any;
    if (!selected) {
      await sendTelegramMessage(chatId, '❌ No script selected. Use /scripts to choose one.');
      return;
    }
    
    const script = db.query('SELECT content FROM scripts WHERE id = ?').get(selected.script_id) as any;
    
    // Get character dialogue
    let characterDialogue: string[] = [];
    let currentCharacter = '';
    try {
      const content = JSON.parse(script.content || '[]');
      for (const block of content) {
        if (block.type === 'character') {
          currentCharacter = block.content?.toUpperCase() || '';
        }
        if ((block.type === 'dialogue' || block.type === 'action') && block.content) {
          const cleanCurrentChar = currentCharacter.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
          if (cleanCurrentChar.includes(charName.toLowerCase()) || charName.toLowerCase().includes(cleanCurrentChar)) {
            characterDialogue.push(block.content);
          }
        }
      }
    } catch (e) {}
    
    if (characterDialogue.length === 0) {
      await sendTelegramMessage(chatId, `❓ No dialogue found for "${charName}"`);
      return;
    }
    
    // Create chat session
    db.run('INSERT OR REPLACE INTO telegram_sessions (telegram_id, character_name) VALUES (?, ?)', 
      [telegramId, charName]);
    db.run('DELETE FROM telegram_conversations WHERE telegram_id = ?', [telegramId]);
    
    const systemPrompt = `You are ${charName}.

Your life experiences and memories:
${characterDialogue.slice(0, 12).join('\n\n')}

You're having a real conversation. Be yourself. Speak naturally. Have real feelings and opinions. React authentically. Keep responses focused and conversational.`;

    db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
      [telegramId, 'system', systemPrompt]);

    await sendTypingIndicator(chatId);

    const response = await aiRequestWithFallback([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Someone wants to talk with you. Just be yourself and say hi naturally.` }
    ], 400, 0.85, db);
    
    db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
      [telegramId, 'assistant', response]);
    
    await sendTelegramMessage(chatId, `🎭 <b>${charName}:</b>\n\n${response}\n\n<i>💬 Reply to continue chatting\n📞 /call [name] - Invite another character\n⏹ /end - Stop chat</i>`);
    return;
  }
  
  // Handle brainstorm selection
  if (data.startsWith('brainstorm_')) {
    const selected = db.query('SELECT script_id, script_title FROM telegram_selected_script WHERE telegram_id = ?').get(telegramId) as any;
    
    if (!selected) {
      await sendTelegramMessage(chatId, '❌ No script selected');
      return;
    }
    
    // Create brainstorming session
    db.run(`CREATE TABLE IF NOT EXISTS telegram_brainstorm (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      topic TEXT,
      script_id TEXT,
      messages TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run('DELETE FROM telegram_brainstorm WHERE telegram_id = ?', [telegramId]);
    db.run('INSERT INTO telegram_brainstorm (telegram_id, topic, script_id) VALUES (?, ?, ?)', 
      [telegramId, selected.script_title, selected.script_id]);
    
    await sendTelegramMessage(chatId, 
      `💡 <b>Brainstorming: ${selected.script_title}</b>\n\n` +
      `I'm your creative partner! Let's develop ideas together.\n\n` +
      `<b>What would you like to explore?</b>\n` +
      `• Plot twists\n` +
      `• Character development\n` +
      `• Scene ideas\n` +
      `• Dialogue approaches\n\n` +
      `Just type your thoughts!\n\n` +
      `<i>/idea [text] - Save breakthrough\n/summary - View saved ideas\n/end - Stop brainstorming</i>`);
    return;
  }
  
  // Handle script info
  if (data.startsWith('info_')) {
    const selected = db.query('SELECT script_id, script_title FROM telegram_selected_script WHERE telegram_id = ?').get(telegramId) as any;
    
    if (!selected) {
      await sendTelegramMessage(chatId, '❌ No script selected');
      return;
    }
    
    const script = db.query('SELECT content, created_at, updated_at FROM scripts WHERE id = ?').get(selected.script_id) as any;
    
    let stats = { scenes: 0, characters: new Set<string>(), dialogue: 0, action: 0 };
    try {
      const content = JSON.parse(script.content || '[]');
      for (const block of content) {
        if (block.type === 'slugline') stats.scenes++;
        if (block.type === 'character') {
          const cleanName = block.content?.toUpperCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
          if (cleanName) stats.characters.add(cleanName);
        }
        if (block.type === 'dialogue') stats.dialogue++;
        if (block.type === 'action') stats.action++;
      }
    } catch (e) {}
    
    await editMessage(chatId, messageId, 
      `📊 <b>${selected.script_title}</b>\n\n` +
      `🎬 Scenes: ${stats.scenes}\n` +
      `🎭 Characters: ${stats.characters.size > 0 ? Array.from(stats.characters).join(', ') : 'None'}\n` +
      `💬 Dialogue blocks: ${stats.dialogue}\n` +
      `📝 Action blocks: ${stats.action}\n` +
      `📅 Created: ${script.created_at?.substring(0, 10) || 'Unknown'}\n` +
      `✏️ Updated: ${script.updated_at?.substring(0, 10) || 'Unknown'}`,
      { inline_keyboard: [[{ text: '← Back', callback_data: `script_${selected.script_id}` }]] }
    );
    return;
  }
}

// Handle Telegram webhook
export async function handleTelegramWebhook(body: any, db: any) {
  // Handle callback queries (button clicks)
  if (body.callback_query) {
    await handleCallbackQuery(body.callback_query, db);
    return { ok: true };
  }
  
  const message = body.message;
  
  if (!message || !message.text) {
    return { ok: true };
  }

  const chatId = message.chat.id.toString();
  const telegramId = message.from.id.toString();
  const username = message.from.username || message.from.first_name || 'User';
  const text = message.text.trim();

  try {
    // /start command
    if (text.startsWith('/start')) {
      const welcomeMsg = `🎬 <b>Welcome to ScriptFlow Bot!</b>

I'm your AI screenwriting companion on Telegram.

<b>What I can do:</b>
• 🎭 Chat with your script characters
• 💡 Brainstorm creative ideas
• 📝 Analyze dialogue quality
• 🤝 Multi-character conversations

<b>Quick Start:</b>
Tap below to see your scripts:`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '📚 My Scripts', callback_data: 'list_scripts' }],
          [{ text: '💡 Brainstorm Ideas', callback_data: 'global_brainstorm' }],
          [{ text: '❓ Help', callback_data: 'show_help' }]
        ]
      };
      
      await sendTelegramMessage(chatId, welcomeMsg, 'HTML', keyboard);
      return { ok: true };
    }

    // Handle callback: list_scripts
    if (text === 'list_scripts' || (body.callback_query?.data === 'list_scripts')) {
      if (body.callback_query) {
        await handleCallbackQuery(body.callback_query, db);
        return { ok: true };
      }
    }

    // /link command
    if (text.startsWith('/link')) {
      const existingLinks = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (existingLinks.length > 0 && !(existingLinks[0] as any).user_id.startsWith('PENDING_')) {
        const users = db.query('SELECT email FROM users WHERE id = ?').get((existingLinks[0] as any).user_id);
        await sendTelegramMessage(chatId, `✅ Already linked to: ${(users as any)?.email || 'your account'}\n\nTap below to see your scripts:`, 'HTML', {
          inline_keyboard: [[{ text: '📚 My Scripts', callback_data: 'list_scripts' }]]
        });
        return { ok: true };
      }

      const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      db.run('INSERT OR REPLACE INTO telegram_links (telegram_id, user_id, username) VALUES (?, ?, ?)', 
        [telegramId, 'PENDING_' + linkCode, username]);
      
      await sendTelegramMessage(chatId, `🔗 <b>Link Your Account</b>

To connect your ScriptFlow account:

1. Open ScriptFlow: https://scriptflow-zaro.zocomputer.io
2. Go to Profile → Telegram
3. Enter this code: <code>${linkCode}</code>

Your code expires in 10 minutes.`);
      
      return { ok: true };
    }

    // /scripts command - show scripts as buttons
    if (text.startsWith('/scripts')) {
      const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
        await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
        return { ok: true };
      }

      const userId = (links[0] as any).user_id;
      const scripts = db.query('SELECT id, title FROM scripts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10').all(userId);
      
      if (scripts.length === 0) {
        await sendTelegramMessage(chatId, '📝 No scripts found. Create one at scriptflow-zaro.zocomputer.io');
        return { ok: true };
      }

      // Build script buttons (2 per row)
      const scriptButtons: any[][] = [];
      for (let i = 0; i < scripts.length; i += 2) {
        const row: any[] = [];
        row.push({ text: `🎬 ${(scripts[i] as any).title.substring(0, 20)}`, callback_data: `script_${(scripts[i] as any).id}` });
        if (scripts[i + 1]) {
          row.push({ text: `🎬 ${(scripts[i + 1] as any).title.substring(0, 20)}`, callback_data: `script_${(scripts[i + 1] as any).id}` });
        }
        scriptButtons.push(row);
      }
      
      // Add brainstorm button
      scriptButtons.push([{ text: '💡 Brainstorm New Ideas', callback_data: 'global_brainstorm' }]);

      await sendTelegramMessage(chatId, `📚 <b>Your Scripts</b>\n\n<i>Tap a script to interact with its characters:</i>`, 'HTML', {
        inline_keyboard: scriptButtons
      });
      return { ok: true };
    }

    // /discuss command - Independent brainstorming (not tied to a script)
    if (text.startsWith('/discuss')) {
      const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
        await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
        return { ok: true };
      }

      const topic = text.replace('/discuss', '').trim();
      
      // End any character chat
      db.run('DELETE FROM telegram_sessions WHERE telegram_id = ?', [telegramId]);
      db.run('DELETE FROM telegram_conversations WHERE telegram_id = ?', [telegramId]);
      
      // Create brainstorming table if not exists
      db.run(`CREATE TABLE IF NOT EXISTS telegram_brainstorm (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT NOT NULL,
        topic TEXT,
        script_id TEXT,
        messages TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);
      
      db.run('DELETE FROM telegram_brainstorm WHERE telegram_id = ?', [telegramId]);
      
      if (!topic) {
        db.run('INSERT INTO telegram_brainstorm (telegram_id, topic) VALUES (?, ?)', 
          [telegramId, 'New Idea']);
        
        await sendTelegramMessage(chatId, `💡 <b>Brainstorming Session</b>

I'm your creative writing partner! Let's explore ideas together.

<b>What would you like to discuss?</b>
• A story concept
• Character ideas
• Plot problems
• Dialogue approaches

Just type your thoughts!

<i>/idea [text] - Save breakthrough
/summary - View saved ideas
/end - Stop brainstorming</i>`);
        return { ok: true };
      }
      
      db.run('INSERT INTO telegram_brainstorm (telegram_id, topic) VALUES (?, ?)', 
        [telegramId, topic]);
      
      await sendTypingIndicator(chatId);
      
      const aiConfig = await getAIConfig(db);
      const aiRes = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: `You are a creative writing partner helping brainstorm "${topic}". Be encouraging, ask probing questions, suggest creative directions. Keep responses concise (2-4 sentences). Ask one clarifying question.` },
            { role: 'user', content: `I want to discuss: ${topic}` }
          ],
          max_tokens: 500,
          temperature: 0.85,
        }),
      });

      if (!aiRes.ok) {
        throw new Error(`AI API error: ${aiRes.status}`);
      }

      const aiData = await aiRes.json();
      const response = extractFinalResponse(aiData.choices?.[0]?.message?.content || '...');
      
      await sendTelegramMessage(chatId, `💡 <b>${topic}</b>\n\n${response}\n\n<i>/idea [text] - Save breakthrough\n/summary - View ideas\n/end - Stop</i>`);
      return { ok: true };
    }

    // /idea command - Save breakthrough idea
    if (text.startsWith('/idea')) {
      const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
        await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
        return { ok: true };
      }

      const idea = text.replace('/idea', '').trim();
      
      if (!idea) {
        await sendTelegramMessage(chatId, '💡 Usage: /idea [your breakthrough idea]\n\nExample: /idea The twist is she\'s been dead all along');
        return { ok: true };
      }
      
      // Create ideas table
      db.run(`CREATE TABLE IF NOT EXISTS telegram_ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT NOT NULL,
        idea TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);
      
      db.run('INSERT INTO telegram_ideas (telegram_id, idea) VALUES (?, ?)', 
        [telegramId, idea]);
      
      await sendTelegramMessage(chatId, `✨ <b>Idea Saved!</b>\n\n"${idea}"\n\n<i>Use /summary to view all saved ideas</i>`);
      return { ok: true };
    }

    // /summary command - View saved ideas
    if (text.startsWith('/summary')) {
      const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
        await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
        return { ok: true };
      }

      try {
        const ideas = db.query('SELECT idea, created_at FROM telegram_ideas WHERE telegram_id = ? ORDER BY id DESC LIMIT 10').all(telegramId);
        
        if (ideas.length === 0) {
          await sendTelegramMessage(chatId, '📝 No ideas saved yet.\n\nUse /idea [text] to save your breakthroughs!');
          return { ok: true };
        }
        
        let msg = `💡 <b>Your Saved Ideas:</b>\n\n`;
        ideas.forEach((idea: any, i: number) => {
          const date = idea.created_at?.substring(0, 10) || '';
          msg += `${i + 1}. ${idea.idea}\n   <i>${date}</i>\n\n`;
        });
        
        await sendTelegramMessage(chatId, msg);
      } catch (e) {
        await sendTelegramMessage(chatId, '📝 No ideas saved yet.\n\nUse /idea [text] to save your breakthroughs!');
      }
      return { ok: true };
    }

    // /end command
    if (text.startsWith('/end')) {
      const sessions = db.query('SELECT * FROM telegram_sessions WHERE telegram_id = ?').all(telegramId);
      const brainstorm = db.query('SELECT * FROM telegram_brainstorm WHERE telegram_id = ?').get(telegramId);
      
      if (sessions.length > 0) {
        db.run('DELETE FROM telegram_sessions WHERE telegram_id = ?', [telegramId]);
        db.run('DELETE FROM telegram_conversations WHERE telegram_id = ?', [telegramId]);
        await sendTelegramMessage(chatId, '🎭 Chat ended. Use /scripts to choose another.', 'HTML', {
          inline_keyboard: [[{ text: '📚 My Scripts', callback_data: 'list_scripts' }]]
        });
      } else if (brainstorm) {
        db.run('DELETE FROM telegram_brainstorm WHERE telegram_id = ?', [telegramId]);
        db.run('DELETE FROM telegram_conversations WHERE telegram_id = ?', [telegramId]);
        await sendTelegramMessage(chatId, '💡 Brainstorming ended. Use /discuss to start a new session.');
      } else {
        await sendTelegramMessage(chatId, '❌ No active session.');
      }
      return { ok: true };
    }

    // /call command - Invite another character
    if (text.startsWith('/call ')) {
      const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
        await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
        return { ok: true };
      }

      const sessions = db.query('SELECT * FROM telegram_sessions WHERE telegram_id = ?').all(telegramId);
      
      if (sessions.length === 0) {
        await sendTelegramMessage(chatId, '❌ No active chat. Use /chat [character] first.');
        return { ok: true };
      }

      const currentCharacter = (sessions[0] as any).character_name;
      const newCharacterName = text.replace('/call ', '').trim();
      
      if (!newCharacterName) {
        await sendTelegramMessage(chatId, '📞 Usage: /call [character name]\n\nExample: /call James');
        return { ok: true };
      }

      // Get the selected script
      const selected = db.query('SELECT script_id FROM telegram_selected_script WHERE telegram_id = ?').get(telegramId) as any;
      if (!selected) {
        await sendTelegramMessage(chatId, '❌ No script selected. Use /scripts to choose one.');
        return { ok: true };
      }

      const userId = (links[0] as any).user_id;
      const script = db.query('SELECT content FROM scripts WHERE id = ?').get(selected.script_id) as any;
      
      // Get new character's dialogue
      let newCharDialogue: string[] = [];
      let currentChar = '';
      try {
        const content = JSON.parse(script.content || '[]');
        for (const block of content) {
          if (block.type === 'character') {
            currentChar = block.content?.toUpperCase() || '';
          }
          if ((block.type === 'dialogue' || block.type === 'action') && block.content) {
            const cleanCurrentChar = currentChar.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
            if (cleanCurrentChar.includes(newCharacterName.toLowerCase()) || 
                newCharacterName.toLowerCase().includes(cleanCurrentChar)) {
              newCharDialogue.push(block.content);
            }
          }
        }
      } catch (e) {}

      if (newCharDialogue.length === 0) {
        await sendTelegramMessage(chatId, `❓ Character "${newCharacterName}" not found in this script.`);
        return { ok: true };
      }

      // Update session to multi-character mode
      const multiCharSession = `${currentCharacter} & ${newCharacterName}`;
      db.run('UPDATE telegram_sessions SET character_name = ? WHERE telegram_id = ?', [multiCharSession, telegramId]);

      // Get original character dialogue for context
      let originalCharDialogue: string[] = [];
      currentChar = '';
      try {
        const content = JSON.parse(script.content || '[]');
        for (const block of content) {
          if (block.type === 'character') {
            currentChar = block.content?.toUpperCase() || '';
          }
          if ((block.type === 'dialogue' || block.type === 'action') && block.content) {
            const cleanCurrentChar = currentChar.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
            if (cleanCurrentChar.includes(currentCharacter.toLowerCase().split(' & ')[0]) || 
                currentCharacter.toLowerCase().includes(cleanCurrentChar)) {
              originalCharDialogue.push(block.content);
            }
          }
        }
      } catch (e) {}

      const systemPrompt = `You are simulating a conversation between TWO characters:

<b>${currentCharacter.split(' & ')[0]}</b>:
${originalCharDialogue.slice(0, 8).join('\n\n')}

<b>${newCharacterName}</b>:
${newCharDialogue.slice(0, 8).join('\n\n')}

RULES:
- Both characters are in the same room talking with the user
- When responding, clearly indicate WHO is speaking using their name in bold
- Characters can interact with each other AND the user
- Each character has their own personality
- Keep responses focused (2-3 exchanges per character)

Format:
<b>${currentCharacter.split(' & ')[0]}:</b> [their dialogue]
<b>${newCharacterName}:</b> [their dialogue]`;

      db.run('DELETE FROM telegram_conversations WHERE role = "system" AND telegram_id = ?', [telegramId]);
      db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
        [telegramId, 'system', systemPrompt]);

      await sendTypingIndicator(chatId);

      const aiConfig = await getAIConfig(db);
      const aiRes = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${newCharacterName} just joined. Both characters acknowledge each other and the user. Keep it brief.` }
          ],
          max_tokens: 600,
          temperature: 0.85,
        }),
      });

      if (!aiRes.ok) {
        throw new Error(`AI API error: ${aiRes.status}`);
      }

      const aiData = await aiRes.json();
      const response = extractFinalResponse(aiData.choices?.[0]?.message?.content || '...');
      
      db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
        [telegramId, 'assistant', response]);
      
      await sendTelegramMessage(chatId, `📞 <b>${newCharacterName} joined!</b>\n\n${response}\n\n<i>💬 Reply to continue\n/end - Stop chat</i>`);
      return { ok: true };
    }

    // /feedback command
    if (text.startsWith('/feedback')) {
      const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
        await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
        return { ok: true };
      }

      const dialogue = text.replace('/feedback', '').trim();
      
      if (!dialogue) {
        await sendTelegramMessage(chatId, '📝 Usage: /feedback [dialogue to analyze]\n\nExample: /feedback "I never asked for your help."');
        return { ok: true };
      }

      await sendTypingIndicator(chatId);

      const aiConfig = await getAIConfig(db);
      const aiRes = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'You are a dialogue quality analyzer. Analyze the given dialogue and provide a score (1-10) and brief feedback on authenticity, subtext, and emotional impact. Return ONLY: Score: X/10 - [brief feedback]' },
            { role: 'user', content: `Analyze this dialogue:\n\n"${dialogue}"` }
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (!aiRes.ok) {
        throw new Error(`AI API error: ${aiRes.status}`);
      }

      const aiData = await aiRes.json();
      const feedback = extractFinalResponse(aiData.choices?.[0]?.message?.content || 'Analysis unavailable');
      
      await sendTelegramMessage(chatId, `📝 <b>Dialogue Analysis:</b>\n\n${feedback}`);
      return { ok: true };
    }

    // /help command
    if (text.startsWith('/help')) {
      const helpMsg = `🎬 <b>ScriptFlow Bot Commands</b>

<b>Navigation:</b>
/start - Main menu with buttons
/scripts - Choose a script to work with

<b>Character Chat:</b>
(Tap a character from your script)
/call [name] - Invite another character
/end - End current chat

<b>Creative Tools:</b>
/discuss [topic] - Brainstorm ideas
/idea [text] - Save a breakthrough idea
/summary - View saved ideas
/feedback [dialogue] - Analyze dialogue

<b>Examples:</b>
/discuss a thriller about a lost phone
/idea The twist: she's been dead all along
/feedback "I never asked for your help."`;
      
      await sendTelegramMessage(chatId, helpMsg);
      return { ok: true };
    }

    // /admin commands
    if (text.startsWith('/admin')) {
      const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
      
      if (links.length === 0 || ((links[0] as any).user_id as string).startsWith('PENDING_')) {
        await sendTelegramMessage(chatId, '❌ Please link your account first with /link');
        return { ok: true };
      }

      const userId = (links[0] as any).user_id;
      const users = db.query('SELECT is_admin FROM users WHERE id = ?').get(userId);
      
      if ((users as any)?.is_admin !== true) {
        await sendTelegramMessage(chatId, '⛔ Admin access required.');
        return { ok: true };
      }

      const subCommand = text.replace('/admin', '').trim();

      if (subCommand === 'stats' || subCommand === '') {
        const usersResult = db.query('SELECT COUNT(*) as count FROM users').get();
        const scriptsResult = db.query('SELECT COUNT(*) as count FROM scripts').get();
        const collabsResult = db.query('SELECT COUNT(*) as count FROM script_collaborators').get();
        
        await sendTelegramMessage(chatId, `📊 <b>ScriptFlow Statistics</b>

👥 Users: ${(usersResult as any)?.count || 0}
📝 Scripts: ${(scriptsResult as any)?.count || 0}
🤝 Collaborations: ${(collabsResult as any)?.count || 0}`);
        return { ok: true };
      }

      await sendTelegramMessage(chatId, '❓ Unknown admin command.');
      return { ok: true };
    }

    // Default: Handle conversation (character chat or brainstorming)
    const links = db.query('SELECT * FROM telegram_links WHERE telegram_id = ?').all(telegramId);
    
    if (links.length > 0 && !((links[0] as any).user_id as string).startsWith('PENDING_')) {
      // Check for active character chat
      const sessions = db.query('SELECT * FROM telegram_sessions WHERE telegram_id = ?').all(telegramId);
      
      if (sessions.length > 0) {
        const characterName = (sessions[0] as any).character_name;
        
        db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
          [telegramId, 'user', text]);
        
        const history = db.query('SELECT role, content FROM telegram_conversations WHERE telegram_id = ? ORDER BY id ASC').all(telegramId);
        
        const messages = (history as any[]).slice(-10).map((h: any) => ({
          role: h.role,
          content: h.content
        }));

        await sendTypingIndicator(chatId);

        const aiConfig = await getAIConfig(db);
        const aiRes = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`,
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages,
            max_tokens: 500,
            temperature: 0.8,
          }),
        });

        if (!aiRes.ok) {
          throw new Error(`AI API error: ${aiRes.status}`);
        }

        const aiData = await aiRes.json();
        const response = extractFinalResponse(aiData.choices?.[0]?.message?.content || '...');
        
        db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
          [telegramId, 'assistant', response]);
        
        await sendTelegramMessage(chatId, `🎭 <b>${characterName}:</b>\n\n${response}`);
        return { ok: true };
      }
      
      // Check for active brainstorming session
      const brainstorm = db.query('SELECT * FROM telegram_brainstorm WHERE telegram_id = ?').get(telegramId) as any;
      
      if (brainstorm) {
        const history = db.query('SELECT role, content FROM telegram_conversations WHERE telegram_id = ? ORDER BY id ASC').all(telegramId);
        const messages = (history as any[])
          .filter((h: any) => h.role !== 'system' || h.content !== 'BRAINSTORM_SESSION')
          .slice(-8)
          .map((h: any) => ({
            role: h.role === 'system' ? 'system' : h.role,
            content: h.content
          }));

        await sendTypingIndicator(chatId);

        const aiConfig = await getAIConfig(db);
        const aiRes = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`,
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              { role: 'system', content: `You are a creative writing partner helping brainstorm "${brainstorm.topic}". Be encouraging, ask probing questions, suggest creative directions. Keep responses concise (2-4 sentences).` },
              ...messages,
              { role: 'user', content: text }
            ],
            max_tokens: 500,
            temperature: 0.85,
          }),
        });

        if (!aiRes.ok) {
          throw new Error(`AI API error: ${aiRes.status}`);
        }

        const aiData = await aiRes.json();
        const response = extractFinalResponse(aiData.choices?.[0]?.message?.content || '...');
        
        db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
          [telegramId, 'user', text]);
        db.run('INSERT INTO telegram_conversations (telegram_id, role, content) VALUES (?, ?, ?)', 
          [telegramId, 'assistant', response]);
        
        await sendTelegramMessage(chatId, `💡 ${response}\n\n<i>/idea [text] - Save breakthrough\n/summary - View ideas\n/end - Stop</i>`);
        return { ok: true };
      }
      
      // No active session - show options
      await sendTelegramMessage(chatId, '💡 Use the buttons below or type a command:', 'HTML', {
        inline_keyboard: [
          [{ text: '📚 My Scripts', callback_data: 'list_scripts' }],
          [{ text: '💡 Brainstorm Ideas', callback_data: 'global_brainstorm' }]
        ]
      });
    } else {
      await sendTelegramMessage(chatId, '👋 Welcome! Use /start to begin.');
    }

  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    const errorMessage = err?.message || 'Unknown error';
    
    await sendTelegramMessage(chatId, `❌ <b>Error</b>\n\n${errorMessage}\n\n<i>Please try again.</i>`);
    return { ok: false, error: errorMessage };
  }

  return { ok: true };
}
