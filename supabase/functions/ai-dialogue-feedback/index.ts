import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { geminiApiKey, dialogue, characterName, surroundingBlocks } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contextText = surroundingBlocks?.map((b: any) => {
      if (b.type === 'slugline') return `[SCENE: ${b.content}]`;
      if (b.type === 'character') return `\n${b.content}:`;
      if (b.type === 'dialogue') return `  "${b.content}"`;
      if (b.type === 'parenthetical') return `  (${b.content})`;
      return b.content;
    }).join('\n') || '';

    const prompt = `You are an expert screenplay dialogue coach. Analyze the following dialogue line and provide feedback.

CHARACTER: ${characterName}
DIALOGUE LINE: "${dialogue}"

SCRIPT CONTEXT:
${contextText}

Analyze the dialogue and return a JSON object with:
1. "score": a consistency/quality score from 0-100 (consider: does it fit the character? is it natural? does it advance the scene?)
2. "feedback": a brief 1-2 sentence analysis of the line (what works, what doesn't)
3. "suggestions": an array of exactly 3 alternative dialogue lines that could work better or differently, each with a brief note about the approach

Return ONLY valid JSON in this exact format:
{
  "score": 78,
  "feedback": "The line feels slightly generic for this character. Consider...",
  "suggestions": [
    {"text": "Alternative dialogue here", "note": "More aggressive approach"},
    {"text": "Another option", "note": "Softer, more vulnerable"},
    {"text": "Third option", "note": "Subtext-heavy, indirect"}
  ]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

    let jsonStr = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
