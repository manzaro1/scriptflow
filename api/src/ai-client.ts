/**
 * Server-side AI Client
 * Uses environment variables for AI configuration.
 */

export interface AIResponse {
  text: string;
  error: string | null;
}

/**
 * Extract final answer from K2-Think model output
 * Removes chain-of-thought reasoning and returns only the final response
 */
function extractK2ThinkFinalResponse(content: string): string {
  if (!content) return '';

  const trimmed = content.trim();

  // K2-Think uses ``` on its own line to separate reasoning from final answer
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

  return content.trim();
}

/**
 * Send a prompt to the AI and get a response.
 */
export async function aiPrompt(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7
): Promise<AIResponse> {
  const apiKey = process.env.AI_API_KEY || '';
  const baseUrl = process.env.AI_BASE_URL || '';
  const model = process.env.AI_MODEL || '';

  // Fallback to NVIDIA if K2-Think not configured
  const nvidiaApiKey = process.env.NVIDIA_API_KEY || '';

  const effectiveApiKey = apiKey || nvidiaApiKey;
  const effectiveBaseUrl = baseUrl || 'https://integrate.api.nvidia.com/v1';
  const effectiveModel = model || 'moonshotai/kimi-k2.5';

  if (!effectiveApiKey) {
    return { text: '', error: 'NO_API_KEY' };
  }

  try {
    const res = await fetch(`${effectiveBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      console.error(`[aiPrompt] API error (${res.status}):`, errText);
      return { text: '', error: `API error: ${res.status}` };
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Handle NVIDIA reasoning models
    if (!content && data.choices?.[0]?.message?.reasoning) {
      content = data.choices[0].message.reasoning;
    }

    // Extract final response from K2-Think format
    const text = extractK2ThinkFinalResponse(content);
    return { text, error: null };
  } catch (err: any) {
    console.error('[aiPrompt] Error:', err);
    return { text: '', error: err.message || 'Request failed' };
  }
}