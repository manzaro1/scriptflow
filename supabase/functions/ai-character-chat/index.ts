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
    const { geminiApiKey, characterName, userMessage, characterDialogue, conversationHistory } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the character's voice profile from their dialogue in the script
    const dialogueLines = characterDialogue?.map((d: any) =>
      `[Scene: ${d.scene}] "${d.line}"`
    ).join('\n') || 'No dialogue written yet.';

    // Build conversation so far
    const historyText = conversationHistory?.map((m: any) =>
      m.role === 'user' ? `Writer: ${m.content}` : `${characterName}: ${m.content}`
    ).join('\n\n') || '';

    const prompt = `You are ${characterName}, a character in a screenplay. Stay in character at all times.

YOUR DIALOGUE FROM THE SCRIPT:
${dialogueLines}

Based on these lines, you have a specific voice, personality, and way of speaking. Maintain that voice consistently.

${historyText ? `CONVERSATION SO FAR:\n${historyText}\n\n` : ''}WRITER'S NEW MESSAGE: ${userMessage}

Respond as ${characterName} would. Stay in character. If the writer asks you to try a new line of dialogue, provide one in your voice. If they ask about your motivations, answer from the character's perspective. Keep responses concise (2-4 sentences). Do NOT break character or mention being an AI.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 300,
          }
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errBody}`);
    }

    const data = await res.json();
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
