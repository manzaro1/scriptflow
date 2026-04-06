import { aiChat, aiPrompt } from './ai-client';
import { loadAIConfig } from './ai-providers';

/**
 * Check if user has an AI provider configured.
 * Returns true if using server provider (no key needed) or if a key is set.
 */
export const hasGeminiKey = async (): Promise<boolean> => {
  const config = loadAIConfig();
  if (config.provider === 'server') return true;
  if (config.provider === 'custom') return !!config.baseUrl;
  return !!config.apiKey;
};

/**
 * Invoke an AI function by name, routing through the unified AI client
 * instead of Supabase edge functions.
 */
export const callAIFunction = async <T = any>(
  functionName: string,
  body: Record<string, any>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    switch (functionName) {
      case 'ai-autocomplete': {
        const { blocks, currentBlockIndex } = body;
        const context = (blocks || [])
          .slice(Math.max(0, currentBlockIndex - 5), currentBlockIndex + 1)
          .map((b: any) => `[${b.type}] ${b.content}`)
          .join('\n');

        const { text, error } = await aiPrompt(
          `You are a screenplay writing assistant. Continue the screenplay from where the writer left off. Write 1-2 lines of natural continuation that matches the tone, style, and formatting. Return ONLY the continuation text, no labels or explanations.`,
          `Here is the screenplay context:\n${context}\n\nContinue from the last line:`,
          0.7
        );

        if (error) return { data: null, error };
        return { data: { suggestion: text.trim() } as T, error: null };
      }

      case 'ai-character-chat': {
        const { characterName, userMessage, characterDialogue, conversationHistory } = body;
        const dialogueContext = (characterDialogue || []).slice(0, 10).join('\n');
        const history = (conversationHistory || [])
          .map((m: any) => `${m.role === 'user' ? 'User' : characterName}: ${m.content}`)
          .join('\n');

        const { text, error } = await aiChat({
          messages: [
            {
              role: 'system',
              content: `You are ${characterName} from a screenplay. Stay in character at all times. Here are some of your lines from the script for reference:\n${dialogueContext}\n\nRespond as ${characterName} would, matching their voice, personality, and speech patterns from the script.`,
            },
            ...(conversationHistory || []).map((m: any) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user' as const, content: userMessage },
          ],
          temperature: 0.8,
        });

        if (error) return { data: null, error };
        return { data: { response: text.trim() } as T, error: null };
      }

      case 'ai-dialogue-feedback': {
        const { dialogue, characterName, surroundingBlocks } = body;
        const context = (surroundingBlocks || [])
          .map((b: any) => `[${b.type}] ${b.content}`)
          .join('\n');

        const { text, error } = await aiPrompt(
          `You are an expert screenplay dialogue coach. Analyze the following dialogue and provide constructive feedback.

Return a JSON object with:
- "overall_score": number 1-10
- "feedback": array of objects with "category" (string), "score" (number 1-10), "comment" (string)

Categories to evaluate: "Authenticity", "Subtext", "Character Voice", "Pacing", "Conflict"

Return ONLY valid JSON, no markdown fences.`,
          `Character: ${characterName}\nDialogue: "${dialogue}"\n\nScene context:\n${context}`,
          0.3
        );

        if (error) return { data: null, error };

        try {
          let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const objStart = cleaned.indexOf('{');
          const objEnd = cleaned.lastIndexOf('}');
          if (objStart !== -1 && objEnd !== -1) {
            cleaned = cleaned.substring(objStart, objEnd + 1);
          }
          const parsed = JSON.parse(cleaned);
          return { data: parsed as T, error: null };
        } catch {
          return { data: null, error: 'Failed to parse feedback response' };
        }
      }

      default:
        return { data: null, error: `Unknown AI function: ${functionName}` };
    }
  } catch (err: any) {
    return { data: null, error: err.message || 'AI request failed' };
  }
};
