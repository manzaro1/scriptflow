import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '';

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { geminiApiKey, premise, tone, existingCharacters } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const characterList = existingCharacters?.length
      ? `\nEXISTING CHARACTERS IN SCRIPT: ${existingCharacters.join(', ')}`
      : '';

    const prompt = `You are a professional screenwriter. Generate a complete screenplay scene based on the following premise.

PREMISE: ${premise}
TONE: ${tone || 'Dramatic'}${characterList}

Return the scene as a JSON array of script blocks. Each block must have:
- "type": one of "slugline", "action", "character", "dialogue", "parenthetical"
- "content": the text content

RULES:
- Start with a slugline (INT./EXT.)
- Follow standard screenplay formatting rules
- Character names should be UPPERCASE in character blocks
- Include a mix of action, dialogue, and description
- Generate 10-20 blocks for a meaningful scene
- If existing characters are provided, try to use them when they fit the premise
- Parentheticals should be in lowercase without surrounding parentheses
- Make the dialogue feel natural and emotionally resonant for the ${tone || 'Dramatic'} tone

Return ONLY the JSON array, no other text. Example format:
[
  {"type": "slugline", "content": "INT. INTERROGATION ROOM - NIGHT"},
  {"type": "action", "content": "A bare room. A single overhead light casts harsh shadows."},
  {"type": "character", "content": "DETECTIVE RILEY"},
  {"type": "dialogue", "content": "We found your prints on the weapon, Marco."}
]`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2000,
          }
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Gemini API error: ${res.status} ${errBody}`);
      throw new Error("AI service error");
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const blocks = JSON.parse(jsonStr);

    // Validate and clean blocks
    const validTypes = ['slugline', 'action', 'character', 'dialogue', 'parenthetical'];
    const cleanedBlocks = blocks
      .filter((b: any) => b && typeof b.content === 'string' && validTypes.includes(b.type))
      .map((b: any, i: number) => ({
        id: `gen_${Date.now()}_${i}`,
        type: b.type,
        content: b.type === 'slugline' || b.type === 'character' ? b.content.toUpperCase() : b.content,
      }));

    return new Response(
      JSON.stringify({ blocks: cleanedBlocks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[ai-generate-scene]", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to generate scene" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
