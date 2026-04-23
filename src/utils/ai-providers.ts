/**
 * AI Provider Configuration
 * Supports multiple AI providers including Google Gemini, OpenAI, Anthropic, and custom APIs
 */

export type AIProvider = 'server' | 'gemini' | 'openai' | 'anthropic' | 'custom' | 'k2think' | 'nvidia';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;  // For custom providers
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  description: string;
  defaultModel: string;
  models: string[];
  baseUrl?: string;
  requiresApiKey: boolean;
}

export const AI_PROVIDERS: ProviderInfo[] = [
  {
    id: 'server',
    name: 'ScriptFlow AI',
    description: 'Built-in AI — no API key needed',
    defaultModel: '',
    models: [],
    requiresApiKey: false,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    description: 'NVIDIA NIM API with Kimi and Qwen models',
    defaultModel: 'moonshotai/kimi-k2.5',
    models: ['moonshotai/kimi-k2.5', 'qwen/qwen3.5-122b-a10b', 'meta/llama-3.1-405b-instruct', 'meta/llama-3.1-70b-instruct'],
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    requiresApiKey: true,
  },
  {
    id: 'k2think',
    name: 'K2-Think',
    description: 'K2-Think reasoning model',
    defaultModel: 'MBZUAI-IFM/K2-Think-v2',
    models: ['MBZUAI-IFM/K2-Think-v2'],
    baseUrl: 'https://build-api.k2think.ai/v1',
    requiresApiKey: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s Gemini AI models',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    requiresApiKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT models',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Anthropic Claude models',
    defaultModel: 'claude-sonnet-4-20250514',
    models: ['claude-sonnet-4-20250514', 'claude-4-opus-20250514', 'claude-3.5-sonnet', 'claude-3-haiku'],
    baseUrl: 'https://api.anthropic.com/v1',
    requiresApiKey: true,
  },
  {
    id: 'custom',
    name: 'Custom API',
    description: 'OpenAI-compatible custom API (Ollama, LM Studio, etc.)',
    defaultModel: 'llama3',
    models: [],
    requiresApiKey: false,
  },
];

/**
 * Get provider info by provider ID
 */
export const getProviderInfo = (provider: AIProvider): ProviderInfo | undefined => {
  return AI_PROVIDERS.find(p => p.id === provider);
};

/**
 * Default AI configuration
 */
export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: 'server',
  apiKey: '',
  model: '',
};

/**
 * Load AI configuration from localStorage.
 * Ensures server provider is used if no valid config exists.
 */
export const loadAIConfig = (): AIProviderConfig => {
  try {
    const saved = localStorage.getItem('ai_provider_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the config has a valid provider
      if (parsed.provider && ['server', 'k2think', 'nvidia', 'gemini', 'openai', 'anthropic', 'custom'].includes(parsed.provider)) {
        // If provider is server, no key needed - always valid
        if (parsed.provider === 'server') {
          return { provider: 'server', apiKey: '', model: '' };
        }
        // For other providers, ensure apiKey exists (or baseUrl for custom)
        if (parsed.provider === 'custom' && parsed.baseUrl) {
          return parsed;
        }
        if (parsed.apiKey) {
          return parsed;
        }
        // Invalid config (missing key) - fall back to server
        return { provider: 'server', apiKey: '', model: '' };
      }
    }
  } catch (e) {
    console.error('Failed to load AI config:', e);
  }
  return { ...DEFAULT_AI_CONFIG };
};

/**
 * Save AI configuration to localStorage
 */
export const saveAIConfig = (config: AIProviderConfig): void => {
  try {
    localStorage.setItem('ai_provider_config', JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save AI config:', e);
  }
};

/**
 * Check if user has a valid API key for any provider
 */
export const hasAIKey = async (provider: AIProvider): Promise<boolean> => {
  if (provider === 'server') return true;

  const config = loadAIConfig();

  if (provider === 'custom') {
    // Custom provider doesn't require API key, just base URL
    return !!config.baseUrl;
  }

  return !!config.apiKey;
};

/**
 * Test API key for a provider
 */
export const testAPIKey = async (
  provider: AIProvider, 
  apiKey: string, 
  baseUrl?: string
): Promise<boolean> => {
  try {
    switch (provider) {
      case 'gemini': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Reply with OK.' }] }],
            }),
          }
        );
        return res.ok;
      }
      
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        return res.ok;
      }
      
      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });
        return res.ok || res.status === 400; // 400 means valid key but wrong request
      }
      
      case 'custom': {
        if (!baseUrl) return false;
        const res = await fetch(`${baseUrl}/models`, {
          headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
        });
        return res.ok;
      }
      
      default:
        return false;
    }
  } catch {
    return false;
  }
};
