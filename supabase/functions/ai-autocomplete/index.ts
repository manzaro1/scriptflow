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
    const { geminiApiKey, blocks, currentBlockIndex } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from surrounding blocks
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
- Do NOT include element type labels (like "CHARACTER:" or "ACTION:")
- Do NOT include formatting markers
- Just return the raw continuation text
- Match the tone and style of the existing script`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 150,
          }
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
