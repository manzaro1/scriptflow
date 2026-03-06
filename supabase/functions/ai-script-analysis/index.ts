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

    const { geminiApiKey, blocks } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format script for analysis
    const scriptText = blocks.map((b: any) => {
      switch (b.type) {
        case 'slugline': return `\n${b.content.toUpperCase()}\n`;
        case 'character': return `\n  ${b.content.toUpperCase()}`;
        case 'dialogue': return `    ${b.content}`;
        case 'parenthetical': return `    (${b.content})`;
        case 'action': return `\n${b.content}`;
        default: return b.content;
      }
    }).join('\n');

    const prompt = `You are an expert script supervisor and story analyst. Analyze the following screenplay and provide a detailed production intelligence report.

SCREENPLAY:
${scriptText}

Return a JSON object with this exact structure:
{
  "characters": [
    {
      "name": "CHARACTER NAME",
      "score": 85,
      "status": "On Track" or "Needs Work" or "Strong",
      "trend": "up" or "down" or "stable",
      "note": "Brief observation about this character's arc or voice"
    }
  ],
  "pacing": {
    "tension": <0-100>,
    "emotionalPayoff": <0-100>,
    "subplotConvergence": <0-100>,
    "overallRhythm": "Good" or "Needs Work" or "Excellent"
  },
  "observations": [
    {
      "type": "strength" or "warning" or "suggestion",
      "text": "Specific observation about the script"
    }
  ],
  "requirements": [
    {
      "text": "Specific structural suggestion or plot requirement",
      "completed": true or false
    }
  ]
}

RULES:
- Analyze ALL characters that appear in the script
- Score characters on voice consistency, arc progression, and dialogue quality
- Pacing metrics should reflect the actual narrative structure
- Observations should be specific and actionable (reference actual scenes/lines)
- Requirements should be story-structure milestones
- If the script is very short, adjust expectations accordingly
- Return ONLY valid JSON, no other text`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
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
    console.error("[ai-script-analysis]", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to analyze script" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
