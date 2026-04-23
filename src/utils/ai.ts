import { aiChat, aiPrompt } from './ai-client';
import { loadAIConfig } from './ai-providers';
import { extractJSONFromResponse } from './json-extract';

/**
 * Check if user has an AI provider configured.
 * Returns true if using server provider (no key needed) or if a key is set.
 */
export const hasGeminiKey = (): boolean => {
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
          .join('\\n');

        const { text, error } = await aiPrompt(
          `You are a screenplay writing assistant. Continue the screenplay from where the writer left off. Write 1-2 lines of natural continuation that matches the tone, style, and formatting. Return ONLY the continuation text, no labels or explanations.`,
          `Here is the screenplay context:\\n${context}\\n\\nContinue from the last line:`,
          0.7
        );

        if (error) return { data: null, error };
        return { data: { suggestion: text.trim() } as T, error: null };
      }

      case 'ai-character-chat': {
        const { characterName, characterDialogue, userMessage, conversationHistory, characterProfile } = body;
        const dialogueContext = (characterDialogue || []).slice(0, 10).join('\\n');
        
        // Enhanced character context with profile data
        const profileContext = characterProfile 
          ? `\\n\\nCHARACTER DETAILS:\\n- Role: ${characterProfile.role || 'Unknown'}\\n- Age: ${characterProfile.age || 'Unknown'}\\n- Setting: ${characterProfile.setting || 'Various'}\\n- Scenes: ${characterProfile.scenes?.length || 0} scenes\\n- Dialogue blocks: ${characterProfile.dialogues?.length || 0} lines\\n- Interacts with: ${characterProfile.interactions?.join(', ') || 'Various characters'}`
          : '';

        const { text, error } = await aiChat({
          messages: [
            {
              role: 'system',
              content: `You are roleplaying as ${characterName}.

IMPORTANT: You ARE this person. Not an AI pretending. You simply ARE them.

Your personality, memories, and way of speaking from the screenplay:
${dialogueContext || '(No lines yet - create your own personality)'}
${profileContext}

RULES:
- Stay in character always
- Speak naturally, like a real person
- Use "I" and "me" - you are this person
- React emotionally - have feelings
- Never mention being an AI, a character, or the script
- Answer as if you're really having this conversation
- If asked about changing your dialogue, you can suggest alternatives that fit your personality
- You know which scenes you appear in and what happens in them

Be ${characterName}. Respond as yourself.`,
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
          .join('\\n');

        const { text, error } = await aiPrompt(
          `You are an expert screenplay dialogue coach. Analyze the following dialogue and provide constructive feedback.

Return a JSON object with:
- "overall_score": number 1-10
- "feedback": array of objects with "category" (string), "score" (number 1-10), "comment" (string)

Categories to evaluate: "Authenticity", "Subtext", "Character Voice", "Pacing", "Conflict"

Return ONLY valid JSON, no markdown fences.`,
          `Character: ${characterName}\\nDialogue: "${dialogue}"\\n\\nScene context:\\n${context}`,
          0.3
        );

        if (error) return { data: null, error };

        const parsed = extractJSONFromResponse(text);
        if (parsed) {
          return { data: parsed as T, error: null };
        }
        return { data: null, error: 'Failed to parse feedback response' };
      }

      case 'ai-script-analysis': {
        const { blocks: scriptBlocks } = body;
        const scriptText = (scriptBlocks || [])
          .map((b: any, i: number) => `[${i}:${b.type}] ${b.content}`)
          .join('\\n');

        const { text, error } = await aiPrompt(
          `You are a professional screenplay analyst. Your job is to analyze screenplays and provide actionable insights.

TASK: Analyze this screenplay and provide:
1. Character analysis - who are they, how well-developed are they (0-100), what's their status
2. Pacing analysis - tension, emotional payoff, subplot convergence
3. Key observations - strengths, warnings, suggestions
4. Story requirements - what milestones are met or pending

Return a JSON object with this EXACT structure:
{
  "characters": [{ "name": "Character Name", "score": 75, "status": "Well-developed", "trend": "up", "note": "Brief note about character" }],
  "pacing": { "tension": 70, "emotionalPayoff": 60, "subplotConvergence": 50, "overallRhythm": "Building momentum" },
  "observations": [{ "type": "strength", "text": "Strong dialogue" }, { "type": "warning", "text": "Slow pacing in act 2" }],
  "requirements": [{ "text": "Inciting incident", "completed": true }, { "text": "Midpoint twist", "completed": false }]
}

CRITICAL: Return ONLY valid JSON. No explanation, no markdown fences, just the JSON object.`,
          scriptText.substring(0, 8000),
          0.3
        );

        if (error) return { data: null, error };

        console.log('[ai-script-analysis] Response length:', text?.length);

        const parsed = extractJSONFromResponse(text);
        if (parsed) {
          // Ensure all fields have defaults
          const result = {
            characters: parsed.characters || [],
            pacing: {
              tension: parsed.pacing?.tension || 50,
              emotionalPayoff: parsed.pacing?.emotionalPayoff || 50,
              subplotConvergence: parsed.pacing?.subplotConvergence || 50,
              overallRhythm: parsed.pacing?.overallRhythm || 'Unknown',
            },
            observations: parsed.observations || [],
            requirements: parsed.requirements || [],
          };
          return { data: result as T, error: null };
        }
        
        console.error('[ai-script-analysis] JSON parse failed, raw:', text?.substring(0, 300));
        return { 
          data: {
            characters: [],
            pacing: { tension: 50, emotionalPayoff: 50, subplotConvergence: 50, overallRhythm: 'Unknown' },
            observations: [{ type: 'warning', text: 'Analysis could not be completed. Please try again.' }],
            requirements: []
          } as T, 
          error: null 
        };
      }

      default:
        return { data: null, error: `Unknown AI function: ${functionName}` };
    }
  } catch (err: any) {
    console.error('[callAIFunction] Error:', err);
    return { data: null, error: err.message || 'AI request failed' };
  }
};
