/**
 * Unified AI Client
 * Routes requests to the correct provider based on config.
 * Gemini goes through Supabase edge functions; OpenAI/Anthropic/Custom go direct.
 */

import { loadAIConfig, AIProvider } from './ai-providers';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  error: string | null;
}

export type AIErrorCode = 'NO_API_KEY' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'INVALID_KEY' | 'UNKNOWN';

export class AIError extends Error {
  code: AIErrorCode;
  constructor(message: string, code: AIErrorCode) {
    super(message);
    this.code = code;
  }
}

function getErrorCode(status: number): AIErrorCode {
  if (status === 401 || status === 403) return 'INVALID_KEY';
  if (status === 429) return 'RATE_LIMIT';
  return 'UNKNOWN';
}

/**
 * Send a chat completion request to the configured AI provider.
 */
export async function aiChat(options: AIRequestOptions): Promise<AIResponse> {
  const config = loadAIConfig();

  if (config.provider !== 'server' && !config.apiKey && config.provider !== 'custom') {
    return { text: '', error: 'NO_API_KEY' };
  }
  if (config.provider === 'custom' && !config.baseUrl) {
    return { text: '', error: 'NO_API_KEY' };
  }

  try {
    switch (config.provider) {
      case 'server':
        return await callServer(options);
      case 'k2think':
        return await callK2Think(config.apiKey, config.model, options);
      case 'nvidia':
        return await callNVIDIA(config.apiKey, config.model, options);
      case 'gemini':
        return await callGemini(config.apiKey, config.model, options);
      case 'openai':
        return await callOpenAI(config.apiKey, config.model, options);
      case 'anthropic':
        return await callAnthropic(config.apiKey, config.model, options);
      case 'custom':
        return await callCustom(config.apiKey, config.baseUrl!, config.model, options);
      default:
        return { text: '', error: 'Unknown provider' };
    }
  } catch (err: any) {
    if (err instanceof AIError) {
      return { text: '', error: err.message };
    }
    return { text: '', error: err.message || 'Network error' };
  }
}

/**
 * Convenience: send a single prompt and get text back.
 */
export async function aiPrompt(systemPrompt: string, userPrompt: string, temperature = 0.7): Promise<AIResponse> {
  return aiChat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
  });
}

/**
 * Call via Supabase edge function (legacy path, still used for Gemini).
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    if (error) return { data: null, error: error.message || 'Edge function error' };
    if (data?.error === 'NO_API_KEY') return { data: null, error: 'NO_API_KEY' };
    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

/**
 * Extract final answer from K2-Think model output
 * Removes chain-of-thought reasoning and returns only the final response
 */
export function extractK2ThinkFinalResponse(content: string): string {
  if (!content) return '';

  let trimmed = content.trim();

  // Pattern 0: K2-Think uses  tag to separate reasoning from final answer
  // Format: (thinking)...(slash-think)final answer
  // Also handle HTML-encoded version: &lt;/think&gt;
  const thinkPatterns = ['\x3C/think\x3E', '&lt;/think&gt;'];
  for (const pattern of thinkPatterns) {
    if (trimmed.includes(pattern)) {
      const parts = trimmed.split(pattern);
      if (parts.length > 1) {
        const finalAnswer = parts[1].trim();
        if (finalAnswer) {
          return finalAnswer;
        }
      }
    }
  }

  // Pattern 1: K2-Think uses ``` on its own line to separate reasoning from final answer
  // Pattern: reasoning text\n```\nfinal answer
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
      return result.join('\n').trim();
    }
  }

  // Alternative markers
  if (content.includes('### Response') || content.includes('### Answer')) {
    const markers = ['### Response', '### Answer', '### Final'];
    for (const marker of markers) {
      if (content.includes(marker)) {
        const idx = content.indexOf(marker);
        return content.substring(idx + marker.length).trim();
      }
    }
  }

  // Pattern: Look for "**Name:**" pattern (character response format)
  const nameMatch = content.match(/\*\*[^*]+:\*\*\s*/);
  if (nameMatch) {
    const idx = content.indexOf(nameMatch[0]);
    if (idx > 100) {
      return content.substring(idx).trim();
    }
  }

  // Pattern: Look for dialogue-like patterns
  const dialoguePatterns = [
    /\n\n"I/m,
    /\n\n'I/m,
    /\n\n[A-Z][a-z]+:/m,
    /\n\n[A-Z][a-z]+ [a-z]+:/m,
  ];

  for (const pattern of dialoguePatterns) {
    const match = content.match(pattern);
    if (match && match.index! > 200) {
      return content.substring(match.index! + 2).trim();
    }
  }

  // Pattern: If response is very long, try to find where actual content starts
  if (content.length > 1000) {
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 3) {
      for (let i = paragraphs.length - 1; i >= Math.max(0, paragraphs.length - 5); i--) {
        const p = paragraphs[i].trim();
        if (p.startsWith('We ') || p.startsWith('But ') || p.startsWith('Let ') ||
            p.startsWith('Alright') || p.startsWith('Now ') || p.includes('need to')) {
          continue;
        }
        if (p.length > 30) {
          return paragraphs.slice(i).join('\n\n').trim();
        }
      }
    }
  }

  // Fallback: If still very long, truncate to last 500 chars
  if (content.length > 500) {
    const lastPart = content.substring(content.length - 500);
    const firstNewline = lastPart.indexOf('\n\n');
    if (firstNewline > 0 && firstNewline < 100) {
      return lastPart.substring(firstNewline).trim();
    }
    return lastPart.trim();
  }

  return content.trim();
}

/**
 * Extract JSON from AI response that may contain reasoning prefix
 */
function extractJSONFromResponse(text: string): any {
  if (!text) return null;
  
  // First extract final response if it contains K2-Think markers
  let cleaned = extractK2ThinkFinalResponse(text);
  
  // Remove markdown code fences
  cleaned = cleaned
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
  
  // Find JSON object or array boundaries
  const objStart = cleaned.indexOf('{');
  const arrStart = cleaned.indexOf('[');
  
  let start = -1;
  let end = -1;
  
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    start = objStart;
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      if (cleaned[i] === '}') depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  } else if (arrStart !== -1) {
    start = arrStart;
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '[') depth++;
      if (cleaned[i] === ']') depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  
  if (start !== -1 && end !== -1) {
    const jsonStr = cleaned.substring(start, end);
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON parse failed:', e);
      return null;
    }
  }
  
  return null;
}

// --- Provider implementations ---

async function callServer(opts: AIRequestOptions): Promise<AIResponse> {
  try {
    const data = await api.aiChat({
      messages: opts.messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    });

    let content = data.choices?.[0]?.message?.content || '';
    if (!content && data.choices?.[0]?.message?.reasoning) {
      content = data.choices[0].message.reasoning;
    }

    const text = extractK2ThinkFinalResponse(content);
    return { text, error: null };
  } catch (err: any) {
    throw new AIError(err.message || 'Server AI error', 'UNKNOWN');
  }
}

async function callGemini(apiKey: string, model: string, opts: AIRequestOptions): Promise<AIResponse> {
  const contents = opts.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const systemInstruction = opts.messages.find(m => m.role === 'system');

  const body: any = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }
  if (opts.temperature !== undefined) {
    body.generationConfig = { temperature: opts.temperature, maxOutputTokens: opts.maxTokens || 2048 };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${encodeURIComponent(apiKey)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    throw new AIError(`Gemini API error (${res.status})`, getErrorCode(res.status));
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text, error: null };
}

async function callOpenAI(apiKey: string, model: string, opts: AIRequestOptions): Promise<AIResponse> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: opts.messages,
      max_tokens: opts.maxTokens || 2048,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    throw new AIError(`OpenAI API error (${res.status})`, getErrorCode(res.status));
  }

  const json = await res.json();
  return { text: json.choices?.[0]?.message?.content || '', error: null };
}

async function callAnthropic(apiKey: string, model: string, opts: AIRequestOptions): Promise<AIResponse> {
  const systemMsg = opts.messages.find(m => m.role === 'system')?.content;
  const messages = opts.messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const body: any = {
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: opts.maxTokens || 2048,
    messages,
  };
  if (systemMsg) body.system = systemMsg;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new AIError(`Anthropic API error (${res.status})`, getErrorCode(res.status));
  }

  const json = await res.json();
  return { text: json.content?.[0]?.text || '', error: null };
}

async function callCustom(apiKey: string, baseUrl: string, model: string, opts: AIRequestOptions): Promise<AIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'llama3',
      messages: opts.messages,
      max_tokens: opts.maxTokens || 2048,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    throw new AIError(`Custom API error (${res.status})`, getErrorCode(res.status));
  }

  const json = await res.json();
  return { text: json.choices?.[0]?.message?.content || '', error: null };
}

async function callK2Think(apiKey: string, model: string, opts: AIRequestOptions): Promise<AIResponse> {
  const res = await fetch('https://build-api.k2think.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'MBZUAI-IFM/K2-Think-v2',
      messages: opts.messages,
      max_tokens: opts.maxTokens || 2048,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new AIError(`K2-Think API error (${res.status}): ${errText}`, getErrorCode(res.status));
  }

  const json = await res.json();
  const rawContent = json.choices?.[0]?.message?.content || '';
  const text = extractK2ThinkFinalResponse(rawContent);
  return { text, error: null };
}

async function callNVIDIA(apiKey: string, model: string, opts: AIRequestOptions): Promise<AIResponse> {
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'moonshotai/kimi-k2.5',
      messages: opts.messages,
      max_tokens: opts.maxTokens || 2048,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new AIError(`NVIDIA API error (${res.status}): ${errText}`, getErrorCode(res.status));
  }

  const json = await res.json();
  let content = json.choices?.[0]?.message?.content || '';
  if (!content && json.choices?.[0]?.message?.reasoning) {
    content = json.choices[0].message.reasoning;
  }
  return { text: content, error: null };
}
