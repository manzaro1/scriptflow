import type { ScriptBlock, ScriptMode, AITool, AIAnalysisResult } from "../types";
import { getModeConfig } from "./mode-config";

const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

/**
 * Call Pollinations OpenAI-compatible chat completions endpoint.
 * Works without a key (free tier) or with a Pollinations API key for higher limits.
 */
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7,
  apiKey?: string
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(POLLINATIONS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: "Reply with just the word OK." }],
        max_tokens: 5,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function generateScene(
  premise: string,
  tone: string,
  length: string,
  characters: string[],
  apiKey?: string,
  mode: ScriptMode = "screenplay"
): Promise<ScriptBlock[]> {
  const config = getModeConfig(mode);
  const lengthGuide =
    length === "short" ? "5-10" : length === "medium" ? "10-20" : "20-35";
  const charInstruction =
    characters.length > 0
      ? `Feature these characters: ${characters.join(", ")}.`
      : "";

  const allowedTypes = config.elementTypes.map((t) => `"${t}"`).join(", ");

  const systemPrompt = `${config.aiPromptPrefix}
Tone: ${tone}
${charInstruction}
Target length: ${lengthGuide} blocks.

Return a JSON array of blocks where each has:
- "id": unique string (use random short alphanumeric)
- "type": one of ${allowedTypes}
- "content": the text content

Return ONLY valid JSON array, no markdown fences.`;

  const text = await callAI(systemPrompt, premise, 0.8, apiKey);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse generated scene");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Empty scene generated");
  }

  return parsed as ScriptBlock[];
}

export async function autocomplete(
  blocks: ScriptBlock[],
  currentIndex: number,
  apiKey?: string
): Promise<string> {
  const context = blocks
    .slice(Math.max(0, currentIndex - 5), currentIndex + 1)
    .map((b) => `[${b.type.toUpperCase()}] ${b.content}`)
    .join("\n");

  const systemPrompt = `You are an expert screenwriter. Given the screenplay context, suggest a natural continuation for the current block. Return ONLY the continuation text (a few words to one sentence), no labels or formatting.`;

  return callAI(systemPrompt, context, 0.7, apiKey);
}

const TOOL_PROMPTS: Record<AITool, string> = {
  doctor: `You are an expert Script Doctor. Analyze the following screenplay for:
- Pacing issues
- Weak dialogue
- Character consistency
- Scene structure problems
- Formatting errors
Return a JSON object with:
- "summary": a 1-2 sentence overview
- "items": array of { "title": string, "description": string, "blockIndex"?: number }
Return ONLY valid JSON, no markdown fences.`,

  tone: `You are a film tone analyst. Analyze the following screenplay and identify:
- Overall tone/mood
- Tone shifts between scenes
- Emotional arcs
- Consistency issues
Return a JSON object with:
- "summary": a 1-2 sentence overview of the tone
- "items": array of { "title": string, "description": string, "blockIndex"?: number }
Return ONLY valid JSON, no markdown fences.`,

  plotHoles: `You are a screenplay continuity expert. Analyze the following screenplay for:
- Plot holes and inconsistencies
- Unresolved character actions
- Timeline issues
- Logic gaps
Return a JSON object with:
- "summary": a 1-2 sentence overview
- "items": array of { "title": string, "description": string, "blockIndex"?: number }
Return ONLY valid JSON, no markdown fences.`,
};

export async function analyzeScript(
  blocks: ScriptBlock[],
  tool: AITool,
  apiKey?: string
): Promise<AIAnalysisResult> {
  const scriptText = blocks
    .map((b, i) => `[${i}][${b.type.toUpperCase()}] ${b.content}`)
    .join("\n");

  const text = await callAI(TOOL_PROMPTS[tool], scriptText, 0.5, apiKey);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse analysis");

  return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
}

/**
 * Parse raw text (from a document) into script blocks using AI.
 */
export async function parseDocumentToBlocks(
  rawText: string,
  apiKey?: string
): Promise<ScriptBlock[]> {
  const systemPrompt = `You are an expert screenplay formatter. Given raw text from a document, parse it into properly formatted screenplay blocks.

Return a JSON array of blocks where each has:
- "id": unique string (use random short alphanumeric)
- "type": one of "slugline", "action", "character", "dialogue", "parenthetical", "transition"
- "content": the text content

Identify scene headings (INT./EXT.), character names (all caps before dialogue), dialogue, action lines, parentheticals, and transitions.
If the text is not a screenplay, convert it into screenplay format as best you can.
Return ONLY valid JSON array, no markdown fences.`;

  const text = await callAI(systemPrompt, rawText, 0.3, apiKey);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse document");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("No blocks parsed from document");
  }

  return parsed as ScriptBlock[];
}

/**
 * Generate a visual description for a storyboard frame from scene blocks.
 */
export async function generateVisualDescription(
  sceneBlocks: ScriptBlock[],
  apiKey?: string
): Promise<string> {
  const sceneText = sceneBlocks
    .map((b) => `[${b.type.toUpperCase()}] ${b.content}`)
    .join("\n");

  const systemPrompt = `You are a storyboard artist. Given a screenplay scene, describe the key visual for a single storyboard frame. Include: setting, character positions, lighting, mood, and camera angle suggestion. Return just the visual description in 2-3 sentences, no JSON.`;

  return callAI(systemPrompt, sceneText, 0.7, apiKey);
}
