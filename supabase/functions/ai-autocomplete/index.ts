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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Fetch the API key securely from the database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.gemini_api_key) {
      return new Response(JSON.stringify({ error: "NO_API_KEY" }), { status: 400, headers: corsHeaders });
    }

    const { blocks, currentBlockIndex } = await req.json();
    const geminiApiKey = profile.gemini_api_key;

    const startIdx = Math.max(0, currentBlockIndex - 10);
    const contextBlocks = blocks.slice(startIdx, currentBlockIndex + 1);
    const currentBlock = blocks[currentBlockIndex];

    const scriptContext = contextBlocks.map((b: any) => {
      switch (b.type) {
        case 'slugline': return b.content.toUpperCase();
        case 'character': return `\n${b.content.toUpperCase()}`;
        case 'dialogue': return `  ${b.content}`;
        case 'parenthetical': return `  (${b.content.replace(/^\(|\)$/g, '')})`;
        case 'action': return `\n${b.content}`;
        default: return b.content;
      }
    }).join('\n');

    const prompt = `You are a professional screenwriter's AI assistant. Given the following screenplay context, continue writing the next 1-3 lines naturally in proper screenplay format.

SCREENPLAY CONTEXT:
${scriptContext}

CURRENT ELEMENT TYPE: ${currentBlock.type}
CURRENT TEXT SO FAR: "${currentBlock.content}"

RULES:
- Continue from where the text left off, matching the current element type (${currentBlock.type})
- If the current block is dialogue, continue the dialogue naturally
- If the current block is action, continue the action description
- Keep it brief: 1-3 lines maximum
- Do NOT include element type labels
- Just return the raw continuation text`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 150 }
        }),
      }
    );

    if (!res.ok) throw new Error("AI service error");

    const data = await res.json();
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(JSON.stringify({ suggestion }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
})