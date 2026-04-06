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

// --- Provider implementations ---

async function callServer(opts: AIRequestOptions): Promise<AIResponse> {
  try {
    const data = await api.aiChat({
      messages: opts.messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    });
    const content = (data.choices?.[0]?.message?.content || '').replace(/^\n+/, '');
    return { text: content, error: null };
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
