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

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS
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

    const { scriptBlocks, aspectRatio, model } = await req.json();

    const extracted = [];
    let currentSlug = "INT. UNKNOWN - DAY";
    let shotCount = 1;

    const getLightingFromSlug = (slug: string) => {
      if (slug.toUpperCase().includes('NIGHT')) return 'Chiaroscuro / Neon Low Light';
      if (slug.toUpperCase().includes('EXT.')) return 'Natural High Contrast';
      return 'Diffused Practical Lighting';
    };

    const getColorGradeFromSlug = (slug: string) => {
      if (slug.toUpperCase().includes('NIGHT')) return 'Teal & Orange / Cyberpunk';
      if (slug.toUpperCase().includes('EXT.')) return 'Warm Golden Hour / Desaturated';
      return 'Neutral Cinematic';
    };

    scriptBlocks.forEach((block: ScriptBlock, index: number) => {
      if (block.type === 'slugline') {
        currentSlug = block.content;
      }

      if (block.type === 'action') {
        const context = scriptBlocks.slice(index + 1, index + 5);
        const dialogueBeat = context.find((b: ScriptBlock) => b.type === 'dialogue')?.content || '[Ambient Action]';

        const shotTypes = ['W.S', 'M.S', 'C.U', 'O.T.S', 'E.C.U'];
        const movements = ['Static / Locked', 'Slow Dolly In', 'Lateral Tracking Shot', 'Handheld / Shaky', 'Crane Down'];
        const angles = ['Normal Angle', 'Low Angle', 'High Angle', 'Dutch Angle'];
        const emotions = ['Tense', 'Melancholic', 'Suspenseful', 'Hopeful', 'Aggressive'];
        const lenses = ['14mm Ultra-Wide', '24mm Wide', '35mm Narrative', '50mm Prime', '85mm Portrait'];

        const isCloseUp = block.content.toLowerCase().match(/face|eyes|small|glowing|hand/);
        const isWide = block.content.toLowerCase().match(/skyline|city|room|landscape/);

        const currentShotType = isCloseUp ? 'C.U' : (isWide ? 'W.S' : shotTypes[index % shotTypes.length]);
        const currentLens = isCloseUp ? '85mm Portrait' : (isWide ? '14mm Ultra-Wide' : lenses[index % lenses.length]);

        extracted.push({
          id: block.id,
          sceneTitle: currentSlug,
          shotNumber: shotCount.toString().padStart(2, '0'),
          shotType: currentShotType,
          cameraAngle: angles[index % angles.length],
          movement: movements[index % movements.length],
          lens: currentLens,
          emotion: emotions[index % emotions.length],
          lighting: getLightingFromSlug(currentSlug),
          colorGrade: getColorGradeFromSlug(currentSlug),
          blockingNotes: `Actor enters from ${index % 2 === 0 ? 'Camera Left' : 'Camera Right'}. Maintain focus on foreground elements.`,
          visualPrompt: `High-end cinematography, ${block.content}. lens: ${currentLens}. aspect: ${aspectRatio}. ${getColorGradeFromSlug(currentSlug)} palette.`,
          audioTag: dialogueBeat,
          sfx: block.content.toLowerCase().includes('rain') ? 'Rain / Atmospheric Patter' : 'Dynamic Foley',
          transition: index === 0 ? 'FADE IN' : 'CUT TO',
          imageUrl: `https://images.unsplash.com/photo-${1550000000000 + (index * 123456)}?auto=format&fit=crop&q=80&w=1200`
        });
        shotCount++;
      }
    });

    return new Response(
      JSON.stringify(extracted.slice(0, 15)),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[generate-storyboard]", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to generate storyboard" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
